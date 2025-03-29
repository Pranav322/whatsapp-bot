import { User, IUser } from '../models';
import { UserSettings } from '../types';

export class UserService {
    /**
     * Get or create a user by phone number
     */
    static async getOrCreateUser(phoneNumber: string): Promise<IUser> {
        let user = await User.findOne({ phoneNumber });
        
        if (!user) {
            user = await User.create({
                phoneNumber,
                settings: {
                    notificationsEnabled: true,
                    preferredLanguage: 'en'
                }
            });
        }

        return user;
    }

    /**
     * Update user's last active timestamp
     */
    static async updateLastActive(phoneNumber: string): Promise<void> {
        await User.updateOne(
            { phoneNumber },
            { $set: { lastActive: new Date() } }
        );
    }

    /**
     * Update user settings
     */
    static async updateSettings(phoneNumber: string, settings: Partial<UserSettings>): Promise<IUser | null> {
        return await User.findOneAndUpdate(
            { phoneNumber },
            { $set: { 'settings': settings } },
            { new: true }
        );
    }

    /**
     * Get user settings
     */
    static async getSettings(phoneNumber: string): Promise<UserSettings | null> {
        const user = await User.findOne({ phoneNumber });
        return user?.settings || null;
    }

    /**
     * Check if user exists
     */
    static async exists(phoneNumber: string): Promise<boolean> {
        return await User.exists({ phoneNumber }) !== null;
    }
} 