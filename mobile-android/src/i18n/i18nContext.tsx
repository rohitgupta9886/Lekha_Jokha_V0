// ==============================================================================
// Lekha Jokha - Mobile i18n Context & Reactive Language Switching
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, Locale, TranslationKey } from './translations';

interface I18nContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load saved preference from localStorage or AsyncStorage
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('lekhajokha_mobile_locale') as Locale;
        if (saved === 'en' || saved === 'hi') {
          setLocaleState(saved);
        }
      }
    } catch {
      // Ignored in non-browser environment
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lekhajokha_mobile_locale', newLocale);
      }
    } catch {
      // Ignored
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
    let text = dict[key] || TRANSLATIONS.en[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
