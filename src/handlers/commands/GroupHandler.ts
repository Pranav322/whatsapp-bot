import { CommandHandler, CommandContext } from '../../types/commands';
import { GroupService } from '../../services';

export const GroupHandler: CommandHandler = {
    name: 'group',
    description: 'Manage group settings and permissions',
    usage: '!group <settings/admin/ban/mentions> [action] [target]',
    examples: [
        '!group settings list',
        '!group settings notifications on/off',
        '!group settings mentions on/off',
        '!group admin add @user',
        '!group admin remove @user',
        '!group ban @user',
        '!group unban @user',
        '!group mentions everyone on/off',
        '!group mentions users on/off'
    ],
    execute: async (context: CommandContext) => {
        const { socket, chat, sender, args, isGroup } = context;

        if (!isGroup) {
            await socket.sendMessage(chat, { 
                text: '❌ This command can only be used in groups.' 
            });
            return;
        }

        if (args.length < 1) {
            await socket.sendMessage(chat, { text: 'Usage: ' + GroupHandler.usage });
            return;
        }

        try {
            const subCommand = args[0].toLowerCase();

            switch (subCommand) {
                case 'settings':
                    await handleSettings(context);
                    break;

                case 'admin':
                    await handleAdmin(context);
                    break;

                case 'ban':
                case 'unban':
                    await handleBan(context);
                    break;

                case 'mentions':
                    await handleMentions(context);
                    break;

                default:
                    await socket.sendMessage(chat, { 
                        text: 'Unknown subcommand. Use: settings, admin, ban, unban, or mentions.' 
                    });
            }
        } catch (error) {
            console.error('Error in group command:', error);
            await socket.sendMessage(chat, { 
                text: '❌ Failed to process group command. Please try again.' 
            });
        }
    }
};

async function handleSettings(context: CommandContext) {
    const { socket, chat, sender, args } = context;

    if (args.length < 2) {
        await socket.sendMessage(chat, { 
            text: 'Usage: !group settings <list/notifications/mentions> [on/off]' 
        });
        return;
    }

    const action = args[1].toLowerCase();
    const group = await GroupService.getOrCreateGroup(chat);

    switch (action) {
        case 'list':
            const settings = [
                `📋 Group Settings:`,
                `- Notifications: ${group.settings.notificationsEnabled ? '✅' : '❌'}`,
                `- Mentions: ${group.settings.mentionsEnabled ? '✅' : '❌'}`,
                `- Admin-only changes: ${group.settings.onlyAdminsCanChange ? '✅' : '❌'}`,
                `\n📝 Allowed Commands:`,
                ...group.settings.allowedCommands.map((cmd: string) => `- ${cmd}`)
            ].join('\n');

            await socket.sendMessage(chat, { text: settings });
            break;

        case 'notifications':
            if (args.length < 3) {
                await socket.sendMessage(chat, { 
                    text: 'Please specify on/off for notifications.' 
                });
                return;
            }

            const notifValue = args[2].toLowerCase() === 'on';
            const notifSuccess = await GroupService.updateSettings(
                chat,
                { notificationsEnabled: notifValue },
                sender
            );

            await socket.sendMessage(chat, { 
                text: notifSuccess 
                    ? `✅ Group notifications ${notifValue ? 'enabled' : 'disabled'}.`
                    : '❌ You need to be an admin to change this setting.'
            });
            break;

        case 'mentions':
            if (args.length < 3) {
                await socket.sendMessage(chat, { 
                    text: 'Please specify on/off for mentions.' 
                });
                return;
            }

            const mentionsValue = args[2].toLowerCase() === 'on';
            const mentionsSuccess = await GroupService.updateSettings(
                chat,
                { mentionsEnabled: mentionsValue },
                sender
            );

            await socket.sendMessage(chat, { 
                text: mentionsSuccess 
                    ? `✅ Group mentions ${mentionsValue ? 'enabled' : 'disabled'}.`
                    : '❌ You need to be an admin to change this setting.'
            });
            break;

        default:
            await socket.sendMessage(chat, { 
                text: 'Unknown settings command. Use: list, notifications, or mentions.' 
            });
    }
}

async function handleAdmin(context: CommandContext) {
    const { socket, chat, sender, args, message } = context;

    if (args.length < 3) {
        await socket.sendMessage(chat, { 
            text: 'Usage: !group admin <add/remove> @user' 
        });
        return;
    }

    const action = args[1].toLowerCase();
    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (mentions.length === 0) {
        await socket.sendMessage(chat, { 
            text: '❌ Please mention a user to add/remove as admin.' 
        });
        return;
    }

    const targetUser = mentions[0];
    let success: boolean;

    switch (action) {
        case 'add':
            success = await GroupService.addAdmin(chat, targetUser, sender);
            await socket.sendMessage(chat, { 
                text: success 
                    ? '✅ User added as admin.'
                    : '❌ Failed to add admin. Make sure you are an admin yourself.'
            });
            break;

        case 'remove':
            success = await GroupService.removeAdmin(chat, targetUser, sender);
            await socket.sendMessage(chat, { 
                text: success 
                    ? '✅ Admin removed.'
                    : '❌ Failed to remove admin. Make sure you are an admin yourself.'
            });
            break;

        default:
            await socket.sendMessage(chat, { 
                text: 'Unknown admin command. Use: add or remove.' 
            });
    }
}

async function handleBan(context: CommandContext) {
    const { socket, chat, sender, args, message } = context;

    if (args.length < 2) {
        await socket.sendMessage(chat, { 
            text: 'Usage: !group ban/unban @user' 
        });
        return;
    }

    const action = args[0].toLowerCase();
    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (mentions.length === 0) {
        await socket.sendMessage(chat, { 
            text: '❌ Please mention a user to ban/unban.' 
        });
        return;
    }

    const targetUser = mentions[0];
    let success: boolean;

    if (action === 'ban') {
        success = await GroupService.banUser(chat, targetUser, sender);
        await socket.sendMessage(chat, { 
            text: success 
                ? '✅ User banned from using commands.'
                : '❌ Failed to ban user. Make sure you are an admin.'
        });
    } else {
        success = await GroupService.unbanUser(chat, targetUser, sender);
        await socket.sendMessage(chat, { 
            text: success 
                ? '✅ User unbanned.'
                : '❌ Failed to unban user. Make sure you are an admin.'
        });
    }
}

async function handleMentions(context: CommandContext) {
    const { socket, chat, sender, args } = context;

    if (args.length < 3) {
        await socket.sendMessage(chat, { 
            text: 'Usage: !group mentions <everyone/users/roles> <on/off>' 
        });
        return;
    }

    const type = args[1].toLowerCase();
    const value = args[2].toLowerCase() === 'on';
    let success: boolean;

    switch (type) {
        case 'everyone':
            success = await GroupService.updateMentionSettings(
                chat,
                { everyone: value },
                sender
            );
            break;

        case 'users':
            success = await GroupService.updateMentionSettings(
                chat,
                { users: value },
                sender
            );
            break;

        case 'roles':
            success = await GroupService.updateMentionSettings(
                chat,
                { roles: value },
                sender
            );
            break;

        default:
            await socket.sendMessage(chat, { 
                text: 'Unknown mention type. Use: everyone, users, or roles.' 
            });
            return;
    }

    await socket.sendMessage(chat, { 
        text: success 
            ? `✅ ${type} mentions ${value ? 'enabled' : 'disabled'}.`
            : '❌ You need to be an admin to change mention settings.'
    });
} 