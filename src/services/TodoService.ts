import { db, todos, Todo } from '../db/index.js';
import { eq, and, desc } from 'drizzle-orm';

export class TodoService {
    /**
     * Create a new todo
     */
    static async create(userId: string, chatId: string, task: string): Promise<Todo> {
        const [newTodo] = await db.insert(todos).values({ userId, chatId, task }).returning();
        return newTodo;
    }

    /**
     * List todos for a chat
     */
    static async list(chatId: string, includeCompleted = false): Promise<Todo[]> {
        if (includeCompleted) {
            return await db.select()
                .from(todos)
                .where(eq(todos.chatId, chatId))
                .orderBy(desc(todos.createdAt));
        }

        return await db.select()
            .from(todos)
            .where(and(eq(todos.chatId, chatId), eq(todos.completed, false)))
            .orderBy(desc(todos.createdAt));
    }

    /**
     * List all todos for a user across all chats
     */
    static async listAllUserTodos(userId: string, includeCompleted = false): Promise<Todo[]> {
        if (includeCompleted) {
            return await db.select()
                .from(todos)
                .where(eq(todos.userId, userId))
                .orderBy(desc(todos.createdAt));
        }

        return await db.select()
            .from(todos)
            .where(and(eq(todos.userId, userId), eq(todos.completed, false)))
            .orderBy(desc(todos.createdAt));
    }

    /**
     * Mark a todo as complete
     */
    static async complete(chatId: string, todoId: string): Promise<void> {
        await db.update(todos)
            .set({ completed: true, completedAt: new Date(), updatedAt: new Date() })
            .where(and(eq(todos.id, todoId), eq(todos.chatId, chatId)));
    }

    /**
     * Delete a todo
     */
    static async delete(chatId: string, todoId: string): Promise<void> {
        await db.delete(todos)
            .where(and(eq(todos.id, todoId), eq(todos.chatId, chatId)));
    }

    /**
     * Clear completed todos in a chat
     */
    static async clearCompleted(chatId: string): Promise<number> {
        const result = await db.delete(todos)
            .where(and(eq(todos.chatId, chatId), eq(todos.completed, true)))
            .returning();
        return result.length;
    }

    /**
     * Get todo by ID for a specific chat
     */
    static async getById(chatId: string, todoId: string): Promise<Todo | null> {
        const result = await db.select()
            .from(todos)
            .where(and(eq(todos.id, todoId), eq(todos.chatId, chatId)))
            .limit(1);
        return result[0] || null;
    }
}
