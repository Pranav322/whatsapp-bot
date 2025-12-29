import { db, users, User } from '../db';
import { eq } from 'drizzle-orm';

export interface UserSettings {
    notificationsEnabled: boolean;
    timezone: string;
}

export class UserService {
    /**
     * Get or create a user
     */
    static async getOrCreate(userId: string): Promise<User> {
        const existing = await db.select().from(users).where(eq(users.userId, userId)).limit(1);

        if (existing.length > 0) {
            return existing[0];
        }

        const [newUser] = await db.insert(users).values({ userId }).returning();
        return newUser;
    }

    /**
     * Update user's last active timestamp
     */
    static async updateLastActive(userId: string): Promise<void> {
        const existing = await db.select().from(users).where(eq(users.userId, userId)).limit(1);

        if (existing.length > 0) {
            await db.update(users)
                .set({ lastActive: new Date(), updatedAt: new Date() })
                .where(eq(users.userId, userId));
        } else {
            await db.insert(users).values({ userId, lastActive: new Date() });
        }
    }

    /**
     * Update user settings
     */
    static async updateSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
        const existing = await db.select().from(users).where(eq(users.userId, userId)).limit(1);

        if (existing.length > 0) {
            await db.update(users)
                .set({
                    ...settings,
                    updatedAt: new Date()
                })
                .where(eq(users.userId, userId));
        } else {
            await db.insert(users).values({
                userId,
                ...settings
            });
        }
    }

    /**
     * Get user settings
     */
    static async getSettings(userId: string): Promise<UserSettings> {
        const user = await UserService.getOrCreate(userId);
        return {
            notificationsEnabled: user.notificationsEnabled ?? true,
            timezone: user.timezone ?? 'UTC'
        };
    }

    /**
     * Check if user exists
     */
    static async exists(userId: string): Promise<boolean> {
        const result = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
        return result.length > 0;
    }
}