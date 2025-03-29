import { WASocket, proto } from '@whiskeysockets/baileys';
import { commandHandlers } from './commands';
import { CommandContext } from '../types/commands';
import { UserService, GroupService } from '../services';

export async function handleMessage(sock: WASocket, message: proto.IWebMessageInfo) {
    const chat = message.key.remoteJid;
    try {
        const messageText = message.message?.conversation || 
                          message.message?.extendedTextMessage?.text || '';
        const sender = message.key.participant || message.key.remoteJid || '';

        // Ignore if not a text message or no chat
        if (!chat || !messageText) return;

        // Check if it's a command (starts with !)
        if (!messageText.startsWith('!')) return;

        // Parse command and arguments
        const [commandName, ...args] = messageText.slice(1).split(' ');
        const isGroup = chat.endsWith('@g.us');

        // Get command handler
        const handler = commandHandlers.get(commandName.toLowerCase());
        if (!handler) {
            await sock.sendMessage(chat, { 
                text: 'Unknown command. Type !help for available commands.' 
            });
            return;
        }

        // Create command context
        const context: CommandContext = {
            socket: sock,
            message,
            chat,
            sender,
            args,
            isGroup
        };

        // Check group permissions if it's a group chat
        if (isGroup) {
            const isAllowed = await GroupService.isCommandAllowed(chat, commandName);
            if (!isAllowed) {
                await sock.sendMessage(chat, { 
                    text: '❌ This command is not allowed in this group.' 
                });
                return;
            }
        }

        // Update user's last active timestamp
        await UserService.updateLastActive(sender);

        // Execute command
        await handler.execute(context);

    } catch (error) {
        console.error('Error handling message:', error);
        if (chat) {
            await sock.sendMessage(chat, { 
                text: '❌ An error occurred while processing your command.' 
            });
        }
    }
} 