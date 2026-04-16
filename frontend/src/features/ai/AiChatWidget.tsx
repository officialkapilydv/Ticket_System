import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Sparkles, X, Send, RotateCcw, Bot, User } from 'lucide-react';
import { useAiChat } from './useAiChat';
import { AiActionCard } from './AiActionCard';

const EXAMPLE_PROMPTS = [
  'Create a ticket titled "Fix Login Bug" with high priority',
  'Search for open tickets assigned to me',
  'Show me details for ticket 01HWXYZ...',
  'Log 2 hours on ticket 01HWXYZ for today',
  'Change status of ticket 01HWXYZ to in_review',
];

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setIsOpen(true)}
        title="AI Assistant"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600
                   shadow-lg flex items-center justify-center hover:bg-indigo-700
                   active:scale-95 transition-all duration-150 group"
      >
        <Sparkles className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Chat window */}
      {isOpen && <AiChatWindow onClose={() => setIsOpen(false)} />}
    </>
  );
}

function AiChatWindow({ onClose }: { onClose: () => void }) {
  const { messages, isLoading, sendMessage, clearChat } = useAiChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExample = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]
                 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col
                 overflow-hidden"
      style={{ height: '560px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-white font-semibold text-sm">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            title="New conversation"
            className="text-indigo-200 hover:text-white transition-colors p-1 rounded"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white transition-colors p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <EmptyState onExample={handleExample} />
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                  ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-gray-100'}`}
              >
                {msg.role === 'user'
                  ? <User className="w-3.5 h-3.5 text-indigo-600" />
                  : <Bot className="w-3.5 h-3.5 text-gray-600" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                >
                  {msg.content}
                </div>

                {/* Action result card */}
                {msg.role === 'assistant' && msg.action && (
                  <AiActionCard action={msg.action} toolName={msg.toolName} />
                )}

                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 px-3 py-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Enter to send)"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       disabled:bg-gray-50 disabled:text-gray-400 max-h-28 leading-relaxed"
            style={{ scrollbarWidth: 'thin' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 112) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center
                       hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed
                       active:scale-95 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onExample }: { onExample: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-indigo-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">AI Assistant</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Manage tickets with natural language. Try one of these:
        </p>
      </div>
      <div className="w-full space-y-1.5">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onExample(prompt)}
            className="w-full text-left text-xs text-gray-600 bg-gray-50 hover:bg-indigo-50
                       hover:text-indigo-700 border border-gray-200 hover:border-indigo-200
                       rounded-lg px-3 py-2 transition-colors leading-relaxed"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
