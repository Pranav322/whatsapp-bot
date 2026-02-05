import { WASocket, proto } from 'baileys';
import { commandHandlers } from './commands/index.js';
import { UserService, InstagramService, SpotifyService } from '../services/index.js';
import fs from 'fs';

export async function handleMessage(
    sock: WASocket,
    message: proto.IWebMessageInfo
): Promise<void> {
    // Check for required message key
    if (!message.key) return;

    const remoteJid = message.key.remoteJid;
    if (!remoteJid) return;

    // Log incoming message for debugging
    console.log(`📩 Received message from ${remoteJid}:`, JSON.stringify(message.message));

    // Extract text from different message types
    const textContent =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        "";

    if (!textContent) return;

    const text = textContent.trim();
    console.log(`Parsed text: "${text}"`);

    // 1. Detect Instagram Reels/Posts
    const instaRegex = /https?:\/\/(www\.)?instagram\.com\/(reels?|p)\/([a-zA-Z0-9_-]+)/;
    const instaMatch = text.match(instaRegex);

    if (instaMatch) {
        const url = instaMatch[0];
        console.log(`🎯 Instagram link detected: ${url}`);
        
        try {
            await sock.sendMessage(remoteJid, { text: '⏳ Processing Instagram video... please wait.' }, { quoted: message as any });
            
            const videoPath = await InstagramService.downloadReel(url);
            const videoBuffer = fs.readFileSync(videoPath);

            await sock.sendMessage(remoteJid, { 
                video: videoBuffer,
                caption: '✅ Here is your Instagram video!',
                mimetype: 'video/mp4'
            }, { quoted: message as any });

            // Cleanup
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
            return; // Stop processing after handling the link
        } catch (error) {
            console.error('❌ Error handling Instagram link:', error);
            await sock.sendMessage(remoteJid, { text: '❌ Failed to process Instagram video. The link might be private or invalid.' });
        }
    }

    // 2. Detect Spotify Auth Callback (Manual Copy-Paste)
    if (text.includes('/callback?code=')) {
        const codeMatch = text.match(/code=([a-zA-Z0-9_-]+)/);
        if (codeMatch) {
            const code = codeMatch[1];
            const sender = message.key.fromMe
                ? sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
                : (message.key.participant || remoteJid);
            
            try {
                await SpotifyService.linkAccount(sender!, code);
                await sock.sendMessage(remoteJid, { text: '✅ *Spotify Linked Successfully!* You can now use /play, /pause, /skip, etc.' }, { quoted: message as any });
                return;
            } catch (error) {
                await sock.sendMessage(remoteJid, { text: '❌ Failed to link Spotify. The code might be expired.' });
                return;
            }
        }
    }

    // Handle commands
    if (text.startsWith('!') || text.startsWith('/')) {
        try {
            const prefix = text[0];
            const [commandName, ...args] = text.slice(1).split(' ');
            const handler = commandHandlers.get(commandName.toLowerCase());

            console.log(`Command detected: ${commandName}, Lookup result: ${handler ? 'Found' : 'Not Found'}`);

            if (handler) {
                // Determine sender (User JID)
                const sender = message.key.fromMe
                    ? sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
                    : (message.key.participant || remoteJid);

                // Create user if not exists
                if (sender) {
                    await UserService.updateLastActive(sender);
                }

                // Execute command
                await handler.execute({
                    socket: sock,
                    message,
                    chat: remoteJid, // Chat ID (Group or DM)
                    sender: sender!,          // User ID (Who sent it)
                    args,
                    commandName
                });
            } else if (prefix === '!') {
                // Only log not found for ! commands to avoid conflict with standard / commands in groups
                console.log('Available commands:', Array.from(commandHandlers.keys()));
            }
        } catch (error) {
            console.error('❌ Error executing command:', error);
            await sock.sendMessage(remoteJid, { text: '❌ An error occurred while processing your command.' });
        }
    }
}
