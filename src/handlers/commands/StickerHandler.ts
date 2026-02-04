import { CommandHandler, CommandContext } from '../../types/commands.js';
import { downloadMediaMessage } from 'baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export const StickerHandler: CommandHandler = {
    name: 'sticker',
    description: 'Convert an image or GIF/video to a sticker',
    usage: '!sticker [f/full] (reply to image/video or send with caption)',
    examples: ['!sticker', '!sticker f'],
    execute: async (context: CommandContext) => {
        const { socket, message, chat, args, sender } = context;

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
        const isSticker = !!targetMessage.stickerMessage;

        if (!isImage && !isVideo && !isSticker) {
            await socket.sendMessage(chat, { text: '❌ Please send an image/video with !sticker or reply to one (image/video/sticker).' });
            return;
        }

        // Limit video length
        if (isVideo && (targetMessage.videoMessage?.seconds || 0) > 10) {
            await socket.sendMessage(chat, { text: '❌ Video is too long. Please send a video/GIF with a maximum length of 10 seconds.' });
            return;
        }

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

            // Use pushName for a cleaner author name, fall back to JID prefix
            const authorName = message.pushName || (sender ? sender.split('@')[0] : 'WhatsApp Bot');
            const packName = 'game';

            console.log(`Creating sticker (isFull: ${isFull}) for ${authorName}...`);

            const sticker = new Sticker(buffer, {
                pack: packName,
                author: authorName,
                type: isFull ? StickerTypes.FULL : StickerTypes.CROPPED,
                categories: ['✨'],
                id: 'com.openclaw.sticker.pack',
                quality: 75
            });

            const stickerBuffer = await sticker.toBuffer();
            await socket.sendMessage(chat, { sticker: stickerBuffer }, { quoted: message as any });

        } catch (error) {
            console.error('Error creating sticker:', error);
            await socket.sendMessage(chat, { text: '❌ Failed to create sticker.' });
        }
    }
};
