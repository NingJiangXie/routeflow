import { useEffect, useCallback } from 'react';

export const DEFAULT_SHORTCUTS = {
  playPause: { key: ' ', label: 'Space', description: '播放/暂停', descriptionEn: 'Play/Pause' },
  reset: { key: 'r', label: 'R', description: '重置路径', descriptionEn: 'Reset path' },
  clearMap: { key: 'c', label: 'C', description: '清除地图', descriptionEn: 'Clear map' },
  regenerate: { key: 'g', label: 'G', description: '重新生成地图', descriptionEn: 'Regenerate map' },
  toggleView: { key: 'v', label: 'V', description: '切换 2D/3D 视图', descriptionEn: 'Toggle 2D/3D view' },
  toggleLocale: { key: 'l', label: 'L', description: '切换语言', descriptionEn: 'Toggle language' },
  modeDraw: { key: '1', label: '1', description: '绘制模式', descriptionEn: 'Draw mode' },
  modeErase: { key: '2', label: '2', description: '擦除模式', descriptionEn: 'Erase mode' },
  modeStart: { key: '3', label: '3', description: '起点模式', descriptionEn: 'Start mode' },
  modeGoal: { key: '4', label: '4', description: '终点模式', descriptionEn: 'Goal mode' },
  speedUp: { key: ']', label: ']', description: '加速', descriptionEn: 'Speed up' },
  speedDown: { key: '[', label: '[', description: '减速', descriptionEn: 'Slow down' },
  stepForward: { key: 'ArrowRight', label: '→', description: '单步前进', descriptionEn: 'Step forward' },
  stepBackward: { key: 'ArrowLeft', label: '←', description: '单步后退', descriptionEn: 'Step backward' },
  help: { key: '?', label: '?', description: '显示快捷键帮助', descriptionEn: 'Show shortcuts help' },
  save: { key: 'ctrl+s', label: 'Ctrl+S', description: '保存工作区', descriptionEn: 'Save workspace' },
  benchmark: { key: 'b', label: 'B', description: '运行基准测试', descriptionEn: 'Run benchmark' },
};

const STORAGE_KEY = 'routeflow_shortcuts';

export function getShortcuts() {
  try {
    const custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const result = {};
    for (const [id, shortcut] of Object.entries(DEFAULT_SHORTCUTS)) {
      result[id] = { ...shortcut, ...(custom[id] || {}) };
    }
    return result;
  } catch {
    return { ...DEFAULT_SHORTCUTS };
  }
}

export function setShortcut(id, keyConfig) {
  try {
    const custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    custom[id] = { ...custom[id], ...keyConfig };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    return true;
  } catch {
    return false;
  }
}

export function resetShortcuts() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function matchShortcut(event, shortcut) {
  const key = shortcut.key?.toLowerCase() || '';
  const parts = key.split('+').map(p => p.trim().toLowerCase());

  const needsCtrl = parts.includes('ctrl') || parts.includes('control');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt');
  const mainKey = parts.filter(p => !['ctrl', 'control', 'shift', 'alt'].includes(p))[0];

  if (needsCtrl && !event.ctrlKey && !event.metaKey) return false;
  if (needsShift && !event.shiftKey) return false;
  if (needsAlt && !event.altKey) return false;

  if (!mainKey) return false;

  if (mainKey === ' ') {
    return event.key === ' ' || event.code === 'Space';
  }

  if (mainKey.startsWith('arrow')) {
    return event.key.toLowerCase() === mainKey;
  }

  return event.key.toLowerCase() === mainKey;
}

export function useKeyboardShortcuts(handlers, deps = []) {
  const handleKeyDown = useCallback((event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
      return;
    }

    const shortcuts = getShortcuts();

    for (const [id, shortcut] of Object.entries(shortcuts)) {
      if (matchShortcut(event, shortcut) && handlers[id]) {
        event.preventDefault();
        handlers[id](event);
        break;
      }
    }
  }, deps);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
