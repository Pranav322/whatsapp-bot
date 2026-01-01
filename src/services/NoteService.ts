import { db, notes, Note } from '../db/index.js';
import { eq, and, desc, ilike } from 'drizzle-orm';

export class NoteService {
    /**
     * Create a new note
     */
    static async create(userId: string, content: string): Promise<Note> {
        const [newNote] = await db.insert(notes).values({
            userId,
            content
        }).returning();
        return newNote;
    }

    /**
     * Get all notes for a user
     */
    static async list(userId: string): Promise<Note[]> {
        return await db.select()
            .from(notes)
            .where(eq(notes.userId, userId))
            .orderBy(desc(notes.updatedAt));
    }

    /**
     * Get note by ID
     */
    static async getById(userId: string, noteId: string): Promise<Note | null> {
        const result = await db.select()
            .from(notes)
            .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
            .limit(1);
        return result[0] || null;
    }

    /**
     * Update a note
     */
    static async update(userId: string, noteId: string, content: string): Promise<Note | null> {
        const result = await db.update(notes)
            .set({ content, updatedAt: new Date() })
            .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
            .returning();
        return result[0] || null;
    }

    /**
     * Delete a note
     */
    static async delete(userId: string, noteId: string): Promise<boolean> {
        const result = await db.delete(notes)
            .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
            .returning();
        return result.length > 0;
    }

    /**
     * Search notes by content (simple ILIKE search - PostgreSQL alternative to text search)
     */
    static async search(userId: string, query: string): Promise<Note[]> {
        return await db.select()
            .from(notes)
            .where(and(
                eq(notes.userId, userId),
                ilike(notes.content, `%${query}%`)
            ))
            .orderBy(desc(notes.updatedAt))
            .limit(10);
    }
}
