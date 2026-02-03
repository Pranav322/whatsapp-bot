import { WASocket, proto } from 'baileys';
import { commandHandlers } from './commands/index.js';
import { UserService } from '../services/index.js';

export async function handleMessage(
    sock: WASocket,
    message: proto.IWebMessageInfo
): Promise<void> {
    // Check for required message key
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

    // Handle commands
    if (text.startsWith('!')) {
        try {
            const [commandName, ...args] = text.slice(1).split(' ');
            const handler = commandHandlers.get(commandName.toLowerCase());

            console.log(`Command detected: ${commandName}, Loopup result: ${handler ? 'Found' : 'Not Found'}`);

            if (handler) {
                // Determine sender (User JID)
                // In groups: participant is the user, remoteJid is the group
                // In DMs: remoteJid is the user, participant is usually undefined
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
                    sender,          // User ID (Who sent it)
                    args
                });
            } else {
                // Log available commands to help debug
                console.log('Available commands:', Array.from(commandHandlers.keys()));
            }
        } catch (error) {
            console.error('❌ Error executing command:', error);
            await sock.sendMessage(remoteJid, { text: '❌ An error occurred while processing your command.' });
        }
    }
}
