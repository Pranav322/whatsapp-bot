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
import { NotificationService, TimerService, SpotifyService } from './services/index.js';
import { connectDatabase } from './db/index.js';

// Configure logger - set to 'debug' for verbose output
const logger = pino({ level: 'info' });

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
const spotifyPort = 8888;

// Spotify Callback Handler
app.get('/callback', async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string; // This is the user JID

    if (!code || !state) {
        return res.status(400).send('Missing code or state');
    }

    try {
        await SpotifyService.linkAccount(state, code);
        
        // Notify user on WhatsApp
        if (sock) {
            await sock.sendMessage(state, { text: '✅ *Spotify Linked Successfully!* You can now use /play, /pause, /skip, etc.' });
        }

        res.send('<h1>Success!</h1><p>Spotify has been linked to your WhatsApp bot. You can close this window now.</p>');
    } catch (error) {
        console.error('Spotify Callback Error:', error);
        res.status(500).send('Failed to link Spotify account.');
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
    console.log(`🌍 Main server listening on port ${port}`);
});

app.listen(spotifyPort, () => {
    console.log(`🎵 Spotify Callback server listening on port ${spotifyPort}`);
});

connectDatabase()
    .then(() => {
        return connectToWhatsApp();
    })
    .catch(console.error);
