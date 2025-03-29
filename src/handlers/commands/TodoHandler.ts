import { CommandHandler, CommandContext } from '../../types/commands';
import { TodoService } from '../../services';

export const TodoHandler: CommandHandler = {
    name: 'todo',
    description: 'Manage your todo list',
    usage: '!todo <add/list/list-all/done/delete/clear> [task/number]',
    examples: [
        '!todo add Buy groceries',
        '!todo add task1, task2, task3',
        '!todo list',
        '!todo list-all',
        '!todo done 1',
        '!todo delete 2',
        '!todo clear'
    ],
    execute: async (context: CommandContext) => {
        const { socket, chat, sender, args } = context;

        if (args.length === 0) {
            await socket.sendMessage(chat, { text: 'Usage: ' + TodoHandler.usage });
            return;
        }

        const subCommand = args[0].toLowerCase();

        try {
            switch (subCommand) {
                case 'add':
                    if (args.length < 2) {
                        await socket.sendMessage(chat, { text: 'Please specify a task to add.' });
                        return;
                    }
                    const taskInput = args.slice(1).join(' ');
                    // Split by commas and trim whitespace
                    const tasks = taskInput.split(',').map(task => task.trim()).filter(task => task.length > 0);
                    
                    if (tasks.length === 0) {
                        await socket.sendMessage(chat, { text: 'Please specify valid tasks to add.' });
                        return;
                    }

                    // Add each task
                    const addedTasks = await Promise.all(
                        tasks.map(task => TodoService.create(sender, chat, task))
                    );

                    // Format response message
                    const responseMsg = tasks.length === 1 
                        ? '✅ Todo added: ' + tasks[0]
                        : '✅ Added multiple todos:\n' + tasks.map((task, i) => `${i + 1}. ${task}`).join('\n');

                    await socket.sendMessage(chat, { text: responseMsg });
                    break;

                case 'list':
                    const todos = await TodoService.list(chat);
                    if (todos.length === 0) {
                        await socket.sendMessage(chat, { text: 'No todos found in this chat.' });
                        return;
                    }

                    const todoList = todos.map((todo, index) => 
                        `${index + 1}. ${todo.completed ? '✓' : '○'} ${todo.task}`
                    ).join('\n');

                    await socket.sendMessage(chat, { 
                        text: '📝 Todo List for this chat:\n' + todoList 
                    });
                    break;

                case 'list-all':
                    const allTodos = await TodoService.listAllUserTodos(sender);
                    if (allTodos.length === 0) {
                        await socket.sendMessage(chat, { text: 'No todos found.' });
                        return;
                    }

                    // Group todos by chat
                    const todosByChat = allTodos.reduce((acc, todo) => {
                        if (!acc[todo.chatId]) {
                            acc[todo.chatId] = [];
                        }
                        acc[todo.chatId].push(todo);
                        return acc;
                    }, {} as Record<string, typeof allTodos>);

                    let allTodosList = '📝 All Your Todos:\n\n';
                    for (const [chatId, chatTodos] of Object.entries(todosByChat)) {
                        const chatName = chatId.includes('@g.us') ? 'Group Chat' : 'Personal Chat';
                        allTodosList += `${chatName}:\n`;
                        allTodosList += chatTodos.map((todo, index) => 
                            `${index + 1}. ${todo.completed ? '✓' : '○'} ${todo.task}`
                        ).join('\n');
                        allTodosList += '\n\n';
                    }

                    await socket.sendMessage(chat, { text: allTodosList });
                    break;

                case 'done':
                    if (args.length !== 2 || isNaN(parseInt(args[1]))) {
                        await socket.sendMessage(chat, { 
                            text: 'Please specify the todo number to mark as done.' 
                        });
                        return;
                    }

                    const todos2 = await TodoService.list(chat);
                    const todoIndex = parseInt(args[1]) - 1;

                    if (todoIndex < 0 || todoIndex >= todos2.length) {
                        await socket.sendMessage(chat, { text: 'Invalid todo number.' });
                        return;
                    }

                    await TodoService.complete(chat, todos2[todoIndex].id);
                    await socket.sendMessage(chat, { 
                        text: '✅ Marked as done: ' + todos2[todoIndex].task 
                    });
                    break;

                case 'delete':
                    if (args.length !== 2 || isNaN(parseInt(args[1]))) {
                        await socket.sendMessage(chat, { 
                            text: 'Please specify the todo number to delete.' 
                        });
                        return;
                    }

                    const todos3 = await TodoService.list(chat, true);
                    const deleteIndex = parseInt(args[1]) - 1;

                    if (deleteIndex < 0 || deleteIndex >= todos3.length) {
                        await socket.sendMessage(chat, { text: 'Invalid todo number.' });
                        return;
                    }

                    await TodoService.delete(chat, todos3[deleteIndex].id);
                    await socket.sendMessage(chat, { 
                        text: '🗑️ Deleted: ' + todos3[deleteIndex].task 
                    });
                    break;

                case 'clear':
                    const count = await TodoService.clearCompleted(chat);
                    await socket.sendMessage(chat, { 
                        text: `🧹 Cleared ${count} completed todos from this chat.` 
                    });
                    break;

                default:
                    await socket.sendMessage(chat, { 
                        text: 'Unknown subcommand. Use: add, list, list-all, done, delete, or clear.' 
                    });
            }
        } catch (error) {
            console.error('Error in todo command:', error);
            await socket.sendMessage(chat, { 
                text: '❌ Failed to process todo command. Please try again.' 
            });
        }
    }
}; 