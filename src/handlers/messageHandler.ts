import { WASocket, proto } from 'baileys';
import { commandHandlers } from './commands/index.js';
import { GroupService, UserService } from '../services/index.js';

export async function handleMessage(
    sock: WASocket,
    message: proto.IWebMessageInfo
): Promise<void> {
    // Check for required message key
    if (!message.key) return;

    const remoteJid = message.key.remoteJid;
    if (!remoteJid) return;

    // Extract text from different message types
    const textContent =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        "";

    if (!textContent) return;

    const text = textContent.trim();

    // Debug logging
    // console.log(`📨 Message received:`, {
    //     from: remoteJid,
    //     fromMe: message.key.fromMe,
    //     text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    // });

    // Handle commands
    if (text.startsWith('!')) {
        const [commandName, ...args] = text.slice(1).split(' ');
        const handler = commandHandlers.get(commandName.toLowerCase());

        if (handler) {
            const isGroup = remoteJid.endsWith('@g.us');
            const sender = message.key.fromMe
                ? sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
                : (isGroup ? message.key.participant : remoteJid);

            // Create user if not exists
            if (sender) {
                await UserService.updateLastActive(sender);
            }

            // Check group permissions if it's a group
            if (isGroup) {
                const isAllowed = await GroupService.isCommandAllowed(remoteJid, commandName);
                if (!isAllowed) {
                    // Optionally notify that command is disabled
                    return;
                }

                // Check if user is banned
                if (sender) {
                    const isBanned = await GroupService.isUserBanned(remoteJid, sender);
                    if (isBanned) {
                        return;
                    }
                }
            }

            // Execute command
            if (sender) {
                await handler.execute({
                    socket: sock,
                    message,
                    chat: remoteJid,
                    sender,
                    args,
                    isGroup
                });
            }
        }
    }
}
