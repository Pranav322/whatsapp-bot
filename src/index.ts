import { config } from 'dotenv';
import { connect } from 'mongoose';
import { startBot } from './services/bot';

// Load environment variables
config();

// MongoDB connection options
const mongoOptions = {
    retryWrites: true,
    w: 'majority'
};

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        await connect(uri);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Start the application
async function main() {
    try {
        await connectToMongoDB();
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