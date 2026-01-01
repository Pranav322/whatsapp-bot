import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    WASocket,
    proto,
    WAMessageKey,
    WAMessageContent
} from 'baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import express from 'express';
import { handleMessage } from './handlers/messageHandler.js';
import { NotificationService, TimerService, GroupService, SpotifyService } from './services/index.js';
import { connectDatabase } from './db/index.js';

// Configure logger - set to 'debug' for verbose output
const logger = pino({ level: 'silent' });

let sock: WASocket;

// Simple in-memory message store for getMessage function
const messageStore = new Map<string, proto.IMessage>();

// Required by Baileys for message retries and poll updates
async function getMessage(key: WAMessageKey): Promise<WAMessageContent | undefined> {
    const messageId = key.id;
    if (messageId) {
        return messageStore.get(messageId);
    }
    return undefined;
}

// Express Server Setup
const app = express();
const port = process.env.PORT || 3000;

app.get('/spotify/callback', async (req: any, res: any) => {
    const code = req.query.code as string;
    const error = req.query.error;
    const state = req.query.state as string; // userId

    if (error) {
        console.error('Callback Error:', error);
        res.status(400).send(`Authentication failed: ${error}`);
        return;
    }

    if (!code || !state) {
        res.status(400).send('Missing code or state');
        return;
    }

    try {
        await SpotifyService.handleCode(state, code);

        res.send(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                    <h1 style="color: #1DB954;">Spotify Login Successful!</h1>
                    <p>You can now close this window and return to WhatsApp.</p>
                </body>
            </html>
        `);

        // Notify user on WhatsApp
        if (sock) {
            await sock.sendMessage(state, { text: '✅ Successfully logged in to Spotify! You can now use !play, !next, etc.' });
        }

    } catch (err) {
        console.error('Error in callback:', err);
        res.status(500).send('Internal Server Error during authentication');
    }
});

async function connectToWhatsApp(): Promise<void> {
    // Load auth state from file system
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    // Fetch latest WA Web version
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 Using WhatsApp Web v${version.join('.')}, isLatest: ${isLatest}`);

    sock = makeWASocket({
        version,
        logger,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: false,
        getMessage,
    });

    // Use batch event processing as recommended
    sock.ev.process(async (events) => {
        // Connection update events
        if (events['connection.update']) {
            const update = events['connection.update'];
            const { connection, lastDisconnect, qr } = update;

            // Display QR code in terminal
            if (qr) {
                console.log('\n📱 Scan this QR code with WhatsApp to connect:\n');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.log('❌ Connection closed:', lastDisconnect?.error?.message || 'Unknown reason');

                // Cleanup services on disconnect
                NotificationService.cleanup();
                TimerService.cleanup();

                if (shouldReconnect) {
                    console.log('🔄 Reconnecting...');
                    setTimeout(() => connectToWhatsApp(), 3000);
                } else {
                    console.log('🚪 Logged out. Delete auth_info folder and restart.');
                }
            } else if (connection === 'open') {
                // Initialize services
                NotificationService.initialize(sock);
                TimerService.initialize(sock);
                GroupService.initialize(sock);

                console.log('\n✅ Connected to WhatsApp successfully!');
                console.log('📝 Bot is now listening for messages...\n');
                console.log('Available commands:');
                console.log('  !help - List all commands');
                console.log('  !sticker - Convert image/gif to sticker');
                console.log('  !notify <time> <message> - Set a reminder');
                console.log('  !todo add <task> - Add a todo');
                console.log('  !note save <title> <content> - Save a note\n');
            }
        }

        // Save credentials when updated
        if (events['creds.update']) {
            await saveCreds();
        }

        // Handle incoming messages
        if (events['messages.upsert']) {
            const upsert = events['messages.upsert'];

            // Store messages for getMessage function
            for (const msg of upsert.messages) {
                if (msg.key.id && msg.message) {
                    messageStore.set(msg.key.id, msg.message);
                }
            }

            // Only process new messages (not history sync)
            if (upsert.type === 'notify') {
                for (const message of upsert.messages) {
                    await handleMessage(sock, message);
                }
            }
        }
    });
}

// Start the bot and server
console.log('🤖 WhatsApp Reminder Bot Starting...\n');

// Start Express Server
app.listen(port, () => {
    console.log(`🌍 Callback server listening on port ${port}`);
});

connectDatabase()
    .then(() => {
        SpotifyService.initialize();
        return connectToWhatsApp();
    })
    .catch(console.error);
