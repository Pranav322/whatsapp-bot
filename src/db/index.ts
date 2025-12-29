import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres connection
const client = postgres(DATABASE_URL, {
    ssl: 'require',
    max: 10
});

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Export schema for convenience
export * from './schema';

// Connection test function
export const connectDatabase = async () => {
    try {
        // Test the connection
        await client`SELECT 1`;
        console.log('Connected to PostgreSQL successfully');
    } catch (error) {
        console.error('PostgreSQL connection error:', error);
        process.exit(1);
    }
};
