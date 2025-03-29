import { Document, Schema, model } from 'mongoose';

export interface IGroup {
    groupId: string;
    settings: {
        allowedCommands: string[];
        notificationsEnabled: boolean;
        mentionsEnabled: boolean;
        onlyAdminsCanChange: boolean;
    };
    adminUsers: string[];
    allowedMentions: {
        everyone: boolean;
        roles: boolean;
        users: boolean;
    };
    bannedUsers: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IGroupModel extends Omit<IGroup, 'id'>, Document {}

const groupSchema = new Schema<IGroupModel>({
    groupId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    settings: {
        allowedCommands: {
            type: [String],
            default: ['help', 'notify', 'todo', 'note', 'timer']
        },
        notificationsEnabled: {
            type: Boolean,
            default: true
        },
        mentionsEnabled: {
            type: Boolean,
            default: true
        },
        onlyAdminsCanChange: {
            type: Boolean,
            default: true
        }
    },
    adminUsers: {
        type: [String],
        default: []
    },
    allowedMentions: {
        everyone: {
            type: Boolean,
            default: true
        },
        roles: {
            type: Boolean,
            default: true
        },
        users: {
            type: Boolean,
            default: true
        }
    },
    bannedUsers: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
groupSchema.index({ 'settings.allowedCommands': 1 });
groupSchema.index({ adminUsers: 1 });
groupSchema.index({ bannedUsers: 1 });

export const Group = model<IGroupModel>('Group', groupSchema); 