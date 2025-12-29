import makeWASocket, { DisconnectReason, useMultiFileAuthState, WASocket, BaileysEventMap } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { join } from 'path';
import { handleMessage } from '../handlers/messageHandler';
import { NotificationService } from './NotificationService';
import { TimerService } from './TimerService';

// Static WhatsApp version to avoid version mismatch issues
const WHATSAPP_VERSION: [number, number, number] = [2, 3000, 1027934701];

let sock: WASocket | undefined = undefined;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    // Create the socket with static version
    sock = makeWASocket({
        version: WHATSAPP_VERSION,
        printQRInTerminal: true,
        auth: state,
        syncFullHistory: false, // Reduces app state sync errors
        retryRequestDelayMs: 250, // Add delay between retries
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update: Partial<BaileysEventMap['connection.update']>) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);

            if (shouldReconnect) {
                // Clean up services before reconnecting
                NotificationService.cleanup();
                TimerService.cleanup();
                await connectToWhatsApp();
            }
        } else if (connection === 'open' && sock) {
            console.log('Bot connected!');
            // Initialize services when bot is connected
            NotificationService.initialize(sock);
            TimerService.initialize(sock);
        }
    });

    // Handle messages
    sock.ev.on('messages.upsert', async ({ messages }: BaileysEventMap['messages.upsert']) => {
        for (const message of messages) {
            if (sock) {
                await handleMessage(sock, message);
            }
        }
    });

    // Save credentials whenever they are updated
    sock.ev.on('creds.update', saveCreds);
}

export async function startBot() {
    await connectToWhatsApp();
} 