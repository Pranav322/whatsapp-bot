import { Document, Schema, model } from 'mongoose';

export interface IReminder {
    userId: string;
    task: string;
    time: Date;
    notifyUsers: string[];
    groupId?: string;
    isCompleted: boolean;
}

export interface IReminderModel extends Omit<IReminder, 'id'>, Document {}

const reminderSchema = new Schema<IReminderModel>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    task: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        required: true,
        index: true
    },
    notifyUsers: [{
        type: String
    }],
    groupId: {
        type: String,
        sparse: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
});

// Compound index for querying active reminders
reminderSchema.index({ isCompleted: 1, time: 1 });

export const Reminder = model<IReminderModel>('Reminder', reminderSchema); 