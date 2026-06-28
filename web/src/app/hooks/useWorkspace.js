import { useState, useCallback, useEffect } from 'react';
import { loadWorkspace as loadWs, saveWorkspace as saveWs, emptyWorkspace } from '../services/workspace.js';

export function useWorkspace() {
  const [workspace, setWorkspace] = useState(emptyWorkspace);
  const [compareRuns, setCompareRuns] = useState([]);
  const [workspaceStatus, setWorkspaceStatus] = useState('workspace.syncing');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function loadWorkspace() {
    setWorkspaceStatus('workspace.syncing');
    try {
      const next = await loadWs();
      setWorkspace(next);
      setCompareRuns(next.runs.slice(0, 20));
      setWorkspaceStatus(next.updated_at ? 'workspace.synced' : 'workspace.empty');
    } catch {
      setWorkspaceStatus('workspace.offline');
    }
  }

  async function persistWorkspace(ws, label = 'workspace.synced') {
    setWorkspace(ws);
    setWorkspaceStatus('workspace.syncing');
    setIsSyncing(true);
    try {
      const saved = await saveWs(ws);
      setWorkspace(saved);
      setCompareRuns(saved.runs.slice(0, 20));
      setWorkspaceStatus(label);
      return saved;
    } catch {
      setWorkspaceStatus('workspace.offline');
      return ws;
    } finally {
      setIsSyncing(false);
    }
  }

  const markUnsynced = useCallback(() => {
    if (!workspaceStatus.includes('offline')) {
      setWorkspaceStatus('workspace.unsynced');
    }
  }, [workspaceStatus]);

  const saveDraft = useCallback((draftData, scenarioName) => {
    const now = new Date().toISOString();
    const id = draftData.id || `map-${Date.now()}`;
    const draft = {
      ...draftData,
      id,
      name: `${scenarioName} ${new Date().toLocaleTimeString()}`,
      createdAt: workspace.maps.find((m) => m.id === id)?.createdAt || now,
      updatedAt: now,
    };
    const maps = [draft, ...workspace.maps.filter((m) => m.id !== id)].slice(0, 24);
    return persistWorkspace({ ...workspace, maps }, 'workspace.draftSaved');
  }, [workspace, persistWorkspace]);

  const deleteDraft = useCallback(async (mapId) => {
    if (!mapId) return;
    return persistWorkspace(
      { ...workspace, maps: workspace.maps.filter((m) => m.id !== mapId) },
      'workspace.draftDeleted'
    );
  }, [workspace, persistWorkspace]);

  const saveCompareRun = useCallback((runData) => {
    const run = {
      id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...runData,
      createdAt: new Date().toISOString(),
    };
    const runs = [run, ...compareRuns].slice(0, 30);
    setCompareRuns(runs);
    return persistWorkspace({ ...workspace, runs }, 'workspace.runSaved');
  }, [workspace, compareRuns, persistWorkspace]);

  const clearCompareRuns = useCallback(async () => {
    setCompareRuns([]);
    await persistWorkspace({ ...workspace, runs: [] }, 'workspace.runsCleared');
  }, [workspace, persistWorkspace]);

  return {
    workspace,
    compareRuns,
    workspaceStatus,
    isSyncing,
    loadWorkspace,
    persistWorkspace,
    markUnsynced,
    saveDraft,
    deleteDraft,
    saveCompareRun,
    clearCompareRuns,
  };
}
