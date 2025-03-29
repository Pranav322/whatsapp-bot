import { Todo, ITodoModel } from '../models';

export class TodoService {
    /**
     * Create a new todo
     */
    static async create(userId: string, chatId: string, task: string): Promise<ITodoModel> {
        return await Todo.create({ userId, chatId, task });
    }

    /**
     * List todos for a chat
     */
    static async list(chatId: string, includeCompleted = false): Promise<ITodoModel[]> {
        const query: { chatId: string; completed?: boolean } = { chatId };
        
        if (!includeCompleted) {
            query.completed = false;
        }

        return await Todo.find(query).sort({ createdAt: -1 });
    }

    /**
     * List all todos for a user across all chats
     */
    static async listAllUserTodos(userId: string, includeCompleted = false): Promise<ITodoModel[]> {
        const query: { userId: string; completed?: boolean } = { userId };
        
        if (!includeCompleted) {
            query.completed = false;
        }

        return await Todo.find(query).sort({ createdAt: -1 });
    }

    /**
     * Mark a todo as complete
     */
    static async complete(chatId: string, todoId: string): Promise<void> {
        await Todo.updateOne(
            { _id: todoId, chatId },
            { $set: { completed: true, completedAt: new Date() } }
        );
    }

    /**
     * Delete a todo
     */
    static async delete(chatId: string, todoId: string): Promise<void> {
        await Todo.deleteOne({ _id: todoId, chatId });
    }

    /**
     * Clear completed todos in a chat
     */
    static async clearCompleted(chatId: string): Promise<number> {
        const result = await Todo.deleteMany({
            chatId,
            completed: true
        });
        return result.deletedCount || 0;
    }

    /**
     * Get todo by ID for a specific chat
     */
    static async getById(chatId: string, todoId: string): Promise<ITodoModel | null> {
        return await Todo.findOne({ _id: todoId, chatId });
    }
} 