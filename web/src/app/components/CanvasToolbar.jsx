import { useTranslation } from 'react-i18next';
import { Save, Upload, Download, Bookmark, Info } from 'lucide-react';

export function CanvasToolbar({
  maps, currentMapId, metrics, locale,
  onSaveDraft, onLoadDraft, onDeleteDraft,
  onSaveRun, onExport, onImport,
  onOpenCompare,
}) {
  const { t } = useTranslation();

  return (
    <div className="canvas-toolbar">
      <div className="toolbar-group">
        <button onClick={onSaveDraft} title={t('toolbar.saveDraft')}>
          <Save size={14} /> {t('toolbar.saveDraft')}
        </button>
        <label className="toolbar-btn" title={t('toolbar.import')}>
          <Upload size={14} /> {t('toolbar.import')}
          <input type="file" accept=".json" onChange={onImport} hidden />
        </label>
        <button onClick={onExport} title={t('toolbar.export')}>
          <Download size={14} /> {t('toolbar.export')}
        </button>
      </div>
      <div className="toolbar-group">
        {maps.length > 0 && (
          <select onChange={e => { if (e.target.value) onLoadDraft(maps.find(m => m.id === e.target.value)); e.target.value = ''; }}
            defaultValue="">
            <option value="" disabled>{t('toolbar.loadDraft')}</option>
            {maps.slice(0, 10).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        <button disabled={!metrics.success} onClick={onSaveRun}>
          <Bookmark size={14} /> {t('toolbar.saveRun')}
        </button>
        <button onClick={onOpenCompare}>
          <Info size={14} /> {t('toolbar.compare')}
        </button>
      </div>
    </div>
  );
}
