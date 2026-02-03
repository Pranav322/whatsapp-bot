import { CommandHandler, CommandContext } from '../../types/commands.js';
import { ReminderService } from '../../services/ReminderService.js';
import moment from 'moment';

export const NotifyHandler: CommandHandler = {
    name: 'notify',
    description: 'Set a reminder for yourself',
    usage: '!notify <task> <time>',
    examples: [
        '!notify call mom 30m',
        '!notify buy groceries 1h'
    ],
    execute: async (context: CommandContext) => {
        const { socket, chat, sender, args } = context;

        if (args.length < 2) {
            await socket.sendMessage(chat, {
                text: 'Usage: !notify <task> <time>'
            });
            return;
        }

        try {
            const task = args.slice(0, -1).join(' ');
            const timeStr = args[args.length - 1];

            // Parse time string (e.g., '30m', '1h', '2h30m')
            const duration = parseTimeString(timeStr);
            if (!duration) {
                await socket.sendMessage(chat, {
                    text: 'Invalid time format. Examples: 30m, 1h, 2h30m'
                });
                return;
            }

            const reminderTime = moment().add(duration, 'minutes').toDate();

            // Create reminder
            await ReminderService.create(
                sender,
                task,
                reminderTime
            );

            // Send confirmation
            const confirmMessage = `✅ Reminder set: "${task}" in ${formatDuration(duration)}`;

            await socket.sendMessage(chat, { text: confirmMessage });

        } catch (error) {
            console.error('Error in notify command:', error);
            await socket.sendMessage(chat, {
                text: '❌ Failed to set reminder. Please try again.'
            });
        }
    }
};

function parseTimeString(timeStr: string): number | null {
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

function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
        return `${hours}h ${mins}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${mins}m`;
    }
} 
