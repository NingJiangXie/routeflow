import { useState, useCallback } from 'react';
import { scenarioPresets } from '../data/catalog.js';
import { createGrid, createDynamicObstacles } from '../lib/planning.js';
import { emptyWorkspace } from '../services/workspace.js';

const defaultPlannerParams = {
  astar: {},
  dstar: {},
  rrt: { maxIterations: 1800, stepSize: 2, searchRadius: 4 },
  aco: { ants: 24, iterations: 48, evaporation: 0.12 },
};

function initialStateFromPreset(preset) {
  const start = { x: 1, y: 1 };
  const goal = { x: preset.gridSize - 2, y: preset.gridSize - 2 };
  return {
    start,
    goal,
    grid: createGrid(preset.gridSize, preset.density, start, goal),
    dynamicObstacles: createDynamicObstacles(preset, start, goal),
  };
}

export function usePlanner() {
  const initial = initialStateFromPreset(scenarioPresets.balanced);
  
  const [scenario, setScenario] = useState('balanced');
  const [settings, setSettings] = useState(scenarioPresets.balanced);
  const [plannerParams, setPlannerParams] = useState(defaultPlannerParams);
  const [start, setStart] = useState(initial.start);
  const [goal, setGoal] = useState(initial.goal);
  const [grid, setGrid] = useState(initial.grid);
  const [path, setPath] = useState([]);
  const [dynamicObstacles, setDynamicObstacles] = useState(initial.dynamicObstacles);
  const [robotIndex, setRobotIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState('idle');
  const [metrics, setMetrics] = useState({ length: 0, time: 0, nodes: 0, replans: 0, success: false });
  const [currentMapId, setCurrentMapId] = useState(null);

  const resetRun = useCallback((status = 'idle') => {
    setPath([]);
    setRobotIndex(0);
    setRunning(false);
    setRunStatus(status);
    setMetrics({ length: 0, time: 0, nodes: 0, replans: 0, success: false });
  }, []);

  const clearPath = useCallback(() => resetRun(), [resetRun]);

  const applyScenario = useCallback((name) => {
    const preset = scenarioPresets[name];
    const next = initialStateFromPreset(preset);
    setScenario(name);
    setSettings(preset);
    setStart(next.start);
    setGoal(next.goal);
    setGrid(next.grid);
    setDynamicObstacles(next.dynamicObstacles);
    setCurrentMapId(null);
    resetRun();
  }, [resetRun]);

  const updateSettings = useCallback((patch) => {
    setSettings((c) => ({ ...c, ...patch }));
  }, []);

  const updatePlannerParam = useCallback((algo, patch) => {
    setPlannerParams((c) => ({
      ...c,
      [algo]: { ...(c[algo] || {}), ...patch },
    }));
  }, []);

  const regenerateMap = useCallback(() => {
    const s = { x: 1, y: 1 };
    const g = { x: settings.gridSize - 2, y: settings.gridSize - 2 };
    setStart(s);
    setGoal(g);
    setGrid(createGrid(settings.gridSize, settings.density, s, g));
    setDynamicObstacles(createDynamicObstacles(settings, s, g));
    setCurrentMapId(null);
    resetRun();
  }, [settings, resetRun]);

  const runPlanner = useCallback((result) => {
    setPath(result.path);
    setRobotIndex(0);
    setRunning(result.success);
    setRunStatus(result.success ? 'running' : 'failed');
    setMetrics({
      length: result.path.length > 0 
        ? result.path.slice(1).reduce((total, point, index) => {
            const prev = result.path[index];
            return total + Math.hypot(point.x - prev.x, point.y - prev.y);
          }, 0).toFixed(1)
        : 0,
      time: result.time.toFixed(1),
      nodes: result.expanded,
      replans: settings.dynamic ? Math.max(1, Math.floor(dynamicObstacles.length / 8)) : 0,
      success: result.success,
    });
  }, [dynamicObstacles.length, settings.dynamic]);

  const editCell = useCallback((point, mode) => {
    if (!point || point.x < 0 || point.y < 0 || point.x >= grid.length || point.y >= grid.length) return;
    
    const isStart = point.x === start.x && point.y === start.y;
    const isGoal = point.x === goal.x && point.y === goal.y;
    
    if (mode === 'start' && !isGoal) {
      setGrid((c) => clearCell(c, point));
      setStart(point);
    } else if (mode === 'goal' && !isStart) {
      setGrid((c) => clearCell(c, point));
      setGoal(point);
    } else if (mode === 'draw' && !isStart && !isGoal) {
      setGrid((c) => setGridCell(c, point, 1));
    } else if (mode === 'erase') {
      setGrid((c) => setGridCell(c, point, 0));
    }
    resetRun();
  }, [grid.length, start, goal, resetRun]);

  const loadDraft = useCallback((draft) => {
    setScenario(draft.scenario || scenario);
    setSettings(draft.settings || settings);
    setPlannerParams(draft.plannerParams || plannerParams);
    setStart(draft.start || start);
    setGoal(draft.goal || goal);
    setGrid(draft.grid || grid);
    setDynamicObstacles(draft.dynamicObstacles || []);
    setCurrentMapId(draft.id);
    resetRun();
  }, [scenario, settings, plannerParams, start, goal, grid, resetRun]);

  const getDraftData = useCallback((wsScenario = scenario, wsSettings = settings, wsPlannerParams = plannerParams, wsStart = start, wsGoal = goal, wsGrid = grid, wsDynamicObstacles = dynamicObstacles, wsCurrentMapId = currentMapId) => ({
    scenario: wsScenario,
    settings: wsSettings,
    plannerParams: wsPlannerParams,
    start: wsStart,
    goal: wsGoal,
    grid: wsGrid,
    dynamicObstacles: wsDynamicObstacles,
    currentMapId: wsCurrentMapId,
  }), [scenario, settings, plannerParams, start, goal, grid, dynamicObstacles, currentMapId]);

  return {
    // State
    scenario,
    settings,
    plannerParams,
    start,
    goal,
    grid,
    path,
    dynamicObstacles,
    robotIndex,
    running,
    runStatus,
    metrics,
    currentMapId,
    // Setters
    setScenario,
    setSettings,
    setPlannerParams,
    setStart,
    setGoal,
    setGrid,
    setPath,
    setDynamicObstacles,
    setRobotIndex,
    setRunning,
    setRunStatus,
    setMetrics,
    setCurrentMapId,
    // Actions
    resetRun,
    clearPath,
    applyScenario,
    updateSettings,
    updatePlannerParam,
    regenerateMap,
    runPlanner,
    editCell,
    loadDraft,
    getDraftData,
  };
}

function setGridCell(grid, point, value) {
  if (grid[point.y]?.[point.x] === value) return grid;
  const n = grid.map((r) => [...r]);
  n[point.y][point.x] = value;
  return n;
}

function clearCell(grid, point) {
  return setGridCell(grid, point, 0);
}

export { defaultPlannerParams };
