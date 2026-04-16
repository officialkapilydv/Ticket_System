import { useState, useCallback } from 'react';
import { aiApi, type AiChatResponse } from '@/api/ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: AiChatResponse['action_taken'];
  toolName?: string;
  timestamp: Date;
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id:        crypto.randomUUID(),
      role:      'user',
      content:   text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiApi.chat({ message: text, session_id: sessionId });

      if (!sessionId) {
        setSessionId(response.session_id);
      }

      const assistantMsg: ChatMessage = {
        id:        crypto.randomUUID(),
        role:      'assistant',
        content:   response.reply,
        action:    response.action_taken ?? undefined,
        toolName:  response.tool_name,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      setError('Failed to get a response. Please try again.');
      const errMsg: ChatMessage = {
        id:        crypto.randomUUID(),
        role:      'assistant',
        content:   'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return { messages, sessionId, isLoading, error, sendMessage, clearChat };
}
