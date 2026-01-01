import SpotifyWebApi from 'spotify-web-api-node';
import { db } from '../db/index.js';
import { spotifyTokens } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class SpotifyService {
    private static spotifyApi: SpotifyWebApi;

    static initialize() {
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI || process.env.SPOTIFY_REDIRECT_URL;
        console.log('🎵 Initializing Spotify Service with Redirect URI:', redirectUri);

        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: redirectUri
        });
    }

    static getAuthUrl(state: string): string {
        const scopes = [
            'user-read-private',
            'user-read-email',
            'user-modify-playback-state',
            'user-read-playback-state',
            'streaming'
        ];
        return this.spotifyApi.createAuthorizeURL(scopes, state);
    }

    static async handleCode(userId: string, code: string): Promise<void> {
        try {
            const data = await this.spotifyApi.authorizationCodeGrant(code);
            const { access_token, refresh_token, expires_in } = data.body;

            const expiresAt = new Date(Date.now() + expires_in * 1000);

            // Save to DB
            await db.insert(spotifyTokens).values({
                userId,
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt
            }).onConflictDoUpdate({
                target: spotifyTokens.userId,
                set: {
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresAt,
                    updatedAt: new Date()
                }
            });

        } catch (error) {
            console.error('Error handling Spotify code:', error);
            throw new Error('Failed to authenticate with Spotify');
        }
    }

    static async getClient(userId: string): Promise<SpotifyWebApi | null> {
        // Fetch tokens from DB
        const tokens = await db.select().from(spotifyTokens).where(eq(spotifyTokens.userId, userId)).limit(1);

        if (!tokens.length) {
            return null;
        }

        const tokenData = tokens[0];
        const client = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: process.env.SPOTIFY_REDIRECT_URI || process.env.SPOTIFY_REDIRECT_URL
        });

        client.setAccessToken(tokenData.accessToken);
        client.setRefreshToken(tokenData.refreshToken);

        // Check if token is expired (giving 5 min buffer)
        if (new Date() > new Date(tokenData.expiresAt.getTime() - 5 * 60 * 1000)) {
            try {
                const data = await client.refreshAccessToken();
                const newAccessToken = data.body.access_token;
                const newExpiresIn = data.body.expires_in;
                const newExpiresAt = new Date(Date.now() + newExpiresIn * 1000);

                client.setAccessToken(newAccessToken);

                // Update DB
                await db.update(spotifyTokens)
                    .set({
                        accessToken: newAccessToken,
                        expiresAt: newExpiresAt,
                        updatedAt: new Date()
                    })
                    .where(eq(spotifyTokens.userId, userId));
            } catch (err) {
                console.error('Could not refresh access token', err);
                return null;
            }
        }

        return client;
    }

    // Playback controls
    static async play(userId: string, query?: string): Promise<string> {
        const client = await this.getClient(userId);
        if (!client) return 'You are not logged in. Use !spotify login';

        try {
            if (query) {
                const search = await client.searchTracks(query);
                if (search.body.tracks?.items.length) {
                    const track = search.body.tracks.items[0];
                    await client.play({ uris: [track.uri] });
                    return `Playing: ${track.name} by ${track.artists[0].name}`;
                } else {
                    return 'No tracks found.';
                }
            } else {
                await client.play();
                return 'Resumed playback.';
            }
        } catch (error: any) {
            // Handle specific errors like "No active device found"
            if (error.statusCode === 404) {
                return 'No active Spotify device found. Please open Spotify on a device.';
            }
            if (error.statusCode === 403) { // Premium required usually
                return 'Playback failed (Premium required for some features or API limitation).';
            }
            return `Error playing: ${error.message}`;
        }
    }

    static async pause(userId: string): Promise<string> {
        const client = await this.getClient(userId);
        if (!client) return 'You are not logged in.';
        try {
            await client.pause();
            return 'Paused.';
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }

    static async next(userId: string): Promise<string> {
        const client = await this.getClient(userId);
        if (!client) return 'You are not logged in.';
        try {
            await client.skipToNext();
            return 'Skipped to next.';
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }

    static async previous(userId: string): Promise<string> {
        const client = await this.getClient(userId);
        if (!client) return 'You are not logged in.';
        try {
            await client.skipToPrevious();
            return 'Skipped to previous.';
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }
}
