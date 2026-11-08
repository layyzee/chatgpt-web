import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Sparkles,
  Code2,
  Compass,
  Lightbulb,
  Bot,
  Menu,
  Plus,
  Mic,
  MicOff,
  Paperclip,
  FileText,
  X,
  Globe,
  Download,
  Printer
} from 'lucide-react';
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
  onNewChat,
  isSearchingWeb
}) {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null); // { name, size, content }
  const [isListening, setIsListening] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll on new messages or streaming chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Could not start recognition:', err);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        content: typeof content === 'string' ? content : ''
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedFile) || isGenerating) return;

    let fullPrompt = input.trim();
    if (attachedFile) {
      fullPrompt = `[Attached Document: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\`\n\n${fullPrompt || 'Please analyze this document.'}`;
    }

    onSend(fullPrompt, { webSearch: webSearchEnabled });
    setInput('');
    setAttachedFile(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Export as Markdown
  const exportMarkdown = () => {
    setShowExportMenu(false);
    if (messages.length === 0) return;

    const title = currentTitle || 'BalaGPT Conversation';
    let content = `# ${title}\n\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

    messages.forEach((m) => {
      const speaker = m.role === 'user' ? '👤 **You**' : '🤖 **BalaGPT**';
      content += `### ${speaker}\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export / Print as PDF
  const exportPDF = () => {
    setShowExportMenu(false);
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gpt-main relative overflow-hidden w-full">
      {/* Top Header */}
      <header className="h-12 border-b border-gpt-border flex items-center justify-between px-3 md:px-4 text-xs text-gray-400 bg-gpt-main/80 backdrop-blur shrink-0 z-10 print:hidden">
        <div className="flex items-center gap-2 truncate">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={onOpenSidebar}
            className="p-1.5 rounded-lg border border-gray-700 hover:bg-gpt-hover text-gray-300 hover:text-white transition-colors md:hidden shrink-0"
            title="Open chats menu"
          >
            <Menu size={18} />
          </button>

          <div className="font-medium text-gray-200 truncate max-w-[150px] sm:max-w-xs md:max-w-md">
            {currentTitle || 'New chat'}
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Export Conversation Dropdown Button */}
          {messages.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-700 hover:bg-gpt-hover text-gray-300 hover:text-white transition-colors text-xs"
                title="Export conversation"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-gray-700 bg-[#26272b] p-1 shadow-2xl z-30">
                  <button
                    onClick={exportMarkdown}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-200 hover:bg-gpt-hover text-left transition-colors"
                  >
                    <FileText size={14} className="text-[#10a37f]" />
                    <span>Download Markdown (.md)</span>
                  </button>
                  <button
                    onClick={exportPDF}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-200 hover:bg-gpt-hover text-left transition-colors"
                  >
                    <Printer size={14} className="text-blue-400" />
                    <span>Print / Save PDF (.pdf)</span>
                  </button>
                </div>
              )}
            </div>
          )}

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
            <span className="truncate max-w-[110px] sm:max-w-none">{selectedModel}</span>
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
              Powered by local offline models on your Mac. Voice, live web search, and document analysis.
            </p>

            {/* Prompt cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full">
              {SUGGESTIONS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSend(`${item.title}: ${item.subtitle}`, { webSearch: webSearchEnabled })}
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
          <div className="pb-40 pt-2 max-w-3xl mx-auto w-full">
            {messages.map((msg, index) => (
              <MessageItem
                key={msg.id || index}
                message={msg}
                isStreaming={isGenerating && index === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}

            {/* Live Web Search Activity Indicator */}
            {isSearchingWeb && (
              <div className="py-3 px-4 flex items-center gap-2 text-xs text-[#10a37f] bg-[#10a37f]/10 rounded-xl max-w-sm my-2 animate-pulse">
                <Globe size={14} className="animate-spin" />
                <span>Searching the live web for real-time information...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gpt-main via-gpt-main/90 to-transparent pt-6 pb-3 sm:pb-4 px-3 sm:px-4 z-20 print:hidden">
        <div className="max-w-3xl mx-auto">
          {/* Attached File Chip */}
          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#2d2f34] border border-gray-700 px-3 py-1.5 text-xs text-gray-200 w-fit max-w-full">
              <FileText size={14} className="text-gpt-green shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{attachedFile.name}</span>
              <span className="text-[10px] text-gray-400 shrink-0">({attachedFile.size})</span>
              <button
                type="button"
                onClick={removeAttachedFile}
                className="ml-1 text-gray-400 hover:text-white"
                title="Remove attached document"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="relative bg-gpt-input border border-gpt-border rounded-2xl shadow-xl focus-within:border-gray-500 transition-colors"
          >
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv,.sql,.env,.log,.xml,.yaml,.yml,.c,.cpp,.h"
            />

            <div className="flex items-center pl-2 pt-1 gap-1">
              {/* Paperclip / File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                title="Attach text or code document"
              >
                <Paperclip size={17} />
              </button>

              {/* Live Web Search Toggle Button */}
              <button
                type="button"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all ${
                  webSearchEnabled
                    ? 'bg-[#10a37f]/20 text-[#10a37f] border border-[#10a37f]/40 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
                }`}
                title={webSearchEnabled ? 'Web search enabled (will search DuckDuckGo)' : 'Enable live web search'}
              >
                <Globe size={15} />
                <span className="hidden sm:inline">{webSearchEnabled ? 'Web ON' : 'Web'}</span>
              </button>

              {/* Voice Dictation Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'text-red-400 bg-red-950/40 animate-pulse'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Voice input (Dictation)'}
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
            </div>

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? 'Listening to your voice...'
                  : webSearchEnabled
                  ? 'Ask BalaGPT anything (will search live web)...'
                  : 'Message BalaGPT...'
              }
              className="w-full bg-transparent text-gray-100 placeholder-gray-400 text-sm py-2.5 pl-4 pr-12 focus:outline-none resize-none max-h-48 overflow-y-auto"
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
                  disabled={!input.trim() && !attachedFile}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-opacity ${
                    input.trim() || attachedFile
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

          <div className="text-[10px] sm:text-[11px] text-gray-500 text-center mt-2 flex items-center justify-center gap-2">
            <span>BalaGPT can make mistakes. Verify important info.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
