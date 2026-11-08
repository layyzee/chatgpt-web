import { DatabaseSync } from 'node:sqlite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, 'chat.db');

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
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
`);

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
  // Ensure conversation exists so foreign key constraints are always satisfied
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

export function setupPassword(password) {
  if (isAuthSetup()) {
    throw new Error('Password has already been configured');
  }
  const hashed = hashPassword(password);
  db.prepare("INSERT INTO config (key, value) VALUES ('admin_password', ?)").run(hashed);
  return createSession();
}

export function loginWithPassword(password) {
  const row = db.prepare("SELECT value FROM config WHERE key = 'admin_password'").get();
  if (!row) {
    throw new Error('No password set up yet');
  }
  if (!verifyPassword(password, row.value)) {
    return null;
  }
  return createSession();
}

export function createSession() {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
  db.prepare('INSERT INTO sessions (token, created_at, expires_at) VALUES (?, ?, ?)').run(token, now, expiresAt);
  return { token, expiresAt };
}

export function validateSession(token) {
  if (!token) return false;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!row) return false;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return false;
  }
  return true;
}

export function deleteSession(token) {
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
}
