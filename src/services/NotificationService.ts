import { WASocket } from '@whiskeysockets/baileys';
import { Reminder, Timer } from '../models';
import * as cron from 'node-cron';

export class NotificationService {
    private static waSocket: WASocket | null = null;
    private static reminderJobs: Map<string, cron.ScheduledTask> = new Map();
    private static timerJobs: Map<string, cron.ScheduledTask> = new Map();

    /**
     * Initialize the notification service
     */
    static initialize(socket: WASocket) {
        NotificationService.waSocket = socket;
        NotificationService.loadActiveNotifications();
    }

    /**
     * Cleanup service resources
     */
    static cleanup() {
        // Stop all reminder jobs
        for (const [reminderId, task] of NotificationService.reminderJobs) {
            task.stop();
        }
        NotificationService.reminderJobs.clear();

        // Stop all timer jobs
        for (const [timerId, task] of NotificationService.timerJobs) {
            task.stop();
        }
        NotificationService.timerJobs.clear();
        NotificationService.waSocket = null;
    }

    /**
     * Load all active notifications from database
     */
    private static async loadActiveNotifications() {
        await Promise.all([
            NotificationService.loadActiveReminders(),
            NotificationService.loadActiveTimers()
        ]);
    }

    /**
     * Load active reminders
     */
    private static async loadActiveReminders() {
        const activeReminders = await Reminder.find({
            isCompleted: false,
            time: { $gt: new Date() }
        });

        for (const reminder of activeReminders) {
            await NotificationService.scheduleReminder(reminder);
        }
    }

    /**
     * Load active timers
     */
    private static async loadActiveTimers() {
        const activeTimers = await Timer.find({
            isActive: true,
            endTime: { $gt: new Date() }
        });

        for (const timer of activeTimers) {
            await NotificationService.scheduleTimer(timer);
        }
    }

    /**
     * Schedule a reminder notification
     */
    static async scheduleReminder(reminder: any) {
        if (!NotificationService.waSocket) {
            throw new Error('WhatsApp socket not initialized');
        }

        const now = new Date();
        if (reminder.time <= now) return;

        const job = cron.schedule(NotificationService.getScheduleExpression(reminder.time), async () => {
            await NotificationService.sendReminderNotification(reminder);
            NotificationService.reminderJobs.delete(reminder.id);
        });

        NotificationService.reminderJobs.set(reminder.id, job);
    }

    /**
     * Schedule a timer notification
     */
    static async scheduleTimer(timer: any) {
        if (!NotificationService.waSocket) {
            throw new Error('WhatsApp socket not initialized');
        }

        const now = new Date();
        if (timer.endTime <= now) return;

        const job = cron.schedule(NotificationService.getScheduleExpression(timer.endTime), async () => {
            await NotificationService.sendTimerNotification(timer);
            NotificationService.timerJobs.delete(timer.id);
        });

        NotificationService.timerJobs.set(timer.id, job);
    }

    /**
     * Cancel a reminder notification
     */
    static cancelReminder(reminderId: string) {
        const job = NotificationService.reminderJobs.get(reminderId);
        if (job) {
            job.stop();
            NotificationService.reminderJobs.delete(reminderId);
        }
    }

    /**
     * Cancel a timer notification
     */
    static cancelTimer(timerId: string) {
        const job = NotificationService.timerJobs.get(timerId);
        if (job) {
            job.stop();
            NotificationService.timerJobs.delete(timerId);
        }
    }

    /**
     * Send reminder notification
     */
    private static async sendReminderNotification(reminder: any) {
        if (!NotificationService.waSocket) return;

        const message = `🔔 Reminder: ${reminder.task}`;

        try {
            if (reminder.groupId) {
                // Send to group
                await NotificationService.waSocket.sendMessage(reminder.groupId, { text: message });
            } else {
                // Send to individual users
                const recipients = [reminder.userId, ...reminder.notifyUsers];
                for (const recipient of recipients) {
                    await NotificationService.waSocket.sendMessage(recipient, { text: message });
                }
            }

            // Mark reminder as completed
            await Reminder.updateOne(
                { _id: reminder.id },
                { $set: { isCompleted: true } }
            );
        } catch (error) {
            console.error('Error sending reminder notification:', error);
        }
    }

    /**
     * Send timer notification
     */
    private static async sendTimerNotification(timer: any) {
        if (!NotificationService.waSocket) return;

        const message = `⏰ Timer completed: ${timer.duration} minutes have passed!`;

        try {
            await NotificationService.waSocket.sendMessage(timer.userId, { text: message });

            // Mark timer as inactive
            await Timer.updateOne(
                { _id: timer.id },
                { $set: { isActive: false } }
            );
        } catch (error) {
            console.error('Error sending timer notification:', error);
        }
    }

    /**
     * Convert Date to cron expression
     */
    private static getScheduleExpression(date: Date): string {
        return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
    }
} 