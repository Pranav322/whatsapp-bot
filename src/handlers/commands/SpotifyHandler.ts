import { CommandHandler, CommandContext } from '../../types/commands.js';
import { SpotifyService } from '../../services/index.js';

export const SpotifyHandler: CommandHandler = {
    name: 'spotify',
    description: 'Control your Spotify playback',
    usage: '/play, /pause, /skip, /next',
    examples: ['/play', '/pause', '/next'],
    execute: async (context: CommandContext) => {
        const { socket, message, chat, sender, args, commandName } = context;
        
        // Map the direct command to the service action
        let action: 'play' | 'pause' | 'skip' | 'next';
        
        const cmd = commandName?.toLowerCase();
        if (cmd === 'play') action = 'play';
        else if (cmd === 'pause') action = 'pause';
        else if (cmd === 'skip' || cmd === 'next') action = 'skip';
        else {
            // Fallback for !spotify [action]
            action = args[0]?.toLowerCase() as any;
        }

        if (!['play', 'pause', 'skip', 'next'].includes(action)) {
            await socket.sendMessage(chat, { text: '❌ Invalid Spotify action. Use /play, /pause, /skip, or /next.' });
            return;
        }

        try {
            await SpotifyService.controlPlayback(sender, action);
            const emojis = { play: '▶️', pause: '⏸️', skip: '⏭️', next: '⏭️' };
            await socket.sendMessage(chat, { text: `${emojis[action]} Spotify ${action} success!` });
        } catch (error: any) {
            if (error.message === 'NOT_LINKED') {
                const authUrl = SpotifyService.getAuthUrl(sender);
                await socket.sendMessage(chat, { 
                    text: `❌ *Spotify account not linked.*\n\n1. Click this link to log in: ${authUrl}\n2. You will be redirected to a page that won't load.\n3. *Copy the full URL* of that page and paste it here.` 
                });
            } else if (error.message === 'NO_ACTIVE_DEVICE') {
                await socket.sendMessage(chat, { text: '❌ No active Spotify device found. Please open Spotify on your phone/PC and start playing something.' });
            } else {
                await socket.sendMessage(chat, { text: `❌ Spotify ${action} failed. Make sure you have Premium and an active session.` });
            }
        }
    }
};
