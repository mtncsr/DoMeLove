import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import he from './locales/he.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import ru from './locales/ru.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  he: { translation: he },
  es: { translation: es },
  zh: { translation: zh },
  ar: { translation: ar },
  ru: { translation: ru },
  pt: { translation: pt },
  fr: { translation: fr },
};

// RTL languages
const rtlLanguages = ['he', 'ar'];

export const getTextDirection = (lang: string): 'ltr' | 'rtl' => {
  return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;




