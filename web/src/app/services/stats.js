const STORAGE_KEY = 'routeflow_stats';

const EMPTY_STATS = {
  totalRuns: 0,
  totalTime: 0,
  successCount: 0,
  algorithmStats: {},
  dailyStats: {},
  firstRunAt: null,
  lastRunAt: null,
};

export function getStats() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...EMPTY_STATS, ...stored };
  } catch {
    return { ...EMPTY_STATS };
  }
}

export function recordRun(runData) {
  try {
    const stats = getStats();
    const today = new Date().toISOString().split('T')[0];

    stats.totalRuns += 1;
    stats.totalTime += runData.time || 0;
    if (runData.success) stats.successCount += 1;

    const algo = runData.algorithm || 'unknown';
    if (!stats.algorithmStats[algo]) {
      stats.algorithmStats[algo] = {
        runs: 0,
        success: 0,
        totalTime: 0,
        totalLength: 0,
        totalNodes: 0,
        bestTime: Infinity,
        bestLength: Infinity,
      };
    }
    const as = stats.algorithmStats[algo];
    as.runs += 1;
    if (runData.success) {
      as.success += 1;
      as.totalTime += runData.time || 0;
      as.totalLength += runData.length || 0;
      as.totalNodes += runData.nodes || 0;
      as.bestTime = Math.min(as.bestTime, runData.time || Infinity);
      as.bestLength = Math.min(as.bestLength, runData.length || Infinity);
    }

    if (!stats.dailyStats[today]) {
      stats.dailyStats[today] = { runs: 0, success: 0, time: 0 };
    }
    stats.dailyStats[today].runs += 1;
    if (runData.success) stats.dailyStats[today].success += 1;
    stats.dailyStats[today].time += runData.time || 0;

    if (!stats.firstRunAt) stats.firstRunAt = new Date().toISOString();
    stats.lastRunAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    return stats;
  } catch (e) {
    console.error('Failed to record run stats:', e);
    return getStats();
  }
}

export function getAlgorithmRanking() {
  const stats = getStats();
  const ranking = Object.entries(stats.algorithmStats)
    .map(([algo, data]) => ({
      algorithm: algo,
      runs: data.runs,
      successRate: data.runs > 0 ? (data.success / data.runs) * 100 : 0,
      avgTime: data.success > 0 ? data.totalTime / data.success : 0,
      avgLength: data.success > 0 ? data.totalLength / data.success : 0,
      avgNodes: data.success > 0 ? data.totalNodes / data.success : 0,
      bestTime: data.bestTime === Infinity ? 0 : data.bestTime,
      bestLength: data.bestLength === Infinity ? 0 : data.bestLength,
    }))
    .sort((a, b) => b.successRate - a.successRate || a.avgTime - b.avgTime);

  return ranking;
}

export function getTrendData(days = 7) {
  const stats = getStats();
  const result = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayData = stats.dailyStats[dateStr] || { runs: 0, success: 0, time: 0 };
    result.push({
      date: dateStr,
      ...dayData,
      successRate: dayData.runs > 0 ? (dayData.success / dayData.runs) * 100 : 0,
    });
  }

  return result;
}

export function clearStats() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function exportStats(format = 'json') {
  const stats = getStats();
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...stats,
  };

  if (format === 'csv') {
    const lines = ['Date,Runs,Success,Time (ms),Success Rate (%)'];
    for (const [date, day] of Object.entries(stats.dailyStats)) {
      const rate = day.runs > 0 ? ((day.success / day.runs) * 100).toFixed(1) : '0';
      lines.push(`${date},${day.runs},${day.success},${day.time.toFixed(2)},${rate}`);
    }
    return lines.join('\n');
  }

  return JSON.stringify(data, null, 2);
}
