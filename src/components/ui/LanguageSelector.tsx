import React from 'react';
import { useTranslation } from 'react-i18next';
import { getTextDirection } from '../../i18n/config';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'he', name: 'עברית' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
  label?: string;
}

export function LanguageSelector({ value, onChange, label }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const handleChange = (lang: string) => {
    onChange(lang);
    i18n.changeLanguage(lang);
    const direction = getTextDirection(lang);
    document.documentElement.dir = direction;
    document.documentElement.lang = lang;
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}




