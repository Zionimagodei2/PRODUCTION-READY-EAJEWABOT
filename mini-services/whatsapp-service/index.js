/**
 * EAJE WhatsBot - Baileys WhatsApp Web API Service
 * Port: 3003
 * 
 * Provides REST API for WhatsApp automation:
 * - Session management (QR code, pairing code, status, logout)
 * - Message sending (text + media)
 * - Number validation (check if on WhatsApp)
 * - Group extraction (fetch groups + participants)
 */

import express from 'express';
import cors from 'cors';
import pino from 'pino';
import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3003;
const AUTH_FOLDER = path.join(__dirname, 'auth_info');
const logger = pino({ level: 'info' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session state
let sock = null;
let currentQRRaw = null;
let currentPairingCode = null;
let isConnected = false;
let isAuthenticated = false;
let connectionStatus = 'disconnected';
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let isInitializing = false;

// LRU Cache for contacts
function createLRUCache(maxSize) {
    const cache = new Map();
    return {
        get(key) { if (cache.has(key)) { const v = cache.get(key); cache.delete(key); cache.set(key, v); return v; } return undefined; },
        set(key, value) { if (cache.has(key)) cache.delete(key); else if (cache.size >= maxSize) cache.delete(cache.keys().next().value); cache.set(key, value); },
        has(key) { return cache.has(key); },
        entries() { return cache.entries(); },
        size() { return cache.size; }
    };
}

const contactsCache = createLRUCache(2000);
const lidToPhoneCache = createLRUCache(1000);

// Format phone number for WhatsApp JID
function formatJid(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, '');
    if (phoneNumber.includes('@')) return phoneNumber;
    return `${cleaned}@s.whatsapp.net`;
}

function clearAuthFolder() {
    try {
        if (fs.existsSync(AUTH_FOLDER)) {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
            fs.mkdirSync(AUTH_FOLDER, { recursive: true });
        }
    } catch (error) {
        logger.error('Failed to clear auth folder:', error);
    }
}

// Load LID mappings from auth folder
function loadLidMappingsFromAuthFolder() {
    try {
        const files = fs.readdirSync(AUTH_FOLDER);
        for (const file of files) {
            const match = file.match(/^lid-mapping-(\d+)_reverse\.json$/);
            if (match) {
                try {
                    const phone = JSON.parse(fs.readFileSync(`${AUTH_FOLDER}/${file}`, 'utf8'));
                    if (phone && typeof phone === 'string') lidToPhoneCache.set(`${match[1]}@lid`, `${phone}@s.whatsapp.net`);
                } catch {}
            }
        }
    } catch {}
}

loadLidMappingsFromAuthFolder();

// Initialize WhatsApp connection
async function initializeWhatsApp() {
    if (isInitializing) return;
    isInitializing = true;
    
    try {
        if (sock) {
            try { sock.ev.removeAllListeners(); await sock.end(); } catch {}
            sock = null;
        }
        
        if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
        const { version } = await fetchLatestBaileysVersion();
        logger.info(`Using WA Web version: ${version?.join('.')}`);

        sock = makeWASocket({
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
            version,
            printQRInTerminal: false,
            qrTimeout: 180000,
            qrRetryCount: 12,
            logger,
            browser: Browsers.ubuntu('Chrome'),
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: true,
            fireInitQueries: true,
            generateHighQualityLinkPreview: false,
            syncFullHistory: false,
            markOnlineOnConnect: false
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                currentQRRaw = qr;
                connectionStatus = 'qr';
                logger.info('QR code generated');
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                isConnected = false;
                isAuthenticated = false;
                connectionStatus = 'disconnected';
                currentPairingCode = null;

                const shouldClearAuth = statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 405;

                if (shouldClearAuth) {
                    clearAuthFolder();
                    currentQRRaw = null;
                    setTimeout(initializeWhatsApp, 2000);
                } else if (statusCode !== DisconnectReason.loggedOut) {
                    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                        const delayMs = Math.min(3000 * Math.pow(2, reconnectAttempts), 60000);
                        reconnectAttempts++;
                        logger.info(`Reconnecting in ${delayMs}ms (attempt ${reconnectAttempts})`);
                        setTimeout(initializeWhatsApp, delayMs);
                    } else {
                        connectionStatus = 'error';
                    }
                }
            } else if (connection === 'open') {
                isConnected = true;
                isAuthenticated = true;
                connectionStatus = 'authenticated';
                currentQRRaw = null;
                currentPairingCode = null;
                reconnectAttempts = 0;
                logger.info('WhatsApp connection established');
            } else if (connection === 'connecting') {
                connectionStatus = 'connecting';
                logger.info('Connecting to WhatsApp...');
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('contacts.upsert', (contacts) => {
            for (const contact of contacts) {
                contactsCache.set(contact.id, { name: contact.name || '', notify: contact.notify || '', verifiedName: contact.verifiedName || '' });
                if (contact.lid && contact.phoneNumber) lidToPhoneCache.set(contact.lid, contact.phoneNumber);
            }
            logger.info(`Synced ${contacts.length} contacts`);
        });

        sock.ev.on('messages.upsert', async ({ messages }) => {
            for (const msg of messages) {
                if (!msg.key.fromMe && msg.message) {
                    logger.debug(`Received message from ${msg.key.remoteJid}`);
                }
            }
        });

    } catch (error) {
        logger.error('Failed to initialize WhatsApp:', error);
        connectionStatus = 'error';
        setTimeout(initializeWhatsApp, 5000);
    } finally {
        isInitializing = false;
    }
}

// Wait for connection ready for pairing code
function waitForConnectionReady(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        if (connectionStatus === 'qr' || connectionStatus === 'connecting') return resolve();
        if (connectionStatus === 'authenticated') return reject(new Error('Already authenticated'));
        if (!sock) return reject(new Error('Socket not initialized'));
        
        const timeout = setTimeout(() => reject(new Error('Connection not ready - timeout')), timeoutMs);
        const handler = (update) => {
            if (update.connection === 'connecting' || update.qr) { clearTimeout(timeout); sock.ev.off('connection.update', handler); resolve(); }
            else if (update.connection === 'open') { clearTimeout(timeout); sock.ev.off('connection.update', handler); reject(new Error('Already authenticated')); }
        };
        sock.ev.on('connection.update', handler);
    });
}

