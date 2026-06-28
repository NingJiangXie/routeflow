import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, Code2, KeyRound, Send } from 'lucide-react';
import { quickPrompts } from '../data/catalog.js';
import { SectionTitle } from './ui.jsx';

export function AssistantPanel({ messages, chatInput, setChatInput, sendMessage, apiConfig, setModal, locale }) {
  const { t } = useTranslation();
  const listRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function getMessageContent(msg) {
    // If content is a translation key, translate it
    if (msg.content.startsWith('chat.') || msg.content.startsWith('assistant.')) {
      return t(msg.content);
    }
    return msg.content;
  }

  return (
    <main className="assistant-grid">
      <aside className="assistant-sidebar">
        <SectionTitle icon="▧" title={t('assistant.workflows')} />
        <button className="workflow-button" onClick={() => setModal('compare')}>
          <BrainCircuit size={16} /><span>{t('modal.algorithmMatrix')}</span>
        </button>
        <button className="workflow-button" onClick={() => setModal('code')}>
          <Code2 size={16} /><span>{t('modal.codeStudio')}</span>
        </button>
        <button className="workflow-button" onClick={() => setModal('api')}>
          <KeyRound size={16} /><span>{apiConfig.apiKey ? t('modal.updateConfig') : t('assistant.configure')}</span>
        </button>
        <SectionTitle icon="◈" title={locale === 'en' ? 'Quick Prompts' : '快捷提示'} />
        {quickPrompts.map(prompt => (
          <button className="ghost" key={prompt} onClick={() => sendMessage(t(prompt))}>
            {t(prompt)}
          </button>
        ))}
      </aside>
      <section className="chat-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t('assistant.title')}</span>
            <h2>{locale === 'en' ? 'Path Planning Assistant' : '路径规划算法助手'}</h2>
          </div>
        </div>
        <div className="message-list" ref={listRef}>
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
              <span>{message.role === 'assistant' ? 'AI' : locale === 'en' ? 'You' : '你'}</span>
              <p>{getMessageContent(message)}</p>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <textarea
            value={chatInput}
            onChange={event => setChatInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('assistant.placeholder')}
            rows={2}
          />
          <button className="primary" onClick={() => sendMessage()}>
            <Send size={16} />{t('assistant.send')}
          </button>
        </div>
      </section>
    </main>
  );
}
