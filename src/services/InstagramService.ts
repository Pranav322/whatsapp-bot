import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

export class InstagramService {
    private static binPath = path.join(process.cwd(), 'bin', 'yt-dlp');

    /**
     * Downloads an Instagram Reel and returns the file path
     * @param url Instagram URL
     * @returns Path to the downloaded video file
     */
    static async downloadReel(url: string): Promise<string> {
        const tempDir = os.tmpdir();
        const outputFilename = `insta-${Date.now()}.mp4`;
        const outputPath = path.join(tempDir, outputFilename);
        const cookiePath = path.join(process.cwd(), 'cookie.txt');

        try {
            // yt-dlp command with cookies
            // -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' - ensures mp4
            // --no-playlist - avoids downloading whole profiles
            // --user-agent - mimic a real browser to bypass basic blocks
            // --cookies - provide session cookies for authentication
            const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
            
            let command = `"${this.binPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --no-playlist --user-agent "${userAgent}"`;
            
            if (fs.existsSync(cookiePath)) {
                command += ` --cookies "${cookiePath}"`;
                console.log('Using cookies for Instagram download.');
            }
            
            command += ` -o "${outputPath}" "${url}"`;
            
            console.log(`Executing: ${command.replace(cookiePath, 'HIDDEN_COOKIES')}`);
            await execAsync(command);

            if (!fs.existsSync(outputPath)) {
                throw new Error('File was not downloaded');
            }

            return outputPath;
        } catch (error) {
            console.error('Error downloading Instagram reel:', error);
            throw error;
        }
    }
}
