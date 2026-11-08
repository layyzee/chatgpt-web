import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatView from './components/ChatView.jsx';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [models, setModels] = useState([{ id: 'llama3.2:3b', name: 'Llama 3.2 3B (Local 100% Offline)' }]);
  const [selectedModel, setSelectedModel] = useState('llama3.2:3b');
  const abortControllerRef = useRef(null);

  // Load conversations and models on mount
  useEffect(() => {
    fetchConversations();
    fetchModels();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          setSelectedModel(data.models[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  };

  const handleSelectConversation = async (id) => {
    if (isGenerating) handleStop();
    setActiveId(id);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleNewChat = () => {
    if (isGenerating) handleStop();
    setActiveId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (id) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleRenameConversation = async (id, newTitle) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  const handleSend = async (text) => {
    if (isGenerating || !text.trim()) return;

    let convId = activeId;

    // Create a new conversation if on home screen
    if (!convId) {
      convId = crypto.randomUUID();
      setActiveId(convId);
      const newConv = { id: convId, title: text.slice(0, 30), created_at: Date.now() };
      setConversations(prev => [newConv, ...prev]);
    }

    // Append user message immediately
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: text };
    const initialAssistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          message: text,
          model: selectedModel
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        throw new Error(`Server returned error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const payload = line.replace('data: ', '').trim();
          if (payload === '[DONE]') break;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.chunk) {
              accumulated += parsed.chunk;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: accumulated
                };
                return next;
              });
            }
            if (parsed.titleUpdated) {
              setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: parsed.titleUpdated } : c));
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: `⚠️ Error: Could not reach the model. ${err.message}`
          };
          return next;
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      fetchConversations();
    }
  };

  const currentTitle = conversations.find(c => c.id === activeId)?.title;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gpt-main">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversation}
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        isOpen={true}
      />
      <ChatView
        messages={messages}
        isGenerating={isGenerating}
        onSend={handleSend}
        onStop={handleStop}
        currentTitle={currentTitle}
        selectedModel={selectedModel}
      />
    </div>
  );
}
