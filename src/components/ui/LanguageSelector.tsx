import { useTranslation } from 'react-i18next';

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
  subtle?: boolean;
}

export function LanguageSelector({ value, onChange, label, subtle = false }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const handleChange = (lang: string) => {
    onChange(lang);
    i18n.changeLanguage(lang);
  };

  if (subtle) {
    return (
      <div className="w-auto">
        {label && (
          <label className="block text-xs font-normal text-gray-500 mb-1">
            {label}
          </label>
        )}
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="text-sm text-gray-600 bg-transparent border-0 border-b border-gray-200 rounded-none px-1 py-1 focus:outline-none focus:border-gray-400 hover:border-gray-300 transition-colors cursor-pointer"
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
