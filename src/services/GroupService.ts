import { db, groups, Group } from '../db';
import { eq, sql } from 'drizzle-orm';
import { WASocket } from '@whiskeysockets/baileys';

export interface GroupSettings {
    allowedCommands: string[];
    notificationsEnabled: boolean;
    mentionsEnabled: boolean;
    onlyAdminsCanChange: boolean;
}

export interface AllowedMentions {
    everyone: boolean;
    roles: boolean;
    users: boolean;
}

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
    static async getOrCreateGroup(groupId: string): Promise<Group> {
        const existing = await db.select().from(groups).where(eq(groups.groupId, groupId)).limit(1);

        if (existing.length > 0) {
            return existing[0];
        }

        const [newGroup] = await db.insert(groups).values({
            groupId,
            allowedCommands: ['help', 'notify', 'todo', 'note', 'timer'],
            notificationsEnabled: true,
            mentionsEnabled: true,
            onlyAdminsCanChange: true,
            adminUsers: [],
            allowMentionEveryone: true,
            allowMentionRoles: true,
            allowMentionUsers: true,
            bannedUsers: []
        }).returning();

        return newGroup;
    }

    /**
     * Check if a command is allowed in the group
     */
    static async isCommandAllowed(groupId: string, commandName: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        return (group.allowedCommands ?? []).includes(commandName.toLowerCase());
    }

    /**
     * Check if a user is admin in the group
     */
    static async isUserAdmin(groupId: string, userId: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        return (group.adminUsers ?? []).includes(userId);
    }

    /**
     * Check if a user is banned from using commands
     */
    static async isUserBanned(groupId: string, userId: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);
        return (group.bannedUsers ?? []).includes(userId);
    }

    /**
     * Add a group admin
     */
    static async addAdmin(groupId: string, userId: string, byUserId: string): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);

        // Only existing admins can add new admins
        if (!(group.adminUsers ?? []).includes(byUserId)) {
            return false;
        }

        if (!(group.adminUsers ?? []).includes(userId)) {
            const newAdmins = [...(group.adminUsers ?? []), userId];
            await db.update(groups)
                .set({ adminUsers: newAdmins, updatedAt: new Date() })
                .where(eq(groups.groupId, groupId));
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
        if (!(group.adminUsers ?? []).includes(byUserId)) {
            return false;
        }

        if ((group.adminUsers ?? []).includes(userId)) {
            const newAdmins = (group.adminUsers ?? []).filter(id => id !== userId);
            await db.update(groups)
                .set({ adminUsers: newAdmins, updatedAt: new Date() })
                .where(eq(groups.groupId, groupId));
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
        if (!(group.adminUsers ?? []).includes(byUserId)) {
            return false;
        }

        if (!(group.bannedUsers ?? []).includes(userId)) {
            const newBanned = [...(group.bannedUsers ?? []), userId];
            await db.update(groups)
                .set({ bannedUsers: newBanned, updatedAt: new Date() })
                .where(eq(groups.groupId, groupId));
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
        if (!(group.adminUsers ?? []).includes(byUserId)) {
            return false;
        }

        if ((group.bannedUsers ?? []).includes(userId)) {
            const newBanned = (group.bannedUsers ?? []).filter(id => id !== userId);
            await db.update(groups)
                .set({ bannedUsers: newBanned, updatedAt: new Date() })
                .where(eq(groups.groupId, groupId));
            return true;
        }

        return false;
    }

    /**
     * Update group settings
     */
    static async updateSettings(
        groupId: string,
        settings: Partial<GroupSettings>,
        byUserId: string
    ): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);

        // Check if user has permission to change settings
        if (group.onlyAdminsCanChange && !(group.adminUsers ?? []).includes(byUserId)) {
            return false;
        }

        await db.update(groups)
            .set({
                ...settings,
                updatedAt: new Date()
            })
            .where(eq(groups.groupId, groupId));

        return true;
    }

    /**
     * Update mention settings
     */
    static async updateMentionSettings(
        groupId: string,
        settings: Partial<AllowedMentions>,
        byUserId: string
    ): Promise<boolean> {
        const group = await GroupService.getOrCreateGroup(groupId);

        // Only admins can change mention settings
        if (!(group.adminUsers ?? []).includes(byUserId)) {
            return false;
        }

        const updateData: Record<string, any> = { updatedAt: new Date() };
        if (settings.everyone !== undefined) updateData.allowMentionEveryone = settings.everyone;
        if (settings.roles !== undefined) updateData.allowMentionRoles = settings.roles;
        if (settings.users !== undefined) updateData.allowMentionUsers = settings.users;

        await db.update(groups)
            .set(updateData)
            .where(eq(groups.groupId, groupId));

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
        if (!group.mentionsEnabled) {
            return false;
        }

        // Check if user is banned
        if ((group.bannedUsers ?? []).includes(userId)) {
            return false;
        }

        // Check each mention type
        for (const mention of mentions) {
            if (mention === 'all' || mention === 'everyone') {
                if (!group.allowMentionEveryone) {
                    return false;
                }
            } else if (mention.startsWith('role:')) {
                if (!group.allowMentionRoles) {
                    return false;
                }
            } else {
                if (!group.allowMentionUsers) {
                    return false;
                }
            }
        }

        return true;
    }
}