import { DatabaseSync } from 'node:sqlite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { statSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const dbPath = resolve(__dirname, 'chat.db');

export const db = new DatabaseSync(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    ip TEXT DEFAULT '127.0.0.1',
    country TEXT DEFAULT 'Local',
    user_agent TEXT DEFAULT '',
    device_name TEXT DEFAULT 'Unknown Device',
    last_active INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
`);

// Safe column migrations for existing databases
try { db.exec("ALTER TABLE sessions ADD COLUMN ip TEXT DEFAULT '127.0.0.1'"); } catch {}
try { db.exec("ALTER TABLE sessions ADD COLUMN country TEXT DEFAULT 'Local'"); } catch {}
try { db.exec("ALTER TABLE sessions ADD COLUMN user_agent TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE sessions ADD COLUMN device_name TEXT DEFAULT 'Unknown Device'"); } catch {}
try { db.exec("ALTER TABLE sessions ADD COLUMN last_active INTEGER DEFAULT 0"); } catch {}

// --- Device Parser Helper ---
export function parseDevice(ua = '') {
  let os = 'Unknown OS';
  if (/iPhone/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  return `${os} (${browser})`;
}

// --- Conversation & Message Operations ---

export function getConversations() {
  return db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all();
}

export function getConversation(id) {
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
}

export function createConversation(id, title = 'New Chat') {
  const now = Date.now();
  db.prepare(`
    INSERT INTO conversations (id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(id, title, now, now);
  return { id, title, created_at: now, updated_at: now };
}

export function updateConversationTitle(id, title) {
  const now = Date.now();
  db.prepare(`
    UPDATE conversations
    SET title = ?, updated_at = ?
    WHERE id = ?
  `).run(title, now, id);
}

export function deleteConversation(id) {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
}

export function getMessages(conversationId) {
  return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId);
}

export function addMessage(id, conversationId, role, content) {
  const now = Date.now();
  const conv = getConversation(conversationId);
  if (!conv) {
    createConversation(conversationId, content.trim().slice(0, 30) || 'New Chat');
  }

  db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, conversationId, role, content, now);

  db.prepare(`
    UPDATE conversations
    SET updated_at = ?
    WHERE id = ?
  `).run(now, conversationId);

  return { id, conversation_id: conversationId, role, content, created_at: now };
}

// --- Authentication & Security Operations ---

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const check = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

export function isAuthSetup() {
  const row = db.prepare("SELECT value FROM config WHERE key = 'admin_password'").get();
  return !!row;
}

export function setupPassword(password, metadata = {}) {
  if (isAuthSetup()) {
    throw new Error('Password has already been configured');
  }
  const hashed = hashPassword(password);
  db.prepare("INSERT INTO config (key, value) VALUES ('admin_password', ?)").run(hashed);
  return createSession(metadata);
}

export function loginWithPassword(password, metadata = {}) {
  const row = db.prepare("SELECT value FROM config WHERE key = 'admin_password'").get();
  if (!row) {
    throw new Error('No password set up yet');
  }
  if (!verifyPassword(password, row.value)) {
    return null;
  }
  return createSession(metadata);
}

export function changePassword(currentPassword, newPassword) {
  const row = db.prepare("SELECT value FROM config WHERE key = 'admin_password'").get();
  if (!row || !verifyPassword(currentPassword, row.value)) {
    throw new Error('Current password is incorrect');
  }
  const newHashed = hashPassword(newPassword);
  db.prepare("UPDATE config SET value = ? WHERE key = 'admin_password'").run(newHashed);
}

export function createSession(metadata = {}) {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
  const ip = metadata.ip || '127.0.0.1';
  const country = metadata.country || 'Local';
  const ua = metadata.userAgent || '';
  const deviceName = parseDevice(ua);

  db.prepare(`
    INSERT INTO sessions (token, created_at, expires_at, ip, country, user_agent, device_name, last_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(token, now, expiresAt, ip, country, ua, deviceName, now);

  return { token, expiresAt, deviceName, ip, country };
}

export function validateSession(token, metadata = {}) {
  if (!token) return false;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!row) return false;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return false;
  }

  // Update last_active
  const now = Date.now();
  if (metadata.ip || metadata.userAgent) {
    const ip = metadata.ip || row.ip;
    const country = metadata.country || row.country;
    const ua = metadata.userAgent || row.user_agent;
    const deviceName = parseDevice(ua);
    db.prepare(`
      UPDATE sessions
      SET last_active = ?, ip = ?, country = ?, device_name = ?
      WHERE token = ?
    `).run(now, ip, country, deviceName, token);
  } else {
    db.prepare('UPDATE sessions SET last_active = ? WHERE token = ?').run(now, token);
  }

  return true;
}

export function getAllSessions() {
  return db.prepare('SELECT token, created_at, expires_at, ip, country, device_name, last_active FROM sessions ORDER BY last_active DESC').all();
}

export function deleteSession(token) {
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
}

export function revokeOtherSessions(currentToken) {
  if (currentToken) {
    db.prepare('DELETE FROM sessions WHERE token != ?').run(currentToken);
  }
}

export function getConfig(key) {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function setConfig(key, value) {
  db.prepare(`
    INSERT INTO config (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

export function getStats() {
  const convCount = db.prepare('SELECT COUNT(*) as count FROM conversations').get().count;
  const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
  const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get().count;
  
  let dbSize = 0;
  try {
    const stats = statSync(dbPath);
    dbSize = (stats.size / 1024).toFixed(1); // KB
  } catch {}

  return {
    conversations: convCount,
    messages: msgCount,
    activeSessions: sessionCount,
    databaseSizeKB: dbSize,
    databasePath: dbPath
  };
}
