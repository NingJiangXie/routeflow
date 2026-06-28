import { useMemo, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Trash2, Wand2, Pencil, Eraser, Flag, Target } from 'lucide-react';
import { Field } from './ui.jsx';

export const ControlRail = memo(function ControlRail({
  algorithms, scenario, scenarioPresets, settings, plannerParams,
  locale, editMode, running, runStatus, metrics,
  applyScenario, updateSettings, updatePlannerParam,
  setEditMode, regenerateMap, clearPath, runPlanner,
}) {
  const { t } = useTranslation();

  const editModes = [
    { key: 'draw', icon: Pencil, labelKey: 'control.draw' },
    { key: 'erase', icon: Eraser, labelKey: 'control.erase' },
    { key: 'start', icon: Flag, labelKey: 'control.start' },
    { key: 'goal', icon: Target, labelKey: 'control.goal' },
  ];

  const algoOptions = useMemo(
    () => Object.entries(algorithms).map(([key, a]) => ({ value: key, label: a.name })),
    [algorithms],
  );

  const currentParams = plannerParams[settings.algorithm] || {};

  const handleApplyScenario = useCallback((key) => applyScenario(key), [applyScenario]);
  const handleUpdateSettings = useCallback((patch) => updateSettings(patch), [updateSettings]);
  const handleUpdatePlannerParam = useCallback((algo, patch) => updatePlannerParam(algo, patch), [updatePlannerParam]);

  return (
    <aside className="control-rail">
      {/* Scenario selector */}
      <div className="rail-section">
        <div className="section-label">{t('control.scenario')}</div>
        <div className="scenario-pills">
          {Object.keys(scenarioPresets).map(key => (
            <button
              key={key}
              className={`scenario-pill ${scenario === key ? 'active' : ''}`}
              onClick={() => handleApplyScenario(key)}
            >
              {t(scenarioPresets[key].nameKey || `scenarios.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Algorithm */}
      <div className="rail-section">
        <div className="section-label">{t('control.algorithm')}</div>
        <Field label="">
          <select
            value={settings.algorithm}
            onChange={e => handleUpdateSettings({ algorithm: e.target.value })}
          >
            {algoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      {/* Parameters */}
      <div className="rail-section">
        <div className="section-label">{t('control.parameters')}</div>
        <Field label={`${t('control.gridSize')} ${settings.gridSize}`}>
          <input type="range" min={10} max={64} value={settings.gridSize}
            onChange={e => handleUpdateSettings({ gridSize: +e.target.value, density: Math.min(+e.target.value - 2, settings.density) })} />
        </Field>
        <Field label={`${t('control.density')} ${settings.density}%`}>
          <input type="range" min={5} max={settings.gridSize - 2} value={settings.density}
            onChange={e => handleUpdateSettings({ density: +e.target.value })} />
        </Field>
        <Field label={`${t('control.speed')} ${settings.speed}ms`}>
          <input type="range" min={30} max={600} step={10} value={settings.speed}
            onChange={e => handleUpdateSettings({ speed: +e.target.value })} />
        </Field>
        <label className="toggle-row">
          <span>{t('control.dynamic')}</span>
          <input type="checkbox" checked={settings.dynamic}
            onChange={e => handleUpdateSettings({ dynamic: e.target.checked })} />
        </label>
      </div>

      {/* Algorithm-specific params */}
      {settings.algorithm === 'rrt' && (
        <div className="rail-section">
          <Field label={`${t('control.parameters')} ${currentParams.maxIterations || 1800}`}>
            <input type="range" min={200} max={5000} step={100} value={currentParams.maxIterations || 1800}
              onChange={e => handleUpdatePlannerParam('rrt', { maxIterations: +e.target.value })} />
          </Field>
          <Field label={`Step ${currentParams.stepSize || 2}`}>
            <input type="range" min={1} max={8} value={currentParams.stepSize || 2}
              onChange={e => handleUpdatePlannerParam('rrt', { stepSize: +e.target.value })} />
          </Field>
        </div>
      )}
      {settings.algorithm === 'aco' && (
        <div className="rail-section">
          <Field label={`Ants ${currentParams.ants || 24}`}>
            <input type="range" min={5} max={60} value={currentParams.ants || 24}
              onChange={e => handleUpdatePlannerParam('aco', { ants: +e.target.value })} />
          </Field>
          <Field label={`Iter ${currentParams.iterations || 48}`}>
            <input type="range" min={10} max={120} step={2} value={currentParams.iterations || 48}
              onChange={e => handleUpdatePlannerParam('aco', { iterations: +e.target.value })} />
          </Field>
        </div>
      )}

      {/* Edit mode */}
      <div className="rail-section">
        <div className="section-label">{t('control.editMode')}</div>
        <div className="edit-mode-grid">
          {editModes.map(m => (
            <button key={m.key}
              className={`tool-btn ${editMode === m.key ? 'active' : ''}`}
              onClick={() => setEditMode(m.key)}
              title={t(m.labelKey)}
            >
              <m.icon size={14} />
              <span>{t(m.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="rail-section">
        <div className="action-grid">
          <button onClick={regenerateMap} disabled={running}>
            <Wand2 size={14} /> {t('control.regenerate')}
          </button>
          <button onClick={clearPath} disabled={!running && !metrics.success}>
            <Trash2 size={14} /> {t('control.clear')}
          </button>
          <button className="primary" onClick={running ? clearPath : runPlanner}>
            {running ? '⏹' : <><Play size={14} /> {t('control.run')}</>}
          </button>
        </div>
      </div>
    </aside>
  );
});
