import { CommandHandler, CommandContext } from '../../types/commands';
import { TimerService } from '../../services';

function parseTimeString(timeStr: string): number | null {
    // If it's just a number, treat as minutes
    if (/^\d+$/.test(timeStr)) {
        return parseInt(timeStr);
    }

    // Parse time notation (e.g., '30m', '1h')
    const hourMatch = timeStr.match(/(\d+)h/);
    const minuteMatch = timeStr.match(/(\d+)m/);

    let totalMinutes = 0;

    if (hourMatch) {
        totalMinutes += parseInt(hourMatch[1]) * 60;
    }
    if (minuteMatch) {
        totalMinutes += parseInt(minuteMatch[1]);
    }

    return totalMinutes > 0 ? totalMinutes : null;
}

export const TimerHandler: CommandHandler = {
    name: 'timer',
    description: 'Set and manage timers',
    usage: '!timer start <duration> | !timer list | !timer cancel <number>',
    examples: [
        '!timer start 30m',
        '!timer start 1h',
        '!timer start 30',
        '!timer list',
        '!timer cancel 1'
    ],
    execute: async (context: CommandContext) => {
        const { socket, chat, sender, args } = context;

        if (args.length === 0) {
            await socket.sendMessage(chat, { text: 'Usage: ' + TimerHandler.usage });
            return;
        }

        try {
            const subCommand = args[0].toLowerCase();

            switch (subCommand) {
                case 'start':
                    if (args.length < 2) {
                        await socket.sendMessage(chat, { 
                            text: 'Please specify a duration (e.g., 30m, 1h, or just 30 for minutes).' 
                        });
                        return;
                    }

                    const duration = parseTimeString(args[1]);
                    if (!duration) {
                        await socket.sendMessage(chat, { 
                            text: 'Invalid duration format. Examples: 30m, 1h, or just 30 for minutes.' 
                        });
                        return;
                    }

                    if (duration > 1440) { // 24 hours
                        await socket.sendMessage(chat, { 
                            text: 'Timer duration cannot exceed 24 hours.' 
                        });
                        return;
                    }

                    await TimerService.create(sender, duration);
                    await socket.sendMessage(chat, { 
                        text: `⏰ Timer set for ${duration} minutes!` 
                    });
                    break;

                case 'list':
                    const timers = await TimerService.list(sender);
                    if (timers.length === 0) {
                        await socket.sendMessage(chat, { text: 'No active timers.' });
                        return;
                    }

                    const timerList = timers.map((timer, index) => {
                        const remainingTime = Math.max(0, 
                            Math.floor((timer.endTime.getTime() - Date.now()) / 60000)
                        );
                        return `${index + 1}. ⏳ ${remainingTime} minutes remaining`;
                    }).join('\n');

                    await socket.sendMessage(chat, { 
                        text: '⏰ Active Timers:\n' + timerList 
                    });
                    break;

                case 'cancel':
                    if (args.length !== 2 || isNaN(parseInt(args[1]))) {
                        await socket.sendMessage(chat, { 
                            text: 'Please specify the timer number to cancel.' 
                        });
                        return;
                    }

                    const timers2 = await TimerService.list(sender);
                    const timerIndex = parseInt(args[1]) - 1;

                    if (timerIndex < 0 || timerIndex >= timers2.length) {
                        await socket.sendMessage(chat, { text: 'Invalid timer number.' });
                        return;
                    }

                    await TimerService.cancel(sender, timers2[timerIndex].id);
                    await socket.sendMessage(chat, { text: '⏰ Timer cancelled successfully!' });
                    break;

                default:
                    await socket.sendMessage(chat, { 
                        text: 'Unknown command. Use: start, list, or cancel.' 
                    });
            }
        } catch (error) {
            console.error('Error in timer command:', error);
            await socket.sendMessage(chat, { 
                text: '❌ Failed to process timer command. Please try again.' 
            });
        }
    }
}; 