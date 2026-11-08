import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatView from './components/ChatView.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import AdminModal from './components/AdminModal.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('chatgpt_token') || '');
  const [isAuthSetup, setIsAuthSetup] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [models, setModels] = useState([{ id: 'llama3.2:3b', name: 'Llama 3.2 3B (Local 100% Offline)' }]);
  const [selectedModel, setSelectedModel] = useState('llama3.2:3b');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const abortControllerRef = useRef(null);

  // Helper for authenticated fetch
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('chatgpt_token');
      setToken('');
      setIsAuthenticated(false);
    }
    return res;
  };

  // Check auth status on mount or token change
  useEffect(() => {
    checkAuthStatus();
  }, [token]);

  const checkAuthStatus = async () => {
    setCheckingAuth(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/auth/status', { headers });
      if (res.ok) {
        const data = await res.json();
        setIsAuthSetup(data.isSetup);
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          fetchConversations();
          fetchModels();
        }
      }
    } catch (err) {
      console.error('Error checking auth:', err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAuthSuccess = (newToken) => {
    localStorage.setItem('chatgpt_token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    setIsAuthSetup(true);
  };

  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('chatgpt_token');
    setToken('');
    setIsAuthenticated(false);
    setConversations([]);
    setMessages([]);
    setActiveId(null);
  };

  const fetchConversations = async () => {
    try {
      const res = await authFetch('/api/conversations');
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
      const res = await authFetch('/api/models');
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
      const res = await authFetch(`/api/conversations/${id}/messages`);
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
      await authFetch(`/api/conversations/${id}`, { method: 'DELETE' });
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
      await authFetch(`/api/conversations/${id}`, {
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
    setIsSearchingWeb(false);
  };

  const handleSend = async (text, options = {}) => {
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
      const res = await authFetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          message: text,
          model: selectedModel,
          webSearch: !!options.webSearch,
          systemPrompt: options.systemPrompt || undefined
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
            if (parsed.searching) {
              setIsSearchingWeb(true);
            }
            if (parsed.searchResultsCount) {
              setIsSearchingWeb(false);
            }
            if (parsed.chunk) {
              setIsSearchingWeb(false);
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
      setIsSearchingWeb(false);
      abortControllerRef.current = null;
      fetchConversations();
    }
  };

  // If loading initial auth state, show minimalist dark splash
  if (checkingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gpt-main text-gray-400">
        <div className="animate-pulse text-sm">Loading BalaGPT...</div>
      </div>
    );
  }

  // If not authenticated, show password / setup lock screen
  if (!isAuthenticated) {
    return <AuthScreen isSetup={isAuthSetup} onAuthSuccess={handleAuthSuccess} />;
  }

  const currentTitle = conversations.find(c => c.id === activeId)?.title;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gpt-main relative">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Admin & Device Manager Modal */}
      <AdminModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        authFetch={authFetch}
      />

      {/* Sidebar Drawer */}
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
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      {/* Main Chat Interface */}
      <ChatView
        messages={messages}
        isGenerating={isGenerating}
        onSend={handleSend}
        onStop={handleStop}
        currentTitle={currentTitle}
        selectedModel={selectedModel}
        onOpenSidebar={() => setSidebarOpen(true)}
        onNewChat={handleNewChat}
        isSearchingWeb={isSearchingWeb}
      />
    </div>
  );
}
