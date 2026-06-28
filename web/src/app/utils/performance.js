import { useMemo, useCallback, useRef } from 'react';

/**
 * Creates a memoized callback that only changes when dependencies change.
 * @param {Function} callback - The callback function
 * @param {Array} deps - Dependencies array
 * @returns {Function} Memoized callback
 */
export function useMemoizedCallback(callback, deps) {
  return useCallback(callback, deps);
}

/**
 * Memoizes a value that only recomputes when dependencies change.
 * @param {Function} factory - Factory function to create the value
 * @param {Array} deps - Dependencies array
 * @returns {*} Memoized value
 */
export function useMemoValue(factory, deps) {
  return useMemo(factory, deps);
}

/**
 * Tracks the previous value of a dependency.
 * @param {*} value - Current value
 * @returns {*} Previous value
 */
export function usePrevious(value) {
  const ref = useRef();
  useMemo(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * Debounces a value update.
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const ref = useRef();
  const timeoutRef = useRef();

  useMemo(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      ref.current = value;
    }, delay);
    return () => clearTimeout(timeoutRef.current);
  }, [value, delay]);

  return ref.current;
}

/**
 * Creates a throttled callback.
 * @param {Function} callback - Callback to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled callback
 */
export function useThrottle(callback, limit = 100) {
  const inThrottle = useRef(false);
  const lastArgs = useRef(null);

  return useCallback((...args) => {
    if (!inThrottle.current) {
      callback(...args);
      inThrottle.current = true;
      setTimeout(() => {
        inThrottle.current = false;
        if (lastArgs.current) {
          callback(...lastArgs.current);
          lastArgs.current = null;
        }
      }, limit);
    } else {
      lastArgs.current = args;
    }
  }, [callback, limit]);
}

/**
 * Tracks render count and time for debugging.
 * @param {string} label - Label for the component
 * @returns {{ count: number, lastRender: number }}
 */
export function useRenderTracker(label = 'Component') {
  const countRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  countRef.current += 1;
  const now = performance.now();
  const delta = now - lastTimeRef.current;
  lastTimeRef.current = now;

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Performance] ${label} render #${countRef.current} (+${delta.toFixed(2)}ms)`);
  }

  return { count: countRef.current, lastRender: delta };
}

/**
 * Optimized array operations for large datasets.
 */
export const arrayOps = {
  sortBy: (arr, key) => [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return aVal - bVal;
    }
    return String(aVal).localeCompare(String(bVal));
  }),

  groupBy: (arr, key) => arr.reduce((groups, item) => {
    const group = item[key];
    (groups[group] = groups[group] || []).push(item);
    return groups;
  }, {}),

  deduplicate: (arr, key) => {
    const seen = new Set();
    return arr.filter(item => {
      const val = key ? item[key] : item;
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  },
};
