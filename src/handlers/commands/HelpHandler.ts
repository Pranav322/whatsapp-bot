import { CommandHandler, CommandContext } from '../../types/commands';
import { NotifyHandler } from './NotifyHandler';
import { TodoHandler } from './TodoHandler';
import { NoteHandler } from './NoteHandler';
import { TimerHandler } from './TimerHandler';

const commands = [
    NotifyHandler,
    TodoHandler,
    NoteHandler,
    TimerHandler
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
                    `!${cmd.name} - ${cmd.description}`
                ).join('\n');

                await socket.sendMessage(chat, { 
                    text: `📚 Available Commands:\n\n${commandList}\n\nType !help <command> for detailed usage.` 
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