// ============= API Routes =============

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), connection: connectionStatus });
});

app.post('/session/start', async (req, res) => {
    try {
        if (isAuthenticated) return res.json({ status: 'authenticated', message: 'Session already authenticated' });
        if (!sock) await initializeWhatsApp();
        await delay(2000);
        if (isAuthenticated) return res.json({ status: 'authenticated' });
        else if (currentQRRaw) return res.json({ status: 'qr', message: 'Scan QR code to authenticate' });
        else return res.json({ status: 'connecting', message: 'Connecting...' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

app.get('/session/status', (req, res) => {
    res.json({ status: connectionStatus, authenticated: isAuthenticated, connected: isConnected, qr: currentQRRaw || null, pairingCode: currentPairingCode || null });
});

app.get('/session/qr', (req, res) => {
    if (isAuthenticated) return res.json({ status: 'authenticated', qr: null });
    res.json({ status: 'qr', qr: currentQRRaw });
});

app.post('/session/pairing-code', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const sanitized = (phoneNumber || '').replace(/\D/g, '');
        if (!sanitized || sanitized.length < 10 || sanitized.length > 15) return res.status(400).json({ success: false, error: 'Valid phone number required (10-15 digits)' });
        if (isAuthenticated) return res.json({ success: false, error: 'Already authenticated' });
        if (!sock) await initializeWhatsApp();
        try { await waitForConnectionReady(15000); } catch (e) {
            if (e.message.includes('Already authenticated')) return res.json({ success: false, error: 'Already authenticated', status: 'authenticated' });
        }
        const code = await sock.requestPairingCode(sanitized);
        currentPairingCode = code;
        connectionStatus = 'pairing';
        res.json({ success: true, pairingCode: code, phoneNumber: sanitized });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/session/logout', async (req, res) => {
    try {
        if (sock) { try { if (isConnected && isAuthenticated) await sock.logout(); else await sock.end(); } catch {} }
        clearAuthFolder();
        isConnected = false; isAuthenticated = false; connectionStatus = 'disconnected';
        currentQRRaw = null; currentPairingCode = null; sock = null;
        res.json({ success: true, message: 'Logged out' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/message/send', async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) return res.status(400).json({ success: false, error: 'Phone and message required' });
        if (!isAuthenticated || !sock) return res.status(401).json({ success: false, error: 'Not authenticated' });
        
        const jid = formatJid(phone);
        const onWhatsAppResult = await sock.onWhatsApp(jid.split('@')[0]);
        if (!onWhatsAppResult?.[0]?.exists) return res.json({ success: false, phone, error: 'Number not on WhatsApp' });

        // Anti-spam: simulate typing
        try { await sock.sendPresenceUpdate('composing', jid); await delay(1000 + Math.random() * 2000); } catch {}
        
        const result = await sock.sendMessage(jid, { text: message });
        try { sock.sendPresenceUpdate('paused', jid).catch(() => {}); } catch {}
        
        res.json({ success: true, phone, messageId: result.key.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/message/send-media', async (req, res) => {
    try {
        const { phone, message, mediaUrl, mediaBase64, mediaType, mimeType, filename } = req.body;
        if (!phone) return res.status(400).json({ success: false, error: 'Phone required' });
        if (!isAuthenticated || !sock) return res.status(401).json({ success: false, error: 'Not authenticated' });
        
        const jid = formatJid(phone);
        const onWhatsAppResult = await sock.onWhatsApp(jid.split('@')[0]);
        if (!onWhatsAppResult?.[0]?.exists) return res.json({ success: false, phone, error: 'Number not on WhatsApp' });

        let messageContent;
        const hasMedia = mediaUrl || mediaBase64;
        if (hasMedia && mediaType) {
            let mediaSource = mediaBase64 ? Buffer.from(mediaBase64.includes(',') ? mediaBase64.split(',')[1] : mediaBase64, 'base64') : { url: mediaUrl };
            switch (mediaType) {
                case 'image': messageContent = { image: mediaSource, caption: message || '', mimetype: mimeType || 'image/jpeg' }; break;
                case 'video': messageContent = { video: mediaSource, caption: message || '', mimetype: mimeType || 'video/mp4' }; break;
                case 'audio': messageContent = { audio: mediaSource, mimetype: mimeType || 'audio/mp4', ptt: false }; break;
                case 'document': messageContent = { document: mediaSource, caption: message || '', mimetype: mimeType || 'application/pdf', fileName: filename || 'document' }; break;
                default: messageContent = { text: message || '' };
            }
        } else {
            messageContent = { text: message || '' };
        }

        try { await sock.sendPresenceUpdate('composing', jid); await delay(1000 + Math.random() * 2000); } catch {}
        const result = await sock.sendMessage(jid, messageContent);
        try { sock.sendPresenceUpdate('paused', jid).catch(() => {}); } catch {}
        
        res.json({ success: true, phone, messageId: result.key.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/check/number', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, error: 'Phone required' });
        if (!isAuthenticated || !sock) return res.status(401).json({ success: false, error: 'Not authenticated' });
        
        const cleaned = phone.replace(/\D/g, '');
        const [result] = await sock.onWhatsApp(cleaned);
        res.json({ success: true, phone, exists: (result && result.exists) || false, jid: (result && result.jid) || null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/groups', async (req, res) => {
    try {
        if (!isAuthenticated || !sock) return res.status(401).json({ success: false, error: 'Not authenticated' });
        const groups = await sock.groupFetchAllParticipating();
        const groupList = Object.values(groups).map(g => ({
            id: g.id, subject: g.subject || 'Unknown Group', desc: g.desc || '',
            size: g.participants ? g.participants.length : 0, creation: g.creation || 0,
            isCommunity: g.isCommunity || false
        }));
        res.json({ success: true, groups: groupList, total: groupList.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/groups/:groupId/participants', async (req, res) => {
    try {
        const { groupId } = req.params;
        if (!isAuthenticated || !sock) return res.status(401).json({ success: false, error: 'Not authenticated' });
        
        const metadata = await sock.groupMetadata(groupId);
        if (!metadata) return res.status(404).json({ success: false, error: 'Group not found' });

        const participants = (metadata.participants || []).map(p => {
            let phone = '';
            if (p.id && p.id.includes('@s.whatsapp.net')) phone = '+' + p.id.split('@')[0];
            else if (p.id && p.id.includes('@lid')) {
                const mapped = lidToPhoneCache.get(p.id);
                if (mapped) phone = '+' + mapped.split('@')[0];
            }
            const cached = contactsCache.get(p.id);
            return {
                id: p.id, phone, name: p.name || cached?.name || p.notify || '', 
                notify: p.notify || '', admin: p.admin || null
            };
        });

        res.json({ success: true, groupId, subject: metadata.subject, participants, total: participants.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/groups/create', async (req, res) => {
    try {
        const { subject, participants } = req.body;
        if (!subject) return res.status(400).json({ success: false, error: 'Group subject required' });
        if (!isAuthenticated || !sock) return res.status(401).json({ success: false, error: 'Not authenticated' });
        
        const jids = (participants || []).map(p => formatJid(p));
        const result = await sock.groupCreate(subject, jids);
        res.json({ success: true, group: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    logger.info(`EAJE WhatsApp Service running on port ${PORT}`);
    initializeWhatsApp();
});
