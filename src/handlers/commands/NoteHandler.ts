import { CommandHandler, CommandContext } from '../../types/commands';
import { NoteService } from '../../services';

export const NoteHandler: CommandHandler = {
    name: 'note',
    description: 'Manage your notes',
    usage: '!note <save/list/view/delete/search> [content/number/query]',
    examples: [
        '!note save Remember to buy milk',
        '!note list',
        '!note view 1',
        '!note delete 2',
        '!note search milk'
    ],
    execute: async (context: CommandContext) => {
        const { socket, chat, sender, args } = context;

        if (args.length === 0) {
            await socket.sendMessage(chat, { text: 'Usage: ' + NoteHandler.usage });
            return;
        }

        const subCommand = args[0].toLowerCase();

        try {
            switch (subCommand) {
                case 'save':
                    if (args.length < 2) {
                        await socket.sendMessage(chat, { text: 'Please specify the note content.' });
                        return;
                    }
                    const content = args.slice(1).join(' ');
                    await NoteService.create(sender, content);
                    await socket.sendMessage(chat, { text: '📝 Note saved successfully!' });
                    break;

                case 'list':
                    const notes = await NoteService.list(sender);
                    if (notes.length === 0) {
                        await socket.sendMessage(chat, { text: 'No notes found.' });
                        return;
                    }

                    const noteList = notes.map((note, index) => {
                        const preview = note.content.length > 50 
                            ? note.content.substring(0, 47) + '...' 
                            : note.content;
                        return `${index + 1}. ${preview}`;
                    }).join('\n');

                    await socket.sendMessage(chat, { 
                        text: '📚 Your Notes:\n' + noteList 
                    });
                    break;

                case 'view':
                    if (args.length !== 2 || isNaN(parseInt(args[1]))) {
                        await socket.sendMessage(chat, { 
                            text: 'Please specify the note number to view.' 
                        });
                        return;
                    }

                    const viewNotes = await NoteService.list(sender);
                    const viewIndex = parseInt(args[1]) - 1;

                    if (viewIndex < 0 || viewIndex >= viewNotes.length) {
                        await socket.sendMessage(chat, { text: 'Invalid note number.' });
                        return;
                    }

                    await socket.sendMessage(chat, { 
                        text: `📖 Note #${args[1]}:\n${viewNotes[viewIndex].content}` 
                    });
                    break;

                case 'delete':
                    if (args.length !== 2 || isNaN(parseInt(args[1]))) {
                        await socket.sendMessage(chat, { 
                            text: 'Please specify the note number to delete.' 
                        });
                        return;
                    }

                    const deleteNotes = await NoteService.list(sender);
                    const deleteIndex = parseInt(args[1]) - 1;

                    if (deleteIndex < 0 || deleteIndex >= deleteNotes.length) {
                        await socket.sendMessage(chat, { text: 'Invalid note number.' });
                        return;
                    }

                    await NoteService.delete(sender, deleteNotes[deleteIndex].id);
                    await socket.sendMessage(chat, { text: '🗑️ Note deleted successfully!' });
                    break;

                case 'search':
                    if (args.length < 2) {
                        await socket.sendMessage(chat, { 
                            text: 'Please specify a search query.' 
                        });
                        return;
                    }

                    const query = args.slice(1).join(' ');
                    const searchResults = await NoteService.search(sender, query);

                    if (searchResults.length === 0) {
                        await socket.sendMessage(chat, { 
                            text: 'No notes found matching your search.' 
                        });
                        return;
                    }

                    const resultList = searchResults.map((note, index) => {
                        const preview = note.content.length > 50 
                            ? note.content.substring(0, 47) + '...' 
                            : note.content;
                        return `${index + 1}. ${preview}`;
                    }).join('\n');

                    await socket.sendMessage(chat, { 
                        text: `🔍 Search Results for "${query}":\n${resultList}` 
                    });
                    break;

                default:
                    await socket.sendMessage(chat, { 
                        text: 'Unknown subcommand. Use: save, list, view, delete, or search.' 
                    });
            }
        } catch (error) {
            console.error('Error in note command:', error);
            await socket.sendMessage(chat, { 
                text: '❌ Failed to process note command. Please try again.' 
            });
        }
    }
}; 