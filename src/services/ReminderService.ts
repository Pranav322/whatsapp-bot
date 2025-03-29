import { Reminder, IReminderModel } from '../models';
import { NotificationService } from './NotificationService';

export class ReminderService {
    /**
     * Create a new reminder
     */
    static async create(
        userId: string,
        task: string,
        time: Date,
        notifyUsers: string[] = [],
        groupId?: string
    ): Promise<IReminderModel> {
        const reminder = await Reminder.create({
            userId,
            task,
            time,
            notifyUsers,
            groupId,
            isCompleted: false
        });

        await NotificationService.scheduleReminder(reminder);
        return reminder;
    }

    /**
     * List active reminders for a user
     */
    static async list(userId: string, includeCompleted = false): Promise<IReminderModel[]> {
        const query: { userId: string; isCompleted?: boolean } = { userId };
        
        if (!includeCompleted) {
            query.isCompleted = false;
        }

        return await Reminder.find(query).sort({ time: 1 });
    }

    /**
     * Delete a reminder
     */
    static async delete(userId: string, reminderId: string): Promise<void> {
        const reminder = await Reminder.findOne({ _id: reminderId, userId });
        if (reminder) {
            NotificationService.cancelReminder(reminderId);
            await Reminder.deleteOne({ _id: reminderId });
        }
    }

    /**
     * Clear completed reminders
     */
    static async clearCompleted(userId: string): Promise<number> {
        const result = await Reminder.deleteMany({
            userId,
            isCompleted: true
        });
        return result.deletedCount || 0;
    }
} 