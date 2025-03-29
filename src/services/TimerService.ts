import { Timer, ITimerModel } from '../models';
import { WASocket } from '@whiskeysockets/baileys';
import * as cron from 'node-cron';

export class TimerService {
    private static activeTimers: Map<string, cron.ScheduledTask> = new Map();
    private static waSocket: WASocket | null = null;

    /**
     * Initialize the timer service with a WhatsApp socket
     */
    static initialize(socket: WASocket) {
        TimerService.waSocket = socket;
        TimerService.loadActiveTimers();
    }

    /**
     * Cleanup service resources
     */
    static cleanup() {
        // Stop all active timers
        for (const [timerId, task] of TimerService.activeTimers) {
            task.stop();
        }
        TimerService.activeTimers.clear();
        TimerService.waSocket = null;
    }

    /**
     * Create a new timer
     */
    static async create(userId: string, duration: number): Promise<ITimerModel> {
        const endTime = new Date(Date.now() + duration * 60000); // Convert minutes to milliseconds
        const timer = await Timer.create({
            userId,
            duration,
            endTime,
            isActive: true
        });

        await TimerService.scheduleTimer(timer);
        return timer;
    }

    /**
     * List active timers for a user
     */
    static async list(userId: string): Promise<ITimerModel[]> {
        return await Timer.find({
            userId,
            isActive: true,
            endTime: { $gt: new Date() }
        }).sort({ endTime: 1 });
    }

    /**
     * Cancel a timer
     */
    static async cancel(userId: string, timerId: string): Promise<void> {
        await TimerService.deactivateTimer(timerId);
        TimerService.cancelScheduledTimer(timerId);
    }

    /**
     * Load active timers from database
     */
    private static async loadActiveTimers() {
        const activeTimers = await Timer.find({
            isActive: true,
            endTime: { $gt: new Date() }
        });

        for (const timer of activeTimers) {
            await TimerService.scheduleTimer(timer);
        }
    }

    /**
     * Schedule a timer
     */
    private static async scheduleTimer(timer: ITimerModel) {
        if (!TimerService.waSocket) {
            throw new Error('WhatsApp socket not initialized');
        }

        const now = new Date();
        if (timer.endTime <= now) {
            await TimerService.deactivateTimer(timer.id);
            return;
        }

        const task = cron.schedule(TimerService.getScheduleExpression(timer.endTime), async () => {
            await TimerService.sendTimerNotification(timer);
            await TimerService.deactivateTimer(timer.id);
            TimerService.cancelScheduledTimer(timer.id);
        });

        TimerService.activeTimers.set(timer.id, task);
    }

    /**
     * Cancel a scheduled timer
     */
    private static cancelScheduledTimer(timerId: string) {
        const task = TimerService.activeTimers.get(timerId);
        if (task) {
            task.stop();
            TimerService.activeTimers.delete(timerId);
        }
    }

    /**
     * Deactivate a timer in the database
     */
    private static async deactivateTimer(timerId: string) {
        await Timer.updateOne(
            { _id: timerId },
            { $set: { isActive: false } }
        );
    }

    /**
     * Send timer completion notification
     */
    private static async sendTimerNotification(timer: ITimerModel) {
        if (!TimerService.waSocket) return;

        const message = `⏰ Timer completed: ${timer.duration} minutes have passed!`;
        await TimerService.waSocket.sendMessage(timer.userId, { text: message });
    }

    /**
     * Convert Date to cron expression
     */
    private static getScheduleExpression(date: Date): string {
        return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
    }
} 