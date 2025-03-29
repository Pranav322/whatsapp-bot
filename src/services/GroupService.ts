import { Group, IGroupModel } from '../models';
import { WASocket } from '@whiskeysockets/baileys';

export class GroupService {
    private static waSocket: WASocket | null = null;

    /**
     * Initialize the group service
     */
    static initialize(socket: WASocket) {
        GroupService.waSocket = socket;
    }

    /**
     * Get or create a group
     */
    static async getOrCreateGroup(groupId: string): Promise<IGroupModel> {
        let group = await Group.findOne({ groupId });
        
        if (!group) {
            group = await Group.create({
                groupId,
                settings: {
                    allowedCommands: ['help', 'notify', 'todo', 'note', 'timer'],
                    notificationsEnabled: true,
                    mentionsEnabled: true,
                    onlyAdminsCanChange: true
                },
                adminUsers: [],
                allowedMentions: {
                    everyone: true,
                    roles: true,
                    users: true
                },
                bannedUsers: []
            });
        }

        return group;
    }

    /**
     * Check if a command is allowed in the group
     */
    static async isCommandAllowed(groupId: string, commandName: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        return group.settings.allowedCommands.includes(commandName.toLowerCase());
    }

    /**
     * Check if a user is admin in the group
     */
    static async isUserAdmin(groupId: string, userId: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        return group.adminUsers.includes(userId);
    }

    /**
     * Check if a user is banned from using commands
     */
    static async isUserBanned(groupId: string, userId: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        return group.bannedUsers.includes(userId);
    }

    /**
     * Add a group admin
     */
    static async addAdmin(groupId: string, userId: string, byUserId: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        
        // Only existing admins can add new admins
        if (!group.adminUsers.includes(byUserId)) {
            return false;
        }

        if (!group.adminUsers.includes(userId)) {
            await Group.updateOne(
                { groupId },
                { $push: { adminUsers: userId } }
            );
            return true;
        }

        return false;
    }

    /**
     * Remove a group admin
     */
    static async removeAdmin(groupId: string, userId: string, byUserId: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        
        // Only existing admins can remove admins
        if (!group.adminUsers.includes(byUserId)) {
            return false;
        }

        if (group.adminUsers.includes(userId)) {
            await Group.updateOne(
                { groupId },
                { $pull: { adminUsers: userId } }
            );
            return true;
        }

        return false;
    }

    /**
     * Ban a user from using commands
     */
    static async banUser(groupId: string, userId: string, byUserId: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        
        // Only admins can ban users
        if (!group.adminUsers.includes(byUserId)) {
            return false;
        }

        if (!group.bannedUsers.includes(userId)) {
            await Group.updateOne(
                { groupId },
                { $push: { bannedUsers: userId } }
            );
            return true;
        }

        return false;
    }

    /**
     * Unban a user
     */
    static async unbanUser(groupId: string, userId: string, byUserId: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        
        // Only admins can unban users
        if (!group.adminUsers.includes(byUserId)) {
            return false;
        }

        if (group.bannedUsers.includes(userId)) {
            await Group.updateOne(
                { groupId },
                { $pull: { bannedUsers: userId } }
            );
            return true;
        }

        return false;
    }

    /**
     * Update group settings
     */
    static async updateSettings(
        groupId: string,
        settings: Partial<IGroupModel['settings']>,
        byUserId: string
    ): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        
        // Check if user has permission to change settings
        if (group.settings.onlyAdminsCanChange && !group.adminUsers.includes(byUserId)) {
            return false;
        }

        await Group.updateOne(
            { groupId },
            { $set: { 'settings': { ...group.settings, ...settings } } }
        );

        return true;
    }

    /**
     * Update mention settings
     */
    static async updateMentionSettings(
        groupId: string,
        settings: Partial<IGroupModel['allowedMentions']>,
        byUserId: string
    ): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        
        // Only admins can change mention settings
        if (!group.adminUsers.includes(byUserId)) {
            return false;
        }

        await Group.updateOne(
            { groupId },
            { $set: { 'allowedMentions': { ...group.allowedMentions, ...settings } } }
        );

        return true;
    }

    /**
     * Parse mentions from message text
     */
    static parseMentions(text: string): string[] {
        const mentionRegex = /@(\w+|all|everyone)/g;
        const matches = text.match(mentionRegex) || [];
        return matches.map(match => match.slice(1)); // Remove @ symbol
    }

    /**
     * Check if mentions are allowed
     */
    static async areMentionsAllowed(
        groupId: string,
        mentions: string[],
        userId: string
    ): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);

        // Check if mentions are enabled
        if (!group.settings.mentionsEnabled) {
            return false;
        }

        // Check if user is banned
        if (group.bannedUsers.includes(userId)) {
            return false;
        }

        // Check each mention type
        for (const mention of mentions) {
            if (mention === 'all' || mention === 'everyone') {
                if (!group.allowedMentions.everyone) {
                    return false;
                }
            } else if (mention.startsWith('role:')) {
                if (!group.allowedMentions.roles) {
                    return false;
                }
            } else {
                if (!group.allowedMentions.users) {
                    return false;
                }
            }
        }

        return true;
    }
} 