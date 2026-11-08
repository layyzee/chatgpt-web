import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import * as db from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// List all conversations
app.get('/api/conversations', (req, res) => {
  try {
    const list = db.getConversations();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new conversation
app.post('/api/conversations', (req, res) => {
  try {
    const id = req.body.id || randomUUID();
    const title = req.body.title || 'New Chat';
    const conv = db.createConversation(id, title);
    res.status(201).json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:id/messages', (req, res) => {
  try {
    const messages = db.getMessages(req.params.id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rename conversation
app.patch('/api/conversations/:id', (req, res) => {
  try {
    const { title } = req.body;
    db.updateConversationTitle(req.params.id, title);
    res.json({ success: true, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete conversation
app.delete('/api/conversations/:id', (req, res) => {
  try {
    db.deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check available models & Ollama status
app.get('/api/models', async (req, res) => {
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

  const models = [
    ...ollamaModels,
    { id: 'openrouter-free', name: 'OpenRouter Free Cloud', provider: 'openrouter' }
  ];

  res.json({ models, ollamaOnline });
});

// Streaming chat endpoint with Server-Sent Events (SSE)
app.post('/api/chat/stream', async (req, res) => {
  const { conversationId, message, model = 'llama3.2:3b' } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ error: 'conversationId and message are required' });
  }

  // Ensure conversation exists
  let conv = db.getConversation(conversationId);
  if (!conv) {
    conv = db.createConversation(conversationId, message.slice(0, 30));
  }

  // Save user message in SQLite
  const userMsgId = randomUUID();
  db.addMessage(userMsgId, conversationId, 'user', message);

  // Set SSE Headers for real-time word-by-word streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Load message history from DB for context
  const history = db.getMessages(conversationId).map(m => ({
    role: m.role,
    content: m.content
  }));

  let fullResponse = '';
  const assistantMsgId = randomUUID();

  try {
    // Stream from local Ollama
    const ollamaRes = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model === 'openrouter-free' ? 'llama3.2:3b' : model,
        messages: history,
        stream: true
      })
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama responded with status: ${ollamaRes.status}`);
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
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`ChatGPT Backend running on http://127.0.0.1:${PORT}`);
});
