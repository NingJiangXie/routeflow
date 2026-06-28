import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { algorithms } from '../data/catalog.js';
import { downloadFile } from '../lib/files.js';
import { Field } from './ui.jsx';

export function Modal({ name, onClose, apiConfig, saveApiConfig, locale }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState({
    provider: apiConfig.provider || 'openai',
    model: apiConfig.model || 'gpt-4o-mini',
    apiKey: apiConfig.apiKey || '',
    baseUrl: apiConfig.baseUrl || '',
  });

  const content = {
    compare: <AlgorithmGuide t={t} locale={locale} />,
    code: <CodeTools t={t} locale={locale} />,
    api: (
      <div className="modal-form">
        <Field label={t('modal.provider')}>
          <select value={draft.provider} onChange={event => setDraft({ ...draft, provider: event.target.value })}>
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="custom">Custom</option>
          </select>
        </Field>
        <Field label={t('modal.model')}>
          <input value={draft.model} onChange={event => setDraft({ ...draft, model: event.target.value })} />
        </Field>
        <Field label={t('modal.apiKey')}>
          <input type="password" value={draft.apiKey} onChange={event => setDraft({ ...draft, apiKey: event.target.value })} />
        </Field>
        <Field label={`${t('modal.baseUrl')} (${t('modal.optional')})`}>
          <input value={draft.baseUrl} onChange={event => setDraft({ ...draft, baseUrl: event.target.value })} />
        </Field>
        <button className="primary" onClick={() => saveApiConfig(draft)}>{t('modal.save')}</button>
      </div>
    ),
  }[name];

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" aria-label={t('modal.close')} onClick={onClose}>
          <X size={18} />
        </button>
        {content}
      </div>
    </div>
  );
}

function AlgorithmGuide({ t, locale }) {
  return (
    <div>
      <span className="eyebrow">{t('modal.algorithmMatrix')}</span>
      <h2>{locale === 'zh' ? '算法能力矩阵' : 'Algorithm Matrix'}</h2>
      <div className="guide-grid">
        {Object.entries(algorithms).map(([key, item]) => (
          <article key={key}>
            <strong>{item.name}</strong>
            <p>{t(item.descriptionKey || `algorithm.${key}.description`)}</p>
            <div className="tag-row">
              {item.strengths.map(tag => (
                <span key={tag}>{t(tag)}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function CodeTools({ t, locale }) {
  const code = `class GridPlanner:
    def plan(self, grid, start, goal):
        # Replace with D* Lite / RRT* / ACO strategy
        return [start, goal]`;
  return (
    <div>
      <span className="eyebrow">{t('modal.codeStudio')}</span>
      <h2>{locale === 'zh' ? '代码生成与导出' : 'Code Generation'}</h2>
      <p className="advice">{t('modal.codeAdvice')}</p>
      <pre className="code-preview">{code}</pre>
      <button className="primary" onClick={() => downloadFile('routeflow-planner.py', code, 'text/x-python')}>
        {locale === 'zh' ? '导出模板' : 'Export Template'}
      </button>
    </div>
  );
}
