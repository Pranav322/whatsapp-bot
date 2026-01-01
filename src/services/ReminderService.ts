import { db, reminders, Reminder } from '../db/index.js';
import { eq, and, asc } from 'drizzle-orm';
import { NotificationService } from './NotificationService.js';

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
    ): Promise<Reminder> {
        const [reminder] = await db.insert(reminders).values({
            userId,
            task,
            time,
            notifyUsers,
            groupId,
            isCompleted: false
        }).returning();

        await NotificationService.scheduleReminder(reminder);
        return reminder;
    }

    /**
     * List active reminders for a user
     */
    static async list(userId: string, includeCompleted = false): Promise<Reminder[]> {
        if (includeCompleted) {
            return await db.select()
                .from(reminders)
                .where(eq(reminders.userId, userId))
                .orderBy(asc(reminders.time));
        }

        return await db.select()
            .from(reminders)
            .where(and(eq(reminders.userId, userId), eq(reminders.isCompleted, false)))
            .orderBy(asc(reminders.time));
    }

    /**
     * Delete a reminder
     */
    static async delete(userId: string, reminderId: string): Promise<void> {
        const result = await db.select()
            .from(reminders)
            .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
            .limit(1);

        if (result.length > 0) {
            NotificationService.cancelReminder(reminderId);
            await db.delete(reminders).where(eq(reminders.id, reminderId));
        }
    }

    /**
     * Clear completed reminders
     */
    static async clearCompleted(userId: string): Promise<number> {
        const result = await db.delete(reminders)
            .where(and(eq(reminders.userId, userId), eq(reminders.isCompleted, true)))
            .returning();
        return result.length;
    }
}
