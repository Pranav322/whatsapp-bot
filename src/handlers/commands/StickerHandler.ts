import { CommandHandler, CommandContext } from '../../types/commands.js';
import { downloadMediaMessage } from 'baileys';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const StickerHandler: CommandHandler = {
    name: 'sticker',
    description: 'Convert an image or GIF/video to a sticker',
    usage: '!sticker [f/full] (reply to image/video or send with caption)',
    examples: ['!sticker', '!sticker f'],
    execute: async (context: CommandContext) => {
        const { socket, message, chat, args } = context;

        // Check for options
        const isFull = args.includes('f') || args.includes('full');

        // Check if the message is an image/video or a reply to one
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMessage = quotedMessage || message.message;

        if (!targetMessage) {
            await socket.sendMessage(chat, { text: '❌ Please send an image/video with !sticker or reply to one.' });
            return;
        }

        const isImage = !!targetMessage.imageMessage;
        const isVideo = !!targetMessage.videoMessage;

        if (!isImage && !isVideo) {
            await socket.sendMessage(chat, { text: '❌ Please send an image/video with !sticker or reply to one.' });
            return;
        }

        let tempInputPath = '';
        let tempOutputPath = '';

        try {
            // Retrieve the full message object for downloadMediaMessage
            let msgToDownload: any = message;

            if (quotedMessage) {
                msgToDownload = {
                    key: {
                        remoteJid: chat,
                        fromMe: false,
                        id: message.message?.extendedTextMessage?.contextInfo?.stanzaId || 'FAKE_ID',
                        participant: message.message?.extendedTextMessage?.contextInfo?.participant
                    },
                    message: quotedMessage,
                    messageTimestamp: message.messageTimestamp
                };
            }

            console.log('Downloading media from message...');
            const buffer = await downloadMediaMessage(
                msgToDownload,
                'buffer',
                {},
                {
                    logger: socket.logger,
                    reuploadRequest: socket.updateMediaMessage
                }
            );

            if (isVideo) {
                console.log('Processing video sticker...');
                // Save buffer to temp file
                const tempDir = os.tmpdir();
                tempInputPath = path.join(tempDir, `sticker-in-${Date.now()}.mp4`);
                tempOutputPath = path.join(tempDir, `sticker-out-${Date.now()}.webp`);

                await fs.promises.writeFile(tempInputPath, buffer);

                // FFmpeg command for video -> webp
                // -t 10: Max 10 seconds
                // -vf: Scale to 512x512, maintaining aspect ratio with padding (transparent)
                // -loop 0: Infinite loop
                // -fs 800000: Limit file size? No standard is 1MB limit for WA stickers, try to keep quality decent.
                const resizeFilter = isFull
                    ? `scale=512:512:force_original_aspect_ratio=increase,crop=512:512`
                    : `scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000`;

                const command = `ffmpeg -i "${tempInputPath}" -vcodec libwebp -vf "${resizeFilter}" -lossless 0 -compression_level 4 -q:v 50 -loop 0 -an -fps_mode passthrough -t 10 "${tempOutputPath}"`;

                await execAsync(command);

                const webpBuffer = await fs.promises.readFile(tempOutputPath);
                await socket.sendMessage(chat, { sticker: webpBuffer }, { quoted: message as any });

            } else {
                console.log('Processing image sticker...');
                // Convert to sticker using sharp
                const resizeOptions: any = {
                    fit: isFull ? 'cover' : 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                };

                const processedBuffer = await sharp(buffer)
                    .resize(512, 512, resizeOptions)
                    .webp({ quality: 50 })
                    .toBuffer();

                await socket.sendMessage(chat, { sticker: processedBuffer }, { quoted: message as any });
            }

        } catch (error) {
            console.error('Error creating sticker:', error);
            await socket.sendMessage(chat, { text: '❌ Failed to create sticker.' });
        } finally {
            // Cleanup temp files
            if (tempInputPath && fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
            if (tempOutputPath && fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        }
    }
};
