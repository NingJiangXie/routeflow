import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from '../locales/zh.json';
import en from '../locales/en.json';

const resources = {
  zh: { translation: zh },
  en: { translation: en },
};

const savedLocale = localStorage.getItem('routeflow-locale') || 'zh';

i18n.use(initReactI18next).init({
  resources,
  lng: savedLocale,
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Update HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng === 'en' ? 'en' : 'zh';
});

// Set initial lang attribute
document.documentElement.lang = savedLocale === 'en' ? 'en' : 'zh';

export default i18n;

export function changeLanguage(lng) {
  return i18n.changeLanguage(lng);
}

export function t(key, options) {
  return i18n.t(key, options);
}
