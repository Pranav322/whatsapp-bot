import { CommandHandler, CommandContext } from '../../types/commands.js';
import { SpotifyService } from '../../services/index.js';

export const SpotifyHandler: CommandHandler = {
    name: 'spotify',
    description: 'Manage Spotify playback and authentication',
    usage: '!spotify <login|code|status> [args]',
    examples: ['!spotify login', '!spotify code 12345'],
    execute: async (context: CommandContext): Promise<void> => {
        const { socket, chat, args, sender } = context;

        if (args.length === 0) {
            await socket.sendMessage(chat, {
                text: 'Usage:\n!spotify login\n!spotify code <CODE>\n!play [song]\n!pause\n!next\n!previous'
            });
            return;
        }

        const subCommand = args[0].toLowerCase();

        try {
            switch (subCommand) {
                case 'login': {
                    const url = SpotifyService.getAuthUrl(sender);
                    await socket.sendMessage(chat, {
                        text: `Authorize here:\n${url}\n\n*Automatic Login:* If the callback works, you'll be logged in automatically.\n\n*Manual Login:* If you are redirected to a page that fails to load (e.g. localhost), copy the code from the URL (parameter 'code=...') and send:\n!spotify code <YOUR_CODE>`
                    });
                    break;
                }
                case 'code': {
                    if (args.length < 2) {
                        await socket.sendMessage(chat, { text: 'Please provide the code.' });
                        return;
                    }
                    const code = args[1];
                    try {
                        await SpotifyService.handleCode(sender, code);
                        await socket.sendMessage(chat, { text: '✅ Successfully logged in to Spotify!' });
                    } catch (error) {
                        await socket.sendMessage(chat, { text: '❌ Login failed. Internal error or invalid code.' });
                    }
                    break;
                }
                case 'status': {
                    // TODO: Implement status check if needed
                    await socket.sendMessage(chat, { text: 'Spotify status check not implemented yet.' });
                    break;
                }
                default: {
                    await socket.sendMessage(chat, { text: 'Unknown spotify command. Use login or code.' });
                }
            }
        } catch (error: any) {
            console.error('Spotify command error:', error);
            await socket.sendMessage(chat, { text: `Error: ${error.message}` });
        }
    }
};

// Handlers for shortcuts like !play, !pause etc.
export const PlayHandler: CommandHandler = {
    name: 'play',
    description: 'Play music on Spotify',
    usage: '!play [query]',
    examples: ['!play', '!play Bohemian Rhapsody'],
    execute: async (context: CommandContext): Promise<void> => {
        const { socket, chat, args, sender } = context;
        const query = args.length > 0 ? args.join(' ') : undefined;
        const result = await SpotifyService.play(sender, query);
        await socket.sendMessage(chat, { text: result });
    }
};

export const PauseHandler: CommandHandler = {
    name: 'pause',
    description: 'Pause Spotify playback',
    usage: '!pause',
    examples: ['!pause'],
    execute: async (context: CommandContext): Promise<void> => {
        const { socket, chat, sender } = context;
        const result = await SpotifyService.pause(sender);
        await socket.sendMessage(chat, { text: result });
    }
};

export const NextHandler: CommandHandler = {
    name: 'next',
    description: 'Skip to next track',
    usage: '!next',
    examples: ['!next'],
    execute: async (context: CommandContext): Promise<void> => {
        const { socket, chat, sender } = context;
        const result = await SpotifyService.next(sender);
        await socket.sendMessage(chat, { text: result });
    }
};

export const PreviousHandler: CommandHandler = {
    name: 'previous',
    description: 'Skip to previous track',
    usage: '!previous',
    examples: ['!previous'],
    execute: async (context: CommandContext): Promise<void> => {
        const { socket, chat, sender } = context;
        const result = await SpotifyService.previous(sender);
        await socket.sendMessage(chat, { text: result });
    }
};
