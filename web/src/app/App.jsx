import { lazy, Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid2x2, Layers3 } from 'lucide-react';
import { algorithms, scenarioPresets } from './data/catalog.js';
import { createDynamicObstacles, planPath } from './lib/planning.js';
import { downloadFile, readJsonFile } from './lib/files.js';
import { SimulationCanvas } from './components/SimulationCanvas.jsx';
import { AssistantPanel } from './components/AssistantPanel.jsx';
import { InsightsPanel } from './components/InsightsPanel.jsx';
import { BenchmarkPanel } from './components/BenchmarkPanel.jsx';
import { StatsPanel } from './components/StatsPanel.jsx';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal.jsx';
import { Modal } from './components/Modal.jsx';
import { ApiConfigPanel } from './components/ApiConfigPanel.jsx';
import { ControlRail } from './components/ControlRail.jsx';
import { MetricsRail } from './components/MetricsRail.jsx';
import { CanvasToolbar } from './components/CanvasToolbar.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { usePlanner } from './hooks/usePlanner.js';
import { useChat } from './hooks/useChat.js';
import { useWorkspace } from './hooks/useWorkspace.js';
import { useTheme } from './hooks/useTheme.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { recordRun } from './services/stats.js';

const LazySimulationCanvas3D = lazy(() =>
  import('./components/SimulationCanvas3D.jsx').then((m) => ({
    default: m.SimulationCanvas3D,
  }))
);

function getComplexity(density, locale) {
  const high = locale === 'en' ? 'High' : '高复杂度';
  const medium = locale === 'en' ? 'Medium' : '中复杂度';
  const low = locale === 'en' ? 'Low' : '低复杂度';
  return density >= 32 ? high : density >= 18 ? medium : low;
}

