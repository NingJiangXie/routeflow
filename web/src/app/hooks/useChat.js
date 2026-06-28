import { useState, useCallback } from 'react';
import { sendChatMessage } from '../services/ai.js';
import { initialAssistantMessage } from '../data/catalog.js';

export function useChat() {
  const [messages, setMessages] = useState([initialAssistantMessage]);
  const [chatInput, setChatInput] = useState('');
  const [apiConfig, setApiConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('routeflow-api') || '{}');
    } catch {
      return {};
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const saveApiConfig = useCallback((next) => {
    setApiConfig(next);
    localStorage.setItem('routeflow-api', JSON.stringify(next));
  }, []);

  const sendMessage = useCallback(async (text) => {
    const content = text?.trim() || chatInput.trim();
    if (!content) return;

    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setChatInput('');
    setIsLoading(true);

    try {
      const answer = await sendChatMessage({ apiConfig, messages: next });
      setMessages([...next, { role: 'assistant', content: answer }]);
    } catch (error) {
      setMessages([...next, { role: 'assistant', content: `chat.error.backend: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [chatInput, messages, apiConfig]);

  const clearMessages = useCallback(() => {
    setMessages([{ role: 'assistant', content: 'chat.welcome' }]);
  }, []);

  const updateApiConfig = useCallback((updates) => {
    const next = { ...apiConfig, ...updates };
    saveApiConfig(next);
  }, [apiConfig, saveApiConfig]);

  return {
    messages,
    chatInput,
    apiConfig,
    isLoading,
    setMessages,
    setChatInput,
    setApiConfig,
    saveApiConfig,
    sendMessage,
    clearMessages,
    updateApiConfig,
  };
}
