import { User, IUserModel } from '../models';
import { UserSettings } from '../types';

export class UserService {
    /**
     * Get or create a user
     */
    static async getOrCreate(userId: string): Promise<IUserModel> {
        let user = await User.findOne({ userId });
        
        if (!user) {
            user = await User.create({ userId });
        }
        
        return user;
    }

    /**
     * Update user's last active timestamp
     */
    static async updateLastActive(userId: string): Promise<void> {
        await User.updateOne(
            { userId },
            { 
                $set: { lastActive: new Date() },
                $setOnInsert: { userId }
            },
            { upsert: true }
        );
    }

    /**
     * Update user settings
     */
    static async updateSettings(userId: string, settings: Partial<IUserModel['settings']>): Promise<void> {
        await User.updateOne(
            { userId },
            { 
                $set: { 'settings': settings },
                $setOnInsert: { userId }
            },
            { upsert: true }
        );
    }

    /**
     * Get user settings
     */
    static async getSettings(userId: string): Promise<IUserModel['settings']> {
        const user = await UserService.getOrCreate(userId);
        return user.settings;
    }

    /**
     * Check if user exists
     */
    static async exists(phoneNumber: string): Promise<boolean> {
        return await User.exists({ phoneNumber }) !== null;
    }
} 