import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, X } from 'lucide-react';
import { DEFAULT_SHORTCUTS } from '../hooks/useKeyboardShortcuts.js';

const ShortcutsHelpModal = memo(function ShortcutsHelpModal({ onClose, locale = 'zh' }) {
  const { t } = useTranslation();

  const categories = {
    playback: ['playPause', 'reset', 'stepForward', 'stepBackward', 'speedUp', 'speedDown'],
    editing: ['modeDraw', 'modeErase', 'modeStart', 'modeGoal', 'clearMap', 'regenerate'],
    navigation: ['toggleView', 'toggleLocale', 'save', 'benchmark'],
    tools: ['help'],
  };

  return (
    <div className="shortcuts-modal">
      <div className="modal-header">
        <div className="modal-title">
          <Keyboard size={20} />
          <h3>{t('shortcuts.title')}</h3>
        </div>
        <button onClick={onClose} className="icon-btn">
          <X size={18} />
        </button>
      </div>

      <div className="shortcuts-content">
        <p className="shortcuts-desc">{t('shortcuts.description')}</p>

        {Object.entries(categories).map(([category, keys]) => (
          <div key={category} className="shortcuts-category">
            <h4>{t(`shortcuts.category.${category}`)}</h4>
            <div className="shortcuts-grid">
              {keys.map(keyId => {
                const shortcut = DEFAULT_SHORTCUTS[keyId];
                if (!shortcut) return null;
                return (
                  <div key={keyId} className="shortcut-item">
                    <span className="shortcut-desc">
                      {locale === 'en' ? shortcut.descriptionEn : shortcut.description}
                    </span>
                    <kbd className="shortcut-key">{shortcut.label}</kbd>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export { ShortcutsHelpModal };