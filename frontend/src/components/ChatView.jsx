import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Sparkles, Code2, Compass, Lightbulb, Bot, Menu, Plus } from 'lucide-react';
import MessageItem from './MessageItem.jsx';

const SUGGESTIONS = [
  {
    icon: Code2,
    title: 'Write a Python script',
    subtitle: 'to monitor CPU and memory usage'
  },
  {
    icon: Compass,
    title: 'Explore a topic',
    subtitle: 'explain how WebSockets work under the hood'
  },
  {
    icon: Sparkles,
    title: 'Brainstorm app ideas',
    subtitle: 'novel developer tools for mac'
  },
  {
    icon: Lightbulb,
    title: 'Reverse engineer a feature',
    subtitle: 'how to structure a real-time chat backend'
  }
];

export default function ChatView({
  messages,
  isGenerating,
  onSend,
  onStop,
  currentTitle,
  selectedModel,
  onOpenSidebar,
  onNewChat
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll on new messages or streaming chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gpt-main relative overflow-hidden w-full">
      {/* Top Header */}
      <header className="h-12 border-b border-gpt-border flex items-center justify-between px-3 md:px-4 text-xs text-gray-400 bg-gpt-main/80 backdrop-blur shrink-0 z-10">
        <div className="flex items-center gap-2 truncate">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={onOpenSidebar}
            className="p-1.5 rounded-lg border border-gray-700 hover:bg-gpt-hover text-gray-300 hover:text-white transition-colors md:hidden shrink-0"
            title="Open chats menu"
          >
            <Menu size={18} />
          </button>

          <div className="font-medium text-gray-200 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
            {currentTitle || 'New chat'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Quick New Chat Button */}
          <button
            onClick={onNewChat}
            className="p-1.5 rounded-lg border border-gray-700 hover:bg-gpt-hover text-gray-300 hover:text-white transition-colors md:hidden shrink-0"
            title="New Chat"
          >
            <Plus size={16} />
          </button>

          {/* Model badge */}
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full text-[11px] border border-gray-700 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            <span className="truncate max-w-[120px] sm:max-w-none">{selectedModel}</span>
          </div>
        </div>
      </header>

      {/* Messages area or Empty State */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4 max-w-2xl mx-auto text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gpt-green/20 text-gpt-green flex items-center justify-center mb-4">
              <Bot size={28} />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">
              What can I help with today?
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mb-8 max-w-md">
              Powered by local offline models on your Mac. Unlimited conversations, zero cost.
            </p>

            {/* Prompt cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full">
              {SUGGESTIONS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSend(`${item.title}: ${item.subtitle}`)}
                    className="flex flex-col items-start p-3 sm:p-3.5 rounded-xl border border-gray-700 hover:bg-gpt-hover text-left transition-all group"
                  >
                    <Icon size={18} className="text-gpt-green mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs sm:text-sm font-medium text-gray-200">{item.title}</span>
                    <span className="text-[11px] sm:text-xs text-gray-400">{item.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pb-36 pt-2 max-w-3xl mx-auto w-full">
            {messages.map((msg, index) => (
              <MessageItem
                key={msg.id || index}
                message={msg}
                isStreaming={isGenerating && index === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gpt-main via-gpt-main/90 to-transparent pt-6 pb-3 sm:pb-4 px-3 sm:px-4 z-20">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative bg-gpt-input border border-gpt-border rounded-2xl shadow-xl focus-within:border-gray-500 transition-colors"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ChatGPT..."
              className="w-full bg-transparent text-gray-100 placeholder-gray-400 text-sm py-3.5 pl-4 pr-12 focus:outline-none resize-none max-h-48 overflow-y-auto"
            />

            {/* Send or Stop button */}
            <div className="absolute right-2.5 bottom-2.5">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:opacity-90 transition-opacity"
                  title="Stop generating"
                >
                  <Square size={14} className="fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-opacity ${
                    input.trim()
                      ? 'bg-white text-black hover:opacity-90'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <ArrowUp size={16} />
                </button>
              )}
            </div>
          </form>

          <div className="text-[10px] sm:text-[11px] text-gray-500 text-center mt-2">
            ChatGPT can make mistakes. Verify important information.
          </div>
        </div>
      </div>
    </div>
  );
}
