import React, { useState, useEffect } from 'react';
import { Copy, Check, Bot, User, Volume2, VolumeX } from 'lucide-react';

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-md overflow-hidden bg-black/80 border border-gray-800">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#2d2d2d] text-xs text-gray-300">
        <span className="font-mono">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy code'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-gray-100 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormattedContent({ text }) {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-[15px] leading-7">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trimStart().split('\n');
          const firstLine = lines[0].trim();
          const language = /^[a-zA-Z0-9_-]+$/.test(firstLine) ? firstLine : '';
          const code = language ? lines.slice(1).join('\n') : lines.join('\n');
          return <CodeBlock key={index} language={language} code={code} />;
        }

        const paragraphs = part.split('\n\n').filter(p => p.trim());
        return (
          <React.Fragment key={index}>
            {paragraphs.map((p, pIdx) => {
              if (p.includes('\n- ') || p.startsWith('- ') || p.includes('\n* ') || p.startsWith('* ')) {
                const items = p.split(/\n[-*] /).map(s => s.replace(/^[-*] /, ''));
                return (
                  <ul key={pIdx} className="list-disc pl-6 space-y-1 my-2">
                    {items.map((item, iIdx) => (
                      <li key={iIdx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                    ))}
                  </ul>
                );
              }
              return (
                <p key={pIdx} className="my-1.5 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatInline(p) }} />
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function formatInline(str) {
  let formatted = str.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-[#383838] px-1.5 py-0.5 rounded text-sm font-mono text-gray-200">$1</code>');
  return formatted;
}

export default function MessageItem({ message, isStreaming }) {
  const isUser = message.role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Reset speech state on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel(); // Stop any other speech
      // Clean markdown symbols for cleaner speech
      const cleanText = message.content
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/[*#`_~]/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`py-6 px-4 md:px-6 w-full ${isUser ? '' : 'bg-gpt-bubble/40 border-y border-white/5'}`}>
      <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4 md:gap-6 items-start">
        {/* Avatar */}
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-purple-600 text-white' : 'bg-gpt-green text-white shadow-sm'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="font-semibold text-xs text-gray-400 mb-1">
            {isUser ? 'You' : 'BalaGPT'}
          </div>

          <FormattedContent text={message.content} />

          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-gray-200 animate-pulse align-middle" />
          )}

          {/* Action buttons (Copy & Read Aloud) */}
          {!isStreaming && !isUser && message.content && (
            <div className="mt-3 flex items-center gap-2 pt-1 border-t border-white/5">
              <button
                onClick={toggleSpeak}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                  isSpeaking ? 'text-[#10a37f] bg-[#10a37f]/10 font-medium' : 'text-gray-400 hover:text-white'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{isSpeaking ? 'Stop' : 'Read Aloud'}</span>
              </button>

              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-400 hover:text-white transition-colors"
                title="Copy entire response"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
