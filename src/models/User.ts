import mongoose, { Schema, Document } from 'mongoose';
import { UserSettings } from '../types';

export interface IUser extends Document {
    phoneNumber: string;
    settings: UserSettings;
    createdAt: Date;
    lastActive: Date;
}

const userSchema = new Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    settings: {
        notificationsEnabled: {
            type: Boolean,
            default: true
        },
        preferredLanguage: {
            type: String,
            default: 'en'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

export const User = mongoose.model<IUser>('User', userSchema); 