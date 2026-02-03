import { CommandHandler, CommandContext } from '../../types/commands.js';
import { NotifyHandler } from './NotifyHandler.js';
import { TodoHandler } from './TodoHandler.js';
import { NoteHandler } from './NoteHandler.js';
import { TimerHandler } from './TimerHandler.js';
import { GroupHandler } from './GroupHandler.js';
import { StickerHandler } from './StickerHandler.js';
import { SpotifyHandler, PlayHandler, PauseHandler, NextHandler, PreviousHandler } from './SpotifyHandler.js';

const commands = [
    NotifyHandler,
    TodoHandler,
    NoteHandler,
    TimerHandler,
    GroupHandler,
    StickerHandler,
    SpotifyHandler,
    PlayHandler,
    PauseHandler,
    NextHandler,
    PreviousHandler
];

export const HelpHandler: CommandHandler = {
    name: 'help',
    description: 'Show available commands and their usage',
    usage: '!help [command]',
    examples: [
        '!help',
        '!help notify',
        '!help todo'
    ],
    execute: async (context: CommandContext) => {
        const { socket, chat, args } = context;

        try {
            if (args.length === 0) {
                // Show general help
                const commandList = commands.map(cmd =>
                    `*!${cmd.name}*\nUsage: ${cmd.usage}\n${cmd.description}`
                ).join('\n\n');

                await socket.sendMessage(chat, {
                    text: `📚 *Available Commands:*\n\n${commandList}\n\nType !help <command> for detailed usage.`
                });
                return;
            }

            // Show specific command help
            const commandName = args[0].toLowerCase();
            const command = commands.find(cmd => cmd.name === commandName);

            if (!command) {
                await socket.sendMessage(chat, {
                    text: `❌ Command "${commandName}" not found. Type !help for available commands.`
                });
                return;
            }

            const helpText = [
                `📖 Help: !${command.name}`,
                `Description: ${command.description}`,
                `Usage: ${command.usage}`,
                '\nExamples:',
                ...command.examples
            ].join('\n');

            await socket.sendMessage(chat, { text: helpText });

        } catch (error) {
            console.error('Error in help command:', error);
            await socket.sendMessage(chat, {
                text: '❌ Failed to show help. Please try again.'
            });
        }
    }
};
