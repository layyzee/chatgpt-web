import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import * as db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(__dirname, '../frontend/dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to extract client metadata (IP, Country, User Agent)
function getClientMeta(req) {
  const ip = req.headers['cf-connecting-ip'] || 
             req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.socket.remoteAddress || 
             '127.0.0.1';
  const country = req.headers['cf-ipcountry'] || 'Local';
  const userAgent = req.headers['user-agent'] || '';
  return { ip, country, userAgent };
}

// Zero-cost DuckDuckGo Web Search Scraper
async function searchWeb(query) {
  try {
    const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return [];
    const html = await res.text();
    const snippets = [];
    const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null && snippets.length < 4) {
      const text = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim();
      if (text) snippets.push(text);
    }
    return snippets;
  } catch (err) {
    console.error('Web search error:', err);
    return [];
  }
}

// --- Authentication Middleware ---
function requireAuth(req, res, next) {
  if (!db.isAuthSetup()) {
    return res.status(401).json({ error: 'Setup required', requiresSetup: true });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const meta = getClientMeta(req);

  if (!token || !db.validateSession(token, meta)) {
    return res.status(401).json({ error: 'Unauthorized: Session invalid or expired' });
  }

  req.currentToken = token;
  next();
}

// --- Auth Endpoints (Public) ---

app.get('/api/auth/status', (req, res) => {
  try {
    const isSetup = db.isAuthSetup();
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const meta = getClientMeta(req);
    const authenticated = isSetup ? db.validateSession(token, meta) : false;
    res.json({ isSetup, authenticated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/setup', (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.trim().length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }
    const meta = getClientMeta(req);
    const session = db.setupPassword(password.trim(), meta);
    res.json({ success: true, ...session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    const meta = getClientMeta(req);
    const session = db.loginWithPassword(password.trim(), meta);
    if (!session) {
      return res.status(401).json({ error: 'Incorrect password. Access denied.' });
    }
    res.json({ success: true, ...session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    db.deleteSession(token);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin Portal & Session Management Endpoints (Protected) ---

app.get('/api/admin/sessions', requireAuth, (req, res) => {
  try {
    const sessions = db.getAllSessions().map(s => ({
      ...s,
      isCurrent: s.token === req.currentToken,
      displayToken: s.token.slice(-6)
    }));
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/sessions/:token', requireAuth, (req, res) => {
  try {
    db.deleteSession(req.params.token);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/sessions/revoke-others', requireAuth, (req, res) => {
  try {
    db.revokeOtherSessions(req.currentToken);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', requireAuth, (req, res) => {
  try {
    const stats = db.getStats();
    const hasGroqKey = !!(process.env.GROQ_API_KEY || db.getConfig('groq_api_key'));
    res.json({ ...stats, hasGroqKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' });
    }
    db.changePassword(currentPassword, newPassword.trim());
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/groq-key', requireAuth, (req, res) => {
  try {
    const { key } = req.body;
    db.setConfig('groq_api_key', (key || '').trim());
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Protected Conversations & Chat Endpoints ---

app.get('/api/conversations', requireAuth, (req, res) => {
  try {
    const list = db.getConversations();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations', requireAuth, (req, res) => {
  try {
    const id = req.body.id || randomUUID();
    const title = req.body.title || 'New Chat';
    const conv = db.createConversation(id, title);
    res.status(201).json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/conversations/:id/messages', requireAuth, (req, res) => {
  try {
    const messages = db.getMessages(req.params.id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/conversations/:id', requireAuth, (req, res) => {
  try {
    const { title } = req.body;
    db.updateConversationTitle(req.params.id, title);
    res.json({ success: true, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/conversations/:id', requireAuth, (req, res) => {
  try {
    db.deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/models', requireAuth, async (req, res) => {
  let ollamaModels = [];
  let ollamaOnline = false;

  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      ollamaOnline = true;
      ollamaModels = (data.models || []).map(m => ({
        id: m.name,
        name: `${m.name} (Local 100% Offline)`,
        provider: 'ollama'
      }));
    }
  } catch {}

  const groqKey = process.env.GROQ_API_KEY || db.getConfig('groq_api_key');
  let cloudModels = [];

  if (groqKey) {
    cloudModels = [
      { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Groq Cloud 800 t/s)', provider: 'groq' },
      { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B (Groq Cloud)', provider: 'groq' },
      { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Groq Cloud Fast)', provider: 'groq' }
    ];
  } else if (!ollamaOnline) {
    cloudModels = [
      { id: 'cloud-setup-required', name: '⚡ Configure Free Groq Key (Admin Portal)', provider: 'cloud' }
    ];
  }

  const models = [
    ...cloudModels,
    ...ollamaModels
  ];

  res.json({ models, ollamaOnline, hasGroqKey: !!groqKey });
});

// Streaming chat endpoint with Server-Sent Events (SSE) + Live Web Search
app.post('/api/chat/stream', requireAuth, async (req, res) => {
  const { conversationId, message, model = 'openai/gpt-oss-120b', webSearch = false } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ error: 'conversationId and message are required' });
  }

  // Ensure conversation exists
  let conv = db.getConversation(conversationId);
  if (!conv) {
    conv = db.createConversation(conversationId, message.slice(0, 30));
  }

  // Save original user message in SQLite
  const userMsgId = randomUUID();
  db.addMessage(userMsgId, conversationId, 'user', message);

  // Set SSE Headers for real-time word-by-word streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Load message history from DB for context
  let history = db.getMessages(conversationId).map(m => ({
    role: m.role,
    content: m.content
  }));

  // Perform Live Web Search if enabled
  if (webSearch) {
    res.write(`data: ${JSON.stringify({ searching: true })}\n\n`);
    const cleanQuery = message.replace(/\[Attached Document:[\s\S]*?```/g, '').trim().slice(0, 100);
    const snippets = await searchWeb(cleanQuery || message.slice(0, 60));
    
    if (snippets.length > 0) {
      res.write(`data: ${JSON.stringify({ searchResultsCount: snippets.length })}\n\n`);
      const searchContext = snippets.map((s, i) => `[Source ${i+1}]: ${s}`).join('\n\n');
      const enrichedPrompt = `${message}\n\n[Real-Time Live Web Search Information]:\n${searchContext}\n\nPlease answer the user accurately using the live search findings above.`;
      
      if (history.length > 0) {
        history[history.length - 1].content = enrichedPrompt;
      }
    }
  }

  let fullResponse = '';
  const assistantMsgId = randomUUID();

  // Detect if Groq cloud should be used
  const groqKey = process.env.GROQ_API_KEY || db.getConfig('groq_api_key');
  const isGroqModel = model.startsWith('openai/') || model.startsWith('qwen/') || (!model.includes(':') && groqKey);

  try {
    if (isGroqModel && groqKey) {
      // Stream from Groq Cloud (Free 800 tokens/sec Llama 3)
      const targetModel = model === 'cloud-setup-required' ? 'openai/gpt-oss-120b' : model;
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: history,
          stream: true
        })
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        throw new Error(`Groq API Error (${groqRes.status}): ${errText}`);
      }

      const reader = groqRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const payload = line.replace('data: ', '').trim();
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            const token = parsed.choices?.[0]?.delta?.content || '';
            if (token) {
              fullResponse += token;
              res.write(`data: ${JSON.stringify({ chunk: token })}\n\n`);
            }
          } catch {}
        }
      }
    } else {
      // Stream from local Ollama
      const ollamaRes = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: history,
          stream: true
        })
      });

      if (!ollamaRes.ok) {
        throw new Error(`Ollama responded with status: ${ollamaRes.status}. If running in cloud, configure a free Groq API key in the Admin Portal.`);
      }

      const reader = ollamaRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const token = parsed.message?.content || '';
            if (token) {
              fullResponse += token;
              res.write(`data: ${JSON.stringify({ chunk: token })}\n\n`);
            }
          } catch {}
        }
      }
    }

    // Save complete assistant message to SQLite
    db.addMessage(assistantMsgId, conversationId, 'assistant', fullResponse);

    // Auto-generate title if this is the first turn
    const msgCount = db.getMessages(conversationId).length;
    if (msgCount <= 2) {
      const title = message.trim().slice(0, 32);
      db.updateConversationTitle(conversationId, title);
      res.write(`data: ${JSON.stringify({ titleUpdated: title })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Streaming error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Serve frontend static files in production / cloud deployment (e.g. Render)
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ChatGPT Backend running on http://0.0.0.0:${PORT}`);
});
