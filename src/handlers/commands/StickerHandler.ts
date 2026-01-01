import { CommandHandler, CommandContext } from '../../types/commands.js';
import { downloadMediaMessage } from 'baileys';
import sharp from 'sharp';

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

        try {
            // Retrieve the full message object for downloadMediaMessage
            // If it's a quoted message, we need to construct a fake message object for the downloader
            const msgToDownload = quotedMessage
                ? { key: {}, message: quotedMessage }
                : message;

            const buffer = await downloadMediaMessage(
                msgToDownload as any,
                'buffer',
                {},
                {
                    logger: socket.logger,
                    reuploadRequest: socket.updateMediaMessage
                }
            );

            // Convert to sticker using sharp
            const resizeOptions: any = {
                fit: isFull ? 'cover' : 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            };

            const processedBuffer = await sharp(buffer, { animated: isVideo })
                .resize(512, 512, resizeOptions)
                .webp({ quality: 50 })
                .toBuffer();

            await socket.sendMessage(chat, { sticker: processedBuffer }, { quoted: message as any });

        } catch (error) {
            console.error('Error creating sticker:', error);
            await socket.sendMessage(chat, { text: '❌ Failed to create sticker. Error: ' + (error as any).message });
        }
    }
};
