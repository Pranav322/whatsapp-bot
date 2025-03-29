import { Document, Schema, model } from 'mongoose';

export interface INote {
    userId: string;
    content: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface INoteModel extends Omit<INote, 'id'>, Document {}

const noteSchema = new Schema<INoteModel>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    tags: [{
        type: String
    }]
}, {
    timestamps: true
});

// Create text index for content search
noteSchema.index({ content: 'text' });

// Update the updatedAt timestamp before saving
noteSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        this.updatedAt = new Date();
    }
    next();
});

export const Note = model<INoteModel>('Note', noteSchema); 