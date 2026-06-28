import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, BarChart3, Table, Download, RefreshCw, Trophy, Clock, MapPin, Network } from 'lucide-react';
import { runBenchmark, calculateScores, exportBenchmarkReport, BENCHMARK_PRESETS } from '../lib/benchmark.js';
import { downloadFile } from '../lib/files.js';

const BenchmarkPanel = memo(function BenchmarkPanel({ grid, start, goal, plannerParams, locale }) {
  const { t } = useTranslation();
  const [selectedAlgorithms, setSelectedAlgorithms] = useState(['astar', 'dstar', 'rrt', 'aco']);
  const [preset, setPreset] = useState('quick');
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [viewMode, setViewMode] = useState('chart');
  const [error, setError] = useState(null);

  const allAlgorithms = [
    { id: 'astar', name: 'A*' },
    { id: 'dstar', name: 'D* Lite' },
    { id: 'rrt', name: 'RRT*' },
    { id: 'aco', name: 'ACO' },
  ];

  const handleRun = useCallback(async () => {
    if (!grid || !start || !goal) {
      setError(t('errors.planFailed'));
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const presetConfig = BENCHMARK_PRESETS[preset];
      const runs = presetConfig?.runs || 1;
      const algos = selectedAlgorithms.length > 0 ? selectedAlgorithms : ['astar'];

      await new Promise(resolve => setTimeout(resolve, 10));

      const benchmarkResults = [];
      for (const algo of algos) {
        let bestResult = null;
        for (let i = 0; i < runs; i++) {
          const params = plannerParams?.[algo] || {};
          const { planPath, pathLength } = await import('../lib/planning.js');
          const result = planPath(grid, start, goal, algo, params);
          if (!bestResult || (result.success && result.time < bestResult.time)) {
            bestResult = {
              algorithm: algo,
              success: result.success,
              length: result.success ? pathLength(result.path) : 0,
              time: result.time,
              nodes: result.nodes,
              algorithmName: result.algorithm,
            };
          }
        }
        if (bestResult) benchmarkResults.push(bestResult);
      }

      const scored = calculateScores(benchmarkResults, {
        time: 0.3,
        length: 0.4,
        nodes: 0.3,
      });

      setResults(scored);
    } catch (err) {
      setError(err.message || t('errors.planFailed'));
    } finally {
      setRunning(false);
    }
  }, [grid, start, goal, selectedAlgorithms, preset, plannerParams, t]);

  const toggleAlgorithm = useCallback((algo) => {
    setSelectedAlgorithms(prev => {
      if (prev.includes(algo)) {
        if (prev.length === 1) return prev;
        return prev.filter(a => a !== algo);
      }
      return [...prev, algo];
    });
  }, []);

  const handleExport = useCallback(() => {
    if (!results) return;
    const json = exportBenchmarkReport(results, 'json');
    downloadFile(`routeflow-benchmark-${Date.now()}.json`, json, 'application/json');
  }, [results]);

  const getBest = useCallback((metric) => {
    if (!results?.length) return null;
    const sorted = [...results]
      .filter(r => r.success)
      .sort((a, b) => (a[metric] || Infinity) - (b[metric] || Infinity));
    return sorted[0] || null;
  }, [results]);

  const getBestScore = useCallback(() => {
    if (!results?.length) return null;
    const sorted = [...results]
      .filter(r => r.success)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    return sorted[0] || null;
  }, [results]);

  const maxValue = useCallback((metric) => {
    if (!results?.length) return 1;
    return Math.max(...results.map(r => r[metric] || 0), 1);
  }, [results]);

  return (
    <div className="benchmark-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{t('benchmark.title')}</span>
          <h2>{t('benchmark.title')}</h2>
        </div>
        <div className="panel-actions">
          <button
            onClick={handleRun}
            disabled={running}
            className="primary-btn"
          >
            {running ? <RefreshCw size={16} className="spinning" /> : <Play size={16} />}
            {running ? t('benchmark.running') : t('benchmark.run')}
          </button>
          {results && (
            <button onClick={handleExport} className="secondary-btn">
              <Download size={16} />
              {t('benchmark.export')}
            </button>
          )}
        </div>
      </div>

      <div className="benchmark-config">
        <div className="config-section">
          <label className="section-label">{t('benchmark.preset')}</label>
          <div className="preset-options">
            {Object.entries(BENCHMARK_PRESETS).map(([key, p]) => (
              <button
                key={key}
                className={`preset-btn ${preset === key ? 'active' : ''}`}
                onClick={() => setPreset(key)}
                disabled={running}
              >
                <strong>{t(`benchmark.presets.${key}`)}</strong>
                <span>{t(`benchmark.presets.${key}Desc`)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="config-section">
          <label className="section-label">{t('benchmark.algorithms')}</label>
          <div className="algo-checkboxes">
            {allAlgorithms.map(algo => (
              <label key={algo.id} className={`algo-checkbox ${selectedAlgorithms.includes(algo.id) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedAlgorithms.includes(algo.id)}
                  onChange={() => toggleAlgorithm(algo.id)}
                  disabled={running}
                />
                <span>{algo.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      {results && (
        <div className="benchmark-results">
          <div className="benchmark-summary">
            <div className="summary-card">
              <Clock size={20} />
              <div>
                <span className="summary-label">{t('benchmark.summary.bestTime')}</span>
                <strong>{getBest('time')?.algorithmName || '-'}</strong>
                <small>{getBest('time') ? `${getBest('time').time.toFixed(2)}ms` : ''}</small>
              </div>
            </div>
            <div className="summary-card">
              <MapPin size={20} />
              <div>
                <span className="summary-label">{t('benchmark.summary.bestLength')}</span>
                <strong>{getBest('length')?.algorithmName || '-'}</strong>
                <small>{getBest('length') ? getBest('length').length.toFixed(1) : ''}</small>
              </div>
            </div>
            <div className="summary-card">
              <Network size={20} />
              <div>
                <span className="summary-label">{t('benchmark.summary.bestNodes')}</span>
                <strong>{getBest('nodes')?.algorithmName || '-'}</strong>
                <small>{getBest('nodes') ? getBest('nodes').nodes : ''}</small>
              </div>
            </div>
            <div className="summary-card best">
              <Trophy size={20} />
              <div>
                <span className="summary-label">{t('benchmark.summary.bestOverall')}</span>
                <strong>{getBestScore()?.algorithmName || '-'}</strong>
                <small>{getBestScore() ? `${t('metrics.score')}: ${getBestScore().score}` : ''}</small>
              </div>
            </div>
          </div>

          <div className="results-toolbar">
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'chart' ? 'active' : ''}`}
                onClick={() => setViewMode('chart')}
              >
                <BarChart3 size={14} />
                {t('benchmark.chart')}
              </button>
              <button
                className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <Table size={14} />
                {t('benchmark.table')}
              </button>
            </div>
          </div>

          {viewMode === 'chart' && (
            <div className="benchmark-chart">
              <div className="chart-bars">
                {['time', 'length', 'nodes'].map(metric => (
                  <div key={metric} className="chart-group">
                    <div className="chart-group-label">{t(`metrics.${metric}`)}</div>
                    <div className="bar-list">
                      {results.map(result => {
                        const val = result[metric] || 0;
                        const max = maxValue(metric);
                        const pct = max > 0 ? (val / max) * 100 : 0;
                        return (
                          <div key={`${result.algorithm}-${metric}`} className="bar-row">
                            <span className="bar-label">{result.algorithmName}</span>
                            <div className="bar-track">
                              <div
                                className={`bar-fill ${result.success ? '' : 'failed'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="bar-value">
                              {metric === 'time' ? `${val.toFixed(1)}ms` : val.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'table' && (
            <div className="benchmark-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('insights.algorithm')}</th>
                    <th>{t('metrics.success')}</th>
                    <th>{t('metrics.pathLength')}</th>
                    <th>{t('metrics.time')}</th>
                    <th>{t('metrics.nodes')}</th>
                    <th>{t('metrics.score')}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(result => (
                    <tr key={result.algorithm}>
                      <td><strong>{result.algorithmName}</strong></td>
                      <td>{result.success ? '✓' : '✗'}</td>
                      <td>{result.success ? result.length.toFixed(2) : '-'}</td>
                      <td>{result.time.toFixed(2)}ms</td>
                      <td>{result.nodes}</td>
                      <td><strong>{result.score?.toFixed(2) || '-'}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!results && !running && !error && (
        <div className="empty-state">
          {t('benchmark.tip')}
        </div>
      )}
    </div>
  );
});

export { BenchmarkPanel };