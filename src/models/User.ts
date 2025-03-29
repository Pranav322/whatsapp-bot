import { Document, Schema, model } from 'mongoose';

export interface IUser {
    userId: string;
    lastActive: Date;
    settings: {
        notificationsEnabled: boolean;
        timezone: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserModel extends IUser, Document {}

const userSchema = new Schema<IUserModel>({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    settings: {
        notificationsEnabled: {
            type: Boolean,
            default: true
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    }
}, {
    timestamps: true
});

// Drop any existing indexes first
userSchema.pre('save', async function() {
    try {
        await this.collection.dropIndexes();
    } catch (error) {
        console.log('No indexes to drop');
    }
});

// Create only the necessary index
userSchema.index({ userId: 1 }, { unique: true });

export const User = model<IUserModel>('User', userSchema); 