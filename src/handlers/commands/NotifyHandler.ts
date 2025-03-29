import { CommandHandler, CommandContext } from '../../types/commands';
import { ReminderService } from '../../services';
import moment from 'moment';

export const NotifyHandler: CommandHandler = {
    name: 'notify',
    description: 'Set a reminder for yourself or the group',
    usage: '!notify <task> <time> | !notify @me <task> <time> | !notify @all <task> <time>',
    examples: [
        '!notify call mom 30m',
        '!notify @me drink water 1h',
        '!notify @all team meeting 2h'
    ],
    execute: async (context: CommandContext) => {
        const { socket, chat, sender, args, isGroup } = context;

        if (args.length < 2) {
            await socket.sendMessage(chat, { 
                text: 'Usage: !notify <task> <time> or !notify @me/@all <task> <time>' 
            });
            return;
        }

        try {
            let task: string;
            let timeStr: string;
            let notifyUsers: string[] = [];
            let targetChat = chat;

            // Parse command based on whether it's a group command
            if (isGroup && (args[0] === '@me' || args[0] === '@all')) {
                const target = args[0];
                task = args.slice(1, -1).join(' ');
                timeStr = args[args.length - 1];

                if (target === '@me') {
                    targetChat = sender;
                } else if (target === '@all') {
                    notifyUsers = ['@all']; // Special case for group-wide notification
                }
            } else {
                task = args.slice(0, -1).join(' ');
                timeStr = args[args.length - 1];
                targetChat = sender;
            }

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
                reminderTime,
                notifyUsers,
                isGroup ? chat : undefined
            );

            // Send confirmation
            const confirmMessage = isGroup && args[0] === '@all'
                ? `✅ Group reminder set: "${task}" in ${formatDuration(duration)}`
                : `✅ Reminder set: "${task}" in ${formatDuration(duration)}`;

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