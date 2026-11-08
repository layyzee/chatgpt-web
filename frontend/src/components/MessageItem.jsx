import React, { useState } from 'react';
import { Copy, Check, Bot, User } from 'lucide-react';

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
  // Split by code blocks
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

        // Handle paragraphs, lists, bold text
        const paragraphs = part.split('\n\n').filter(p => p.trim());
        return (
          <React.Fragment key={index}>
            {paragraphs.map((p, pIdx) => {
              // Check if bullet list
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
  // Bold **text**
  let formatted = str.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  // Inline code `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-[#383838] px-1.5 py-0.5 rounded text-sm font-mono text-gray-200">$1</code>');
  return formatted;
}

export default function MessageItem({ message, isStreaming }) {
  const isUser = message.role === 'user';

  return (
    <div className={`py-6 px-4 md:px-6 w-full ${isUser ? '' : 'bg-gpt-bubble/40 border-y border-white/5'}`}>
      <div className="max-w-3xl mx-auto flex gap-4 md:gap-6 items-start">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-purple-600 text-white' : 'bg-gpt-green text-white'
        }`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="font-semibold text-xs text-gray-400 mb-1">
            {isUser ? 'You' : 'ChatGPT'}
          </div>
          <FormattedContent text={message.content} />
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-gray-200 animate-pulse align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}