export function App() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'zh';
  
  // Custom hooks
  const planner = usePlanner();
  const chat = useChat();
  const workspace = useWorkspace();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState('planning');
  const [editMode, setEditMode] = useState('draw');
  const [viewMode, setViewMode] = useState('2d');
  const [modal, setModal] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  function handleToggleLocale() {
    const next = locale === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(next);
    theme.setLocale(next);
  }

  // Record stats when planning completes
  useEffect(() => {
    if (planner.runStatus === 'done' && planner.metrics.success) {
      recordRun({
        algorithm: planner.settings.algorithm,
        success: planner.metrics.success,
        time: planner.metrics.time,
        length: planner.metrics.length,
        nodes: planner.metrics.nodes,
      });
    }
  }, [planner.runStatus, planner.metrics, planner.settings.algorithm]);

  // Keyboard shortcuts
  const shortcutHandlers = useMemo(() => ({
    playPause: () => {
      if (planner.runStatus === 'done' || planner.runStatus === 'failed') return;
      if (planner.running) {
        planner.setRunning(false);
        setIsPaused(true);
      } else if (isPaused) {
        planner.setRunning(true);
        setIsPaused(false);
      } else {
        handleRunPlanner();
      }
    },
    reset: () => {
      planner.clearPath();
      setIsPaused(false);
    },
    stepForward: () => {
      if (!planner.path.length) return;
      planner.setRobotIndex((i) => Math.min(i + 1, planner.path.length - 1));
    },
    stepBackward: () => {
      if (!planner.path.length) return;
      planner.setRobotIndex((i) => Math.max(i - 1, 0));
    },
    speedUp: () => {
      planner.updateSettings({ speed: Math.max(10, planner.settings.speed / 1.5) });
      setPlaybackSpeed((s) => Math.min(s * 1.5, 8));
    },
    speedDown: () => {
      planner.updateSettings({ speed: Math.min(2000, planner.settings.speed * 1.5) });
      setPlaybackSpeed((s) => Math.max(s / 1.5, 0.25));
    },
    modeDraw: () => setEditMode('draw'),
    modeErase: () => setEditMode('erase'),
    modeStart: () => setEditMode('start'),
    modeGoal: () => setEditMode('goal'),
    clearMap: () => planner.clearPath(),
    regenerate: () => handleRegenerateMap(),
    toggleView: () => setViewMode((v) => (v === '2d' ? '3d' : '2d')),
    toggleLocale: () => handleToggleLocale(),
    save: () => handleSaveDraft(),
    benchmark: () => setActiveTab('benchmark'),
    help: () => setShowShortcuts(true),
  }), [planner, isPaused, handleRunPlanner, handleRegenerateMap, handleSaveDraft, handleToggleLocale]);

  useKeyboardShortcuts(shortcutHandlers, [shortcutHandlers]);

  // Robot animation
  useEffect(() => {
    if (!planner.running || planner.path.length === 0) return undefined;
    const adjustedSpeed = planner.settings.speed / playbackSpeed;
    const timer = window.setInterval(() => {
      planner.setRobotIndex((i) => {
        if (i >= planner.path.length - 1) {
          planner.setRunning(false);
          planner.setRunStatus('done');
          setIsPaused(false);
          return i;
        }
        return i + 1;
      });
    }, adjustedSpeed);
    return () => window.clearInterval(timer);
  }, [planner.running, planner.path, planner.settings.speed, playbackSpeed]);

  // Dynamic obstacles animation
  useEffect(() => {
    if (!planner.running || !planner.settings.dynamic || planner.dynamicObstacles.length === 0)
      return undefined;
    const timer = window.setInterval(() => {
      planner.setDynamicObstacles((cur) =>
        createDynamicObstacles(planner.settings, planner.start, planner.goal).map((obs, idx) => {
          if (idx >= cur.length) return obs;
          const next = {
            ...obs,
            x: cur[idx].x,
            y: cur[idx].y,
            dx: cur[idx].dx,
            dy: cur[idx].dy,
          };
          next.x = Math.max(0, Math.min(planner.settings.gridSize - 1, next.x + next.dx));
          next.y = Math.max(0, Math.min(planner.settings.gridSize - 1, next.y + next.dy));
          if (next.x === 0 || next.x === planner.settings.gridSize - 1) next.dx *= -1;
          if (next.y === 0 || next.y === planner.settings.gridSize - 1) next.dy *= -1;
          return next;
        })
      );
    }, 520);
    return () => window.clearInterval(timer);
  }, [
    planner.running,
    planner.settings.dynamic,
    planner.settings.gridSize,
    planner.dynamicObstacles.length,
    planner.start,
    planner.goal,
    planner.settings,
  ]);

  const activeAlgorithm = algorithms[planner.settings.algorithm];
  const complexity = useMemo(
    () => getComplexity(planner.settings.density, locale),
    [planner.settings.density, locale]
  );

  // Actions
  function handleRunPlanner() {
    const w = planner.grid.map((r) => [...r]);
    planner.dynamicObstacles.forEach((o) => {
      if (o.y >= 0 && o.y < w.length && o.x >= 0 && o.x < w.length) w[o.y][o.x] = 1;
    });
    w[planner.start.y][planner.start.x] = 0;
    w[planner.goal.y][planner.goal.x] = 0;
    const result = planPath(w, planner.start, planner.goal, planner.settings.algorithm, planner.plannerParams[planner.settings.algorithm]);
    planner.runPlanner(result);
  }

  async function handleSaveDraft() {
    const draftData = planner.getDraftData();
    await workspace.saveDraft(draftData, scenarioPresets[planner.scenario].name);
    planner.setCurrentMapId(draftData.id || `map-${Date.now()}`);
  }

  async function handleLoadDraft(draft) {
    planner.loadDraft(draft);
    workspace.markUnsynced();
  }

  async function handleDeleteDraft() {
    if (!planner.currentMapId) return;
    await workspace.deleteDraft(planner.currentMapId);
    planner.setCurrentMapId(null);
  }

  async function handleSaveCompareRun() {
    if (!planner.metrics.success) return;
    const run = {
      mapId: planner.currentMapId,
      algorithm: activeAlgorithm.name,
      scenario: scenarioPresets[planner.scenario].name,
      settings: planner.settings,
      plannerParams: planner.plannerParams[planner.settings.algorithm] || {},
      metrics: planner.metrics,
      path: planner.path,
      length: planner.metrics.length,
      time: planner.metrics.time,
      nodes: planner.metrics.nodes,
      replans: planner.metrics.replans,
    };
    await workspace.saveCompareRun(run);
  }

  function handleExportMap() {
    const data = {
      settings: planner.settings,
      plannerParams: planner.plannerParams,
      start: planner.start,
      goal: planner.goal,
      grid: planner.grid,
      path: planner.path,
      dynamicObstacles: planner.dynamicObstacles,
      metrics: planner.metrics,
      currentMapId: planner.currentMapId,
    };
    downloadFile('routeflow-map.json', JSON.stringify(data, null, 2), 'application/json');
  }

  async function handleImportMap(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const p = await readJsonFile(file);
    planner.setSettings(p.settings || planner.settings);
    planner.setPlannerParams((c) => ({ ...c, ...p.plannerParams }));
    planner.setStart(p.start || planner.start);
    planner.setGoal(p.goal || planner.goal);
    planner.setGrid(p.grid || planner.grid);
    planner.setPath(p.path || []);
    planner.setDynamicObstacles(p.dynamicObstacles || []);
    planner.setMetrics(p.metrics || planner.metrics);
    planner.setCurrentMapId(p.currentMapId || null);
    planner.setRobotIndex(0);
    planner.setRunStatus(p.metrics?.success ? 'done' : 'idle');
    workspace.markUnsynced();
    event.target.value = '';
  }

  function handleSendMessage(text) {
    chat.sendMessage(text);
  }

  function handleSaveApiConfig(next) {
    chat.saveApiConfig(next);
    setModal(null);
  }

  function handleMarkUnsynced() {
    workspace.markUnsynced();
  }

  // Handlers that mark unsynced
  function handleUpdateSettings(patch) {
    planner.updateSettings(patch);
    handleMarkUnsynced();
  }

  function handleUpdatePlannerParam(algo, patch) {
    planner.updatePlannerParam(algo, patch);
    handleMarkUnsynced();
  }

  function handleApplyScenario(name) {
    planner.applyScenario(name);
    handleMarkUnsynced();
  }

  function handleRegenerateMap() {
    planner.regenerateMap();
    handleMarkUnsynced();
  }

  function handleEditCell(point, mode) {
    planner.editCell(point, mode);
    handleMarkUnsynced();
  }

  // Tabs config
  const tabs = [
    { key: 'planning', label: t('tabs.planning') },
    { key: 'benchmark', label: t('tabs.benchmark') },
    { key: 'stats', label: t('tabs.stats') },
    { key: 'assistant', label: t('tabs.assistant') },
    { key: 'insights', label: t('tabs.review') },
  ];

  // Run status text
  function getRunStatusText(status) {
    return t(`status.${status}`) || t('status.idle');
  }

  return (
    <div className="app-shell">
      {/* Top bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="logo">RF</span>
          <strong>{t('app.title')}</strong>
        </div>
        <nav className="top-bar-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="top-bar-right">
          <button
            className={theme.theme === 'dark' ? 'active' : ''}
            onClick={theme.toggleTheme}
            title={t('theme.toggle')}
          >
            {theme.theme === 'dark' ? '☀' : '☾'}
          </button>
          <button className="text-btn" onClick={handleToggleLocale}>
            {locale === 'en' ? 'EN' : '中'}
          </button>
          <span className={`run-state ${planner.runStatus}`}>
            {getRunStatusText(planner.runStatus)}
          </span>
        </div>
      </header>

      {activeTab === 'planning' && (
        <main className="workspace-grid">
          <ControlRail
            algorithms={algorithms}
            scenario={planner.scenario}
            scenarioPresets={scenarioPresets}
            settings={planner.settings}
            plannerParams={planner.plannerParams}
            locale={locale}
            editMode={editMode}
            running={planner.running}
            runStatus={planner.runStatus}
            metrics={planner.metrics}
            applyScenario={handleApplyScenario}
            updateSettings={handleUpdateSettings}
            updatePlannerParam={handleUpdatePlannerParam}
            setEditMode={setEditMode}
            regenerateMap={handleRegenerateMap}
            clearPath={planner.clearPath}
            runPlanner={handleRunPlanner}
          />

          <section className="canvas-panel">
            <div className="canvas-panel-header">
              <h2>
                {activeAlgorithm.name} / {scenarioPresets[planner.scenario].name}
              </h2>
              <div className="canvas-panel-actions">
                <div className="view-toggle">
                  <button
                    className={viewMode === '2d' ? 'active' : ''}
                    onClick={() => setViewMode('2d')}
                  >
                    <Grid2x2 size={14} /> 2D
                  </button>
                  <button
                    className={viewMode === '3d' ? 'active' : ''}
                    onClick={() => setViewMode('3d')}
                  >
                    <Layers3 size={14} /> 3D
                  </button>
                </div>
              </div>
            </div>
            <div className={`canvas-wrap view-${viewMode}`}>
              {viewMode === '3d' ? (
                <Suspense
                  fallback={
                    <div className="canvas-loading">
                      <span />
                      <strong>{t('canvas.loading')}</strong>
                    </div>
                  }
                >
                  <ErrorBoundary name="3D Canvas" fallback={({ error, reset }) => (
                    <div className="canvas-error">
                      <p>3D rendering failed: {error?.message}</p>
                      <button onClick={reset}>Retry</button>
                      <button onClick={() => setViewMode('2d')}>Switch to 2D</button>
                    </div>
                  )}>
                    <LazySimulationCanvas3D
                      grid={planner.grid}
                      start={planner.start}
                      goal={planner.goal}
                      path={planner.path}
                      dynamicObstacles={planner.dynamicObstacles}
                      robotIndex={planner.robotIndex}
                      running={planner.running}
                      theme={theme.theme}
                    />
                  </ErrorBoundary>
                </Suspense>
              ) : (
                <SimulationCanvas
                  grid={planner.grid}
                  start={planner.start}
                  goal={planner.goal}
                  path={planner.path}
                  dynamicObstacles={planner.dynamicObstacles}
                  robotIndex={planner.robotIndex}
                  running={planner.running}
                  editMode={editMode}
                  onEditCell={handleEditCell}
                />
              )}
              <div className="canvas-hud">
                <div>
                  <span>{t('metrics.status')}</span>
                  <strong>
                    {planner.runStatus === 'running'
                      ? t('status.running')
                      : planner.runStatus === 'failed'
                      ? t('status.failed')
                      : planner.metrics.success
                      ? t('status.done')
                      : t('status.idle')}
                  </strong>
                </div>
                <div>
                  <span>{t('metrics.pathLength')}</span>
                  <strong>{planner.metrics.success ? planner.metrics.length : '-'}</strong>
                </div>
                <div>
                  <span>{t('metrics.nodes')}</span>
                  <strong>{planner.metrics.success ? planner.metrics.nodes : '-'}</strong>
                </div>
              </div>
            </div>
            <CanvasToolbar
              maps={workspace.workspace.maps}
              currentMapId={planner.currentMapId}
              metrics={planner.metrics}
              locale={locale}
              onSaveDraft={handleSaveDraft}
              onLoadDraft={handleLoadDraft}
              onDeleteDraft={handleDeleteDraft}
              onSaveRun={handleSaveCompareRun}
              onExport={handleExportMap}
              onImport={handleImportMap}
              onOpenCompare={() => setModal('compare')}
            />
          </section>

          <MetricsRail
            activeAlgorithm={activeAlgorithm}
            complexity={complexity}
            locale={locale}
            metrics={planner.metrics}
            settings={planner.settings}
          />
        </main>
      )}

      {activeTab === 'assistant' && (
        <AssistantPanel
          messages={chat.messages}
          chatInput={chat.chatInput}
          setChatInput={chat.setChatInput}
          sendMessage={handleSendMessage}
          apiConfig={chat.apiConfig}
          setModal={setModal}
          locale={locale}
        />
      )}
      {activeTab === 'benchmark' && (
        <div className="full-panel">
          <BenchmarkPanel
            grid={planner.grid}
            start={planner.start}
            goal={planner.goal}
            plannerParams={planner.plannerParams}
            locale={locale}
          />
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="full-panel">
          <StatsPanel locale={locale} />
        </div>
      )}

      {activeTab === 'insights' && (
        <InsightsPanel
          compareRuns={workspace.compareRuns}
          onClear={workspace.clearCompareRuns}
          locale={locale}
        />
      )}

      {modal === 'api' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ApiConfigPanel
              onClose={() => setModal(null)}
              locale={locale}
            />
          </div>
        </div>
      )}

      {modal && modal !== 'api' && (
        <Modal
          name={modal}
          onClose={() => setModal(null)}
          apiConfig={chat.apiConfig}
          saveApiConfig={handleSaveApiConfig}
          locale={locale}
        />
      )}

      {showShortcuts && (
        <div className="modal-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <ShortcutsHelpModal
              onClose={() => setShowShortcuts(false)}
              locale={locale}
            />
          </div>
        </div>
      )}
    </div>
  );
}
