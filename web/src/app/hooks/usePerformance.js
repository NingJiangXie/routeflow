import { useCallback, useEffect, useRef } from 'react';

const PERF_STORAGE_KEY = 'routeflow_perf_metrics';

/**
 * Records a performance metric.
 * @param {string} name - Metric name
 * @param {number} value - Metric value (in ms)
 * @param {object} metadata - Additional metadata
 */
export function recordMetric(name, value, metadata = {}) {
  const entry = {
    name,
    value: Math.round(value * 100) / 100,
    timestamp: Date.now(),
    metadata,
  };

  try {
    const stored = JSON.parse(localStorage.getItem(PERF_STORAGE_KEY) || '[]');
    stored.push(entry);
    // Keep only last 100 entries
    if (stored.length > 100) {
      stored.shift();
    }
    localStorage.setItem(PERF_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    // Ignore storage errors
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Performance] ${name}: ${value.toFixed(2)}ms`, metadata);
  }
}

/**
 * Gets all recorded metrics.
 * @returns {Array} Array of metric entries
 */
export function getMetrics() {
  try {
    return JSON.parse(localStorage.getItem(PERF_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Clears all recorded metrics.
 */
export function clearMetrics() {
  try {
    localStorage.removeItem(PERF_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Hook to measure component render time.
 * @param {string} componentName - Name of the component
 * @returns {{ markRender: Function, renderCount: number }}
 */
export function useRenderTiming(componentName) {
  const countRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    countRef.current += 1;
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;

    recordMetric(`${componentName}:render`, delta, { count: countRef.current });

    return () => {};
  });

  return {
    renderCount: countRef.current,
    lastRender: performance.now() - lastTimeRef.current,
  };
}

/**
 * Hook to measure async operation time.
 * @param {string} operationName - Name of the operation
 * @returns {{ measure: Function }}
 */
export function usePerformanceMeasure(operationName) {
  const startRef = useRef(null);

  const measure = useCallback(async (fn) => {
    startRef.current = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startRef.current;
      recordMetric(operationName, duration, { status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - startRef.current;
      recordMetric(operationName, duration, { status: 'error', error: error?.message });
      throw error;
    }
  }, [operationName]);

  return { measure };
}

/**
 * Performance overlay component for debugging.
 * Can be toggled with Ctrl+Shift+P in development.
 */
export function PerformanceOverlay() {
  const metrics = getMetrics();
  const slowMetrics = metrics.filter(m => m.value > 500);
  const recentMetrics = metrics.slice(-20);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.85)',
      color: '#0f0',
      padding: 10,
      borderRadius: 4,
      fontSize: 11,
      fontFamily: 'monospace',
      maxWidth: 300,
      maxHeight: 200,
      overflow: 'auto',
      zIndex: 9999,
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
        Performance ({metrics.length} metrics)
      </div>
      {slowMetrics.length > 0 && (
        <div style={{ color: '#ff6', marginBottom: 5 }}>
          Slow operations: {slowMetrics.length}
        </div>
      )}
      <div>
        {recentMetrics.reverse().map((m, i) => (
          <div key={i} style={{
            color: m.value > 500 ? '#f66' : m.value > 100 ? '#ff0' : '#0f0',
          }}>
            {m.name}: {m.value.toFixed(1)}ms
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Tracks Web Vitals metrics.
 */
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    recordMetric('LCP', lastEntry.startTime, { element: lastEntry.element?.tagName });
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      recordMetric('FID', entry.processingStart - entry.startTime, { type: entry.name });
    });
  });
  fidObserver.observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        recordMetric('CLS', entry.value, { cumulative: clsValue });
      }
    });
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });
}
