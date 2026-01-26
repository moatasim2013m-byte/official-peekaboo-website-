import { useState, useEffect } from 'react';
import { translations } from './translations';

const LANG_KEY = 'peekaboo_lang';

// Get initial language (default: Arabic)
const getInitialLang = () => {
  const stored = localStorage.getItem(LANG_KEY);
  return stored || 'ar';
};

// Simple translation hook
export const useTranslation = () => {
  const [lang, setLangState] = useState(getInitialLang());

  useEffect(() => {
    // Set document attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = (newLang) => {
    localStorage.setItem(LANG_KEY, newLang);
    setLangState(newLang);
  };

  const t = (key) => {
    return translations[lang]?.[key] || key;
  };

  return { t, lang, setLang };
};
