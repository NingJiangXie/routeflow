import { useState, useCallback, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('routeflow-theme');
    return saved || 'light';
  });

  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem('routeflow-locale');
    return saved || 'zh';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('routeflow-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
    localStorage.setItem('routeflow-locale', locale);
  }, [locale]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((l) => (l === 'en' ? 'zh' : 'en'));
  }, []);

  const setThemeValue = useCallback((value) => {
    if (value === 'dark' || value === 'light') {
      setTheme(value);
    }
  }, []);

  const setLocaleValue = useCallback((value) => {
    if (value === 'zh' || value === 'en') {
      setLocale(value);
    }
  }, []);

  return {
    theme,
    locale,
    toggleTheme,
    toggleLocale,
    setTheme: setThemeValue,
    setLocale: setLocaleValue,
    isDark: theme === 'dark',
  };
}
