import { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, TrendingUp, Trophy, Clock, Target, Download, Trash2 } from 'lucide-react';
import { getStats, getAlgorithmRanking, getTrendData, clearStats, exportStats } from '../services/stats.js';
import { downloadFile } from '../lib/files.js';

const StatsPanel = memo(function StatsPanel({ locale }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStats(getStats());
    setRanking(getAlgorithmRanking());
    setTrend(getTrendData(7));
  };

  const handleClear = () => {
    if (confirm(t('maps.confirmDelete'))) {
      clearStats();
      refreshData();
    }
  };

  const handleExport = () => {
    const csv = exportStats('csv');
    downloadFile(`routeflow-stats-${Date.now()}.csv`, csv, 'text/csv');
  };

  const formatTime = (ms) => {
    const num = Number(ms) || 0;
    if (num < 1000) return `${num.toFixed(0)}ms`;
    return `${(num / 1000).toFixed(2)}s`;
  };

  const maxTrendValue = Math.max(...trend.map(d => d.runs), 1);

  return (
    <div className="stats-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{t('stats.title')}</span>
          <h2>{t('stats.title')}</h2>
        </div>
        <div className="panel-actions">
          <button onClick={handleExport} className="secondary-btn" disabled={!stats?.totalRuns}>
            <Download size={16} />
            {t('stats.export')}
          </button>
          <button onClick={handleClear} className="danger-btn" disabled={!stats?.totalRuns}>
            <Trash2 size={16} />
            {t('stats.clear')}
          </button>
        </div>
      </div>

      {stats?.totalRuns > 0 ? (
        <>
          <div className="stats-overview">
            <div className="stat-card">
              <BarChart2 size={24} />
              <div>
                <span className="stat-label">{t('stats.totalRuns')}</span>
                <strong className="stat-value">{stats.totalRuns}</strong>
              </div>
            </div>
            <div className="stat-card">
              <Clock size={24} />
              <div>
                <span className="stat-label">{t('stats.totalTime')}</span>
                <strong className="stat-value">{formatTime(stats.totalTime)}</strong>
              </div>
            </div>
            <div className="stat-card">
              <Target size={24} />
              <div>
                <span className="stat-label">{t('stats.successRate')}</span>
                <strong className="stat-value">
                  {stats.totalRuns > 0 ? ((stats.successCount / stats.totalRuns) * 100).toFixed(1) : 0}%
                </strong>
              </div>
            </div>
            <div className="stat-card best">
              <Trophy size={24} />
              <div>
                <span className="stat-label">{t('stats.bestAlgorithm')}</span>
                <strong className="stat-value">{ranking[0]?.algorithm?.toUpperCase() || '-'}</strong>
              </div>
            </div>
          </div>

          <div className="stats-sections">
            <div className="stats-section">
              <h3 className="section-title">
                <TrendingUp size={18} />
                {t('stats.weeklyTrend')}
              </h3>
              <div className="trend-chart">
                {trend.map(day => (
                  <div key={day.date} className="trend-day">
                    <div className="trend-bar-wrap">
                      <div
                        className="trend-bar success"
                        style={{ height: `${(day.success / maxTrendValue) * 100}%` }}
                      />
                      <div
                        className="trend-bar total"
                        style={{ height: `${(day.runs / maxTrendValue) * 100}%` }}
                      />
                    </div>
                    <span className="trend-label">
                      {new Date(day.date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'numeric', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section">
              <h3 className="section-title">
                <Trophy size={18} />
                {t('stats.algorithmRanking')}
              </h3>
              <div className="ranking-list">
                {ranking.map((algo, idx) => (
                  <div key={algo.algorithm} className="ranking-item">
                    <span className="ranking-rank">#{idx + 1}</span>
                    <div className="ranking-info">
                      <span className="ranking-name">{algo.algorithm.toUpperCase()}</span>
                      <span className="ranking-detail">
                        {algo.runs} runs · {algo.successRate.toFixed(0)}% success
                      </span>
                    </div>
                    <div className="ranking-metrics">
                      <span className="metric-small">{algo.avgTime.toFixed(1)}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <BarChart2 size={48} />
          <p>{t('stats.noData')}</p>
        </div>
      )}
    </div>
  );
});

export { StatsPanel };