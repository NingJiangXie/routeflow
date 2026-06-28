import { api, API_ERROR_TYPES } from './api.js';

const WORKSPACE_ENDPOINT = '/api/workspace';

export const emptyWorkspace = {
  version: 1,
  maps: [],
  runs: [],
  presets: [],
  updated_at: null,
};

export async function loadWorkspace() {
  try {
    const data = await api.get(WORKSPACE_ENDPOINT);
    return normalizeWorkspace(data.workspace);
  } catch (error) {
    if (error.type === API_ERROR_TYPES.NETWORK || error.type === API_ERROR_TYPES.SERVER) {
      return emptyWorkspace;
    }
    throw error;
  }
}

export async function saveWorkspace(workspace) {
  const payload = {
    ...normalizeWorkspace(workspace),
    updated_at: new Date().toISOString(),
  };
  const data = await api.post(WORKSPACE_ENDPOINT, payload);
  return normalizeWorkspace(data.workspace);
}

export function normalizeWorkspace(workspace) {
  const ws = workspace || {};
  return {
    version: Number(ws.version || 1),
    maps: Array.isArray(ws.maps) ? ws.maps : [],
    runs: Array.isArray(ws.runs) ? ws.runs : [],
    presets: Array.isArray(ws.presets) ? ws.presets : [],
    updated_at: ws.updated_at || null,
  };
}
