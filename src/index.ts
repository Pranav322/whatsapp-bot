import { config } from 'dotenv';
import { connectDatabase } from './db';
import { startBot } from './services/bot';

// Load environment variables
config();

// Connect to PostgreSQL
async function connectToDatabase() {
    try {
        await connectDatabase();
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}

// Start the application
async function main() {
    try {
        await connectToDatabase();
        await startBot();
    } catch (error) {
        console.error('Application error:', error);
        process.exit(1);
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

// Start the app
main();