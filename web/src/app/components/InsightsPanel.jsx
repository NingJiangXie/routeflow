import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, Trophy } from 'lucide-react';
import { downloadFile } from '../lib/files.js';
import { Metric } from './ui.jsx';

export const InsightsPanel = ({ compareRuns, setCompareRuns, onClear, locale }) => {
  const { t } = useTranslation();

  const analysis = useMemo(() => {
    if (!compareRuns.length) return null;

    const sorted = [...compareRuns];
    const bestLength = [...sorted].sort((a, b) => Number(a.length) - Number(b.length))[0];
    const fastest = [...sorted].sort((a, b) => Number(a.time) - Number(b.time))[0];
    const bestSearch = [...sorted].sort((a, b) => Number(a.nodes) - Number(b.nodes))[0];

    const rankedRuns = sorted
      .map(run => ({ ...run, score: scoreRun(run, bestLength, fastest, bestSearch) }))
      .sort((a, b) => b.score - a.score);

    return { bestLength, fastest, bestSearch, rankedRuns };
  }, [compareRuns]);

  const exportReport = useCallback(() => {
    if (!analysis) return;
    const { bestLength, fastest, bestSearch, rankedRuns } = analysis;
    const isZh = locale === 'zh';
    const lines = [
      isZh ? '# RouteFlow 算法复盘报告' : '# RouteFlow Algorithm Review Report',
      '',
      isZh ? `生成时间：${new Date().toLocaleString()}` : `Generated: ${new Date().toLocaleString()}`,
      isZh ? `样本数量：${compareRuns.length}` : `Sample Count: ${compareRuns.length}`,
      bestLength ? `${isZh ? '最短路径' : 'Shortest Path'}: ${bestLength.algorithm} / ${bestLength.length}` : '-',
      fastest ? `${isZh ? '最快执行' : 'Fastest'}: ${fastest.algorithm} / ${fastest.time}ms` : '-',
      bestSearch ? `${isZh ? '最低搜索节点' : 'Best Search'}: ${bestSearch.algorithm} / ${bestSearch.nodes}` : '-',
      '',
      isZh ? '| 算法 | 场景 | 长度 | 节点 | 耗时 | 评分 |' : '| Algorithm | Scenario | Length | Nodes | Time | Score |',
      isZh ? '| --- | --- | ---: | ---: | ---: | ---: |' : '| --- | --- | ---: | ---: | ---: | ---: |',
      ...rankedRuns.map(run => `| ${run.algorithm} | ${run.scenario} | ${run.length} | ${run.nodes} | ${run.time}ms | ${run.score} |`),
    ];
    downloadFile('routeflow-review.md', lines.join('\n'), 'text/markdown');
  }, [analysis, locale, compareRuns.length]);

  const handleClear = useCallback(() => {
    onClear ? onClear() : setCompareRuns([]);
  }, [onClear, setCompareRuns]);

  if (!analysis) {
    return (
      <main className="insights-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t('insights.title')}</span>
              <h2>{locale === 'zh' ? '算法复盘分析' : 'Algorithm Review Analysis'}</h2>
            </div>
          </div>
          <div className="empty-state">{t('insights.noRuns')}</div>
        </section>
      </main>
    );
  }

  const { bestLength, fastest, bestSearch, rankedRuns } = analysis;

  return (
    <main className="insights-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t('insights.title')}</span>
            <h2>{locale === 'zh' ? '算法复盘分析' : 'Algorithm Review Analysis'}</h2>
          </div>
          <div className="toolbar compact">
            <button onClick={exportReport} disabled={!compareRuns.length}>
              <Download size={16} />{locale === 'zh' ? '导出报告' : 'Export Report'}
            </button>
            <button onClick={handleClear} disabled={!compareRuns.length}>
              <Trash2 size={16} />{t('insights.clear')}
            </button>
          </div>
        </div>
        <div className="metric-grid">
          <Metric label={locale === 'zh' ? '已保存' : 'Saved'} value={compareRuns.length} />
          <Metric label={locale === 'zh' ? '最短路径' : 'Shortest'} value={bestLength ? `${bestLength.algorithm} / ${bestLength.length}` : '-'} />
          <Metric label={locale === 'zh' ? '最快执行' : 'Fastest'} value={fastest ? `${fastest.algorithm} / ${fastest.time}ms` : '-'} />
          <Metric label={locale === 'zh' ? '搜索效率' : 'Best Search'} value={bestSearch ? `${bestSearch.algorithm} / ${bestSearch.nodes}` : '-'} />
        </div>
        {rankedRuns[0] && (
          <div className="review-callout">
            <strong>
              <Trophy size={16} />
              {locale === 'zh' ? '推荐策略' : 'Recommended'}: {rankedRuns[0].algorithm}
            </strong>
            <span>{buildRecommendation(rankedRuns[0], bestLength, fastest, bestSearch, locale)}</span>
          </div>
        )}
        <div className="run-table">
          <div className="run-row head">
            <span>{t('insights.algorithm')}</span>
            <span>{t('insights.scenario')}</span>
            <span>{t('insights.length')}</span>
            <span>{t('insights.nodes')}</span>
            <span>{t('insights.time')}</span>
            <span>{locale === 'zh' ? '评分' : 'Score'}</span>
          </div>
          {rankedRuns.map((run, index) => (
            <div className={index === 0 ? 'run-row best' : 'run-row'} key={run.id} style={{ '--score': `${Math.min(100, run.score)}%` }}>
              <span>{run.algorithm}</span>
              <span>{run.scenario}</span>
              <span>{run.length}</span>
              <span>{run.nodes}</span>
              <span>{run.time}ms</span>
              <span className="score-cell"><b>{run.score}</b><i /></span>
            </div>
          ))}
        </div>
        {!compareRuns.length && (
          <div className="empty-state">
            {t('insights.noRuns')}
          </div>
        )}
      </section>
    </main>
  );
}

function scoreRun(run, bestLength, fastest, bestSearch) {
  const lengthRatio = bestLength ? Number(bestLength.length) / Math.max(Number(run.length), 1) : 1;
  const timeRatio = fastest ? Number(fastest.time) / Math.max(Number(run.time), 1) : 1;
  const nodeRatio = bestSearch ? Number(bestSearch.nodes) / Math.max(Number(run.nodes), 1) : 1;
  return Math.round((lengthRatio * 48 + timeRatio * 30 + nodeRatio * 22) * 10) / 10;
}

function buildRecommendation(run, bestLength, fastest, bestSearch, locale) {
  const isZh = locale === 'zh';
  const wins = [
    bestLength?.id === run.id ? (isZh ? '路径最短' : 'Shortest path') : null,
    fastest?.id === run.id ? (isZh ? '响应最快' : 'Fastest response') : null,
    bestSearch?.id === run.id ? (isZh ? '搜索节点最少' : 'Fewest nodes') : null,
  ].filter(Boolean);
  
  if (wins.length) {
    return isZh 
      ? `${wins.join('、')}，适合当前场景作为默认策略。` 
      : `${wins.join(', ')}, suitable as default strategy for current scenario.`;
  }
  return isZh 
    ? '综合指标最均衡，适合在当前场景中作为保守策略。' 
    : 'Most balanced overall, suitable as conservative strategy.';
}
