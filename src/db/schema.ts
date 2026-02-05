import { pgTable, text, boolean, timestamp, integer, uuid } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().unique(),
    lastActive: timestamp('last_active').defaultNow(),
    notificationsEnabled: boolean('notifications_enabled').default(true),
    timezone: text('timezone').default('UTC'),
    spotifyRefreshToken: text('spotify_refresh_token'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Todos table
export const todos = pgTable('todos', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    chatId: text('chat_id').notNull(),
    task: text('task').notNull(),
    completed: boolean('completed').default(false),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Reminders table
export const reminders = pgTable('reminders', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    task: text('task').notNull(),
    time: timestamp('time').notNull(),
    notifyUsers: text('notify_users').array().default([]),
    isCompleted: boolean('is_completed').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

// Notes table
export const notes = pgTable('notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    content: text('content').notNull(),
    tags: text('tags').array().default([]),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Timers table
export const timers = pgTable('timers', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    duration: integer('duration').notNull(),
    endTime: timestamp('end_time').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

// Type exports for use in services
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Timer = typeof timers.$inferSelect;
export type NewTimer = typeof timers.$inferInsert;
