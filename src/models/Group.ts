import { Document, Schema, model } from 'mongoose';

export interface IGroup {
    groupId: string;
    settings: {
        allowedCommands: string[];
        notificationsEnabled: boolean;
        mentionsEnabled: boolean;
        onlyAdminsCanChange: boolean;
    };
    allowedMentions: {
        everyone: boolean;
        roles: boolean;
        users: boolean;
    };
    adminUsers: string[];
    bannedUsers: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IGroupModel extends IGroup, Document {}

const groupSchema = new Schema<IGroupModel>({
    groupId: {
        type: String,
        required: true,
        unique: true
    },
    settings: {
        allowedCommands: {
            type: [String],
            default: ['help', 'todo', 'notify', 'note', 'timer']
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
    allowedMentions: {
        everyone: {
            type: Boolean,
            default: false
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
    adminUsers: {
        type: [String],
        default: []
    },
    bannedUsers: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
groupSchema.index({ groupId: 1 }, { unique: true });
groupSchema.index({ adminUsers: 1 });
groupSchema.index({ bannedUsers: 1 });

export const Group = model<IGroupModel>('Group', groupSchema); 