import { Note, INoteModel } from '../models';

export class NoteService {
    /**
     * Create a new note
     */
    static async create(userId: string, content: string): Promise<INoteModel> {
        return await Note.create({
            userId,
            content
        });
    }

    /**
     * Get all notes for a user
     */
    static async list(userId: string): Promise<INoteModel[]> {
        return await Note.find({ userId }).sort({ updatedAt: -1 });
    }

    /**
     * Get note by ID
     */
    static async getById(userId: string, noteId: string): Promise<INoteModel | null> {
        return await Note.findOne({ _id: noteId, userId });
    }

    /**
     * Update a note
     */
    static async update(userId: string, noteId: string, content: string): Promise<INoteModel | null> {
        return await Note.findOneAndUpdate(
            { _id: noteId, userId },
            { $set: { content } },
            { new: true }
        );
    }

    /**
     * Delete a note
     */
    static async delete(userId: string, noteId: string): Promise<boolean> {
        const result = await Note.deleteOne({ _id: noteId, userId });
        return result.deletedCount > 0;
    }

    /**
     * Search notes by content
     */
    static async search(userId: string, query: string): Promise<INoteModel[]> {
        return await Note.find(
            { 
                userId,
                $text: { $search: query }
            },
            { 
                score: { $meta: 'textScore' }
            }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(10);
    }
} 