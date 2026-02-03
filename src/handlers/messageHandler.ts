import { WASocket, proto } from 'baileys';
import { commandHandlers } from './commands/index.js';
import { UserService } from '../services/index.js';

export async function handleMessage(
    sock: WASocket,
    message: proto.IWebMessageInfo
): Promise<void> {
    // Check for required message key
    if (!message.key) return;

    const remoteJid = message.key.remoteJid;
    if (!remoteJid) return;

    // Ignore group messages
    if (remoteJid.endsWith('@g.us')) return;

    // Extract text from different message types
    const textContent =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        "";

    if (!textContent) return;

    const text = textContent.trim();

    // Handle commands
    if (text.startsWith('!')) {
        const [commandName, ...args] = text.slice(1).split(' ');
        const handler = commandHandlers.get(commandName.toLowerCase());

        if (handler) {
            const sender = message.key.fromMe
                ? sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
                : remoteJid;

            // Create user if not exists
            if (sender) {
                await UserService.updateLastActive(sender);
            }

            // Execute command
            if (sender) {
                await handler.execute({
                    socket: sock,
                    message,
                    chat: remoteJid,
                    sender,
                    args
                });
            }
        }
    }
}
