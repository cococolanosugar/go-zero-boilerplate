import React, { createContext, useContext, useState, useCallback } from 'react';
import { LOCALES, DEFAULT_LOCALE, type LocaleKey, type LocaleConfig } from '../locales';
import { STORAGE_KEYS } from '../constants';

interface LocaleContextType {
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
  currentConfig: LocaleConfig;
  formatMessage: (descriptor: { id: string; defaultMessage?: string }, values?: Record<string, any>) => string;
}

const STORAGE_KEY = STORAGE_KEYS.LOCALE;

const LocaleContext = createContext<LocaleContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  currentConfig: LOCALES[DEFAULT_LOCALE],
  formatMessage: (d, values) => {
    let text = d.defaultMessage || d.id;
    if (values) {
      Object.keys(values).forEach((k) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(values[k]));
      });
    }
    return text;
  },
});

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<LocaleKey>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LocaleKey;
    if (saved && LOCALES[saved]) {
      return saved;
    }
    return DEFAULT_LOCALE;
  });

  const setLocale = useCallback((newLocale: LocaleKey) => {
    if (LOCALES[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem(STORAGE_KEY, newLocale);
    }
  }, []);

  const currentConfig = LOCALES[locale] || LOCALES[DEFAULT_LOCALE];

  const formatMessage = useCallback(
    ({ id, defaultMessage }: { id: string; defaultMessage?: string }, values?: Record<string, any>): string => {
      const messages = currentConfig.messages;
      let text = (messages && messages[id]) || defaultMessage || id;
      if (values) {
        Object.keys(values).forEach((k) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(values[k]));
        });
      }
      return text;
    },
    [currentConfig]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, currentConfig, formatMessage }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);
export const useIntl = () => {
  const { formatMessage, locale } = useLocale();
  return { formatMessage, locale };
};

export default LocaleContext;
