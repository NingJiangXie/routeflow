import { algorithms } from '../data/catalog.js';

const STORAGE_KEY = 'routeflow_param_presets';

const DEFAULT_PRESETS = {
  astar: [
    { id: 'astar_default', name: '默认', description: '默认 A* 算法设置', params: {}, isBuiltIn: true },
  ],
  dstar: [
    { id: 'dstar_default', name: '默认', description: '默认 D* Lite 算法设置', params: {}, isBuiltIn: true },
  ],
  rrt: [
    { id: 'rrt_fast', name: '快速探索', description: '快速探索，迭代次数少', params: { maxIterations: 500, stepSize: 3, searchRadius: 5 }, isBuiltIn: true },
    { id: 'rrt_quality', name: '高质量', description: '更多迭代，更优路径', params: { maxIterations: 3000, stepSize: 2, searchRadius: 4 }, isBuiltIn: true },
    { id: 'rrt_default', name: '平衡', description: '速度与质量平衡', params: { maxIterations: 1800, stepSize: 2, searchRadius: 4 }, isBuiltIn: true },
  ],
  aco: [
    { id: 'aco_fast', name: '快速', description: '快速收敛', params: { ants: 12, iterations: 20, evaporation: 0.15 }, isBuiltIn: true },
    { id: 'aco_quality', name: '高质量', description: '更多蚂蚁和迭代', params: { ants: 50, iterations: 100, evaporation: 0.10 }, isBuiltIn: true },
    { id: 'aco_default', name: '平衡', description: '速度与质量平衡', params: { ants: 24, iterations: 48, evaporation: 0.12 }, isBuiltIn: true },
  ],
};

export function getAllPresets() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const result = {};
    for (const algo of Object.keys(algorithms)) {
      const builtIn = DEFAULT_PRESETS[algo] || [];
      const custom = stored[algo] || [];
      result[algo] = [...builtIn, ...custom];
    }
    return result;
  } catch {
    return { ...DEFAULT_PRESETS };
  }
}

export function getPresets(algorithm) {
  const all = getAllPresets();
  return all[algorithm] || [];
}

export function savePreset(algorithm, preset) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!stored[algorithm]) {
      stored[algorithm] = [];
    }
    const newPreset = {
      ...preset,
      id: preset.id || `custom_${Date.now()}`,
      isBuiltIn: false,
      createdAt: preset.createdAt || new Date().toISOString(),
    };
    stored[algorithm].push(newPreset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return newPreset;
  } catch (e) {
    console.error('Failed to save preset:', e);
    return null;
  }
}

export function deletePreset(algorithm, presetId) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!stored[algorithm]) return false;
    const initialLen = stored[algorithm].length;
    stored[algorithm] = stored[algorithm].filter(p => p.id !== presetId && !p.isBuiltIn);
    if (stored[algorithm].length === initialLen) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch (e) {
    console.error('Failed to delete preset:', e);
    return false;
  }
}

export function updatePreset(algorithm, presetId, updates) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!stored[algorithm]) return null;
    const idx = stored[algorithm].findIndex(p => p.id === presetId);
    if (idx === -1) return null;
    stored[algorithm][idx] = {
      ...stored[algorithm][idx],
      ...updates,
      id: presetId,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return stored[algorithm][idx];
  } catch (e) {
    console.error('Failed to update preset:', e);
    return null;
  }
}

export function exportPresets(format = 'json') {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    presets: stored,
  };
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  return data;
}

export function importPresets(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    if (!data.presets || typeof data.presets !== 'object') {
      throw new Error('Invalid presets format');
    }
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    let imported = 0;
    for (const algo of Object.keys(data.presets)) {
      if (!existing[algo]) existing[algo] = [];
      for (const preset of data.presets[algo]) {
        existing[algo].push({
          ...preset,
          id: `imported_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          isBuiltIn: false,
          importedFrom: data.exportedAt || 'unknown',
        });
        imported += 1;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return { success: true, imported };
  } catch (e) {
    console.error('Failed to import presets:', e);
    return { success: false, error: e.message };
  }
}

export function duplicatePreset(algorithm, presetId, newName) {
  const presets = getPresets(algorithm);
  const source = presets.find(p => p.id === presetId);
  if (!source) return null;
  return savePreset(algorithm, {
    name: newName || `${source.name} (副本)`,
    description: source.description,
    params: { ...source.params },
  });
}
