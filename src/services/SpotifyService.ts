import axiosLib from 'axios';
const axios: any = (axiosLib as any).default || axiosLib;
import { db, users } from '../db/index.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

export class SpotifyService {
    private static clientId = process.env.SPOTIFY_CLIENT_ID || '';
    private static clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    private static redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8888/callback';

    /**
     * Generates a Spotify Authorization URL for a specific user
     */
    static getAuthUrl(userId: string): string {
        const scopes = [
            'user-modify-playback-state',
            'user-read-playback-state',
            'user-read-currently-playing'
        ];

        return `https://accounts.spotify.com/authorize?` +
            `client_id=${this.clientId}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
            `&scope=${encodeURIComponent(scopes.join(' '))}` +
            `&state=${userId}`;
    }

    /**
     * Exchanges auth code for a refresh token and saves it to the user
     */
    static async linkAccount(userId: string, code: string): Promise<void> {
        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('code', code);
            params.append('redirect_uri', this.redirectUri);

            const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

            const response = await axios.post('https://accounts.spotify.com/api/token', params, {
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { refresh_token } = response.data;

            await db.update(users)
                .set({ spotifyRefreshToken: refresh_token })
                .where(eq(users.userId, userId));

        } catch (error) {
            console.error('Spotify Link Error:', error);
            throw new Error('Failed to link Spotify account.');
        }
    }

    /**
     * Gets a fresh access token using the saved refresh token
     */
    private static async getAccessToken(userId: string): Promise<string | null> {
        const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
        
        if (!user || !user.spotifyRefreshToken) {
            return null;
        }

        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token');
            params.append('refresh_token', user.spotifyRefreshToken);

            const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

            const response = await axios.post('https://accounts.spotify.com/api/token', params, {
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data.access_token;
        } catch (error) {
            console.error('Spotify Token Refresh Error:', error);
            return null;
        }
    }

    /**
     * Performs a playback action
     */
    static async controlPlayback(userId: string, action: 'play' | 'pause' | 'skip' | 'next'): Promise<void> {
        const token = await this.getAccessToken(userId);
        if (!token) {
            throw new Error('NOT_LINKED');
        }

        const endpoints: Record<string, { method: string, url: string }> = {
            'play': { method: 'PUT', url: 'https://api.spotify.com/v1/me/player/play' },
            'pause': { method: 'PUT', url: 'https://api.spotify.com/v1/me/player/pause' },
            'skip': { method: 'POST', url: 'https://api.spotify.com/v1/me/player/next' },
            'next': { method: 'POST', url: 'https://api.spotify.com/v1/me/player/next' }
        };

        const { method, url } = endpoints[action];

        try {
            await axios({
                method,
                url,
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('NO_ACTIVE_DEVICE');
            }
            console.error(`Spotify Action (${action}) Error:`, error.response?.data || error.message);
            throw new Error('ACTION_FAILED');
        }
    }
}
