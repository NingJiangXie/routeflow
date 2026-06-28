import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { algorithms } from '../data/catalog.js';

export const MetricsRail = ({
  activeAlgorithm, complexity, locale,
  metrics, settings,
}) => {
  const { t } = useTranslation();

  const items = useMemo(() => [
    { label: t('metrics.pathLength'), value: metrics.success ? metrics.length : '-', highlight: metrics.success },
    { label: t('metrics.time'), value: metrics.success ? `${metrics.time}ms` : '-', highlight: metrics.success },
    { label: t('metrics.nodes'), value: metrics.success ? metrics.nodes : '-', highlight: metrics.success },
    { label: t('metrics.replans'), value: metrics.success ? metrics.replans : '-', highlight: metrics.success },
    { label: locale === 'en' ? 'Complexity' : '复杂度', value: complexity },
    { label: locale === 'en' ? 'Grid' : '网格', value: `${settings.gridSize}x${settings.gridSize}` },
  ], [t, metrics, complexity, locale, settings.gridSize]);

  return (
    <aside className="metrics-rail">
      <div className="section-label">{locale === 'en' ? 'Metrics' : '指标'}</div>
      <div className="metric-list">
        {items.map(item => (
          <div key={item.label} className={`metric-item ${item.highlight ? 'has-value' : ''}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      {metrics.success && (
        <div className="metric-summary">
          <span className="algo-tag">{activeAlgorithm.name}</span>
          <span className="algo-tag">{t(activeAlgorithm.labelKey || 'algorithm.astar.label')}</span>
        </div>
      )}
    </aside>
  );
};
