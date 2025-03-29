import { Document, Schema, model } from 'mongoose';

export interface ITodo {
    userId: string;
    chatId: string;
    task: string;
    completed: boolean;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITodoModel extends Omit<ITodo, 'id'>, Document {}

const todoSchema = new Schema<ITodoModel>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    chatId: {
        type: String,
        required: true,
        index: true
    },
    task: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Create compound index for faster queries
todoSchema.index({ chatId: 1, completed: 1, createdAt: -1 });
todoSchema.index({ userId: 1, chatId: 1 });

export const Todo = model<ITodoModel>('Todo', todoSchema); 