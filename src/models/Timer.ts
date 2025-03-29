import { Document, Schema, model } from 'mongoose';

export interface ITimer {
    userId: string;
    duration: number;
    endTime: Date;
    isActive: boolean;
}

export interface ITimerModel extends Omit<ITimer, 'id'>, Document {}

const timerSchema = new Schema<ITimerModel>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    duration: {
        type: Number,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Compound index for active timers
timerSchema.index({ isActive: 1, endTime: 1 });

export const Timer = model<ITimerModel>('Timer', timerSchema); 