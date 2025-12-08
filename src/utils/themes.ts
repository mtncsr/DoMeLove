import type { ThemeConfig } from '../types/project';

export const PREDEFINED_THEMES: ThemeConfig[] = [
  {
    name: 'Romantic',
    type: 'predefined',
    colors: {
      text: '#333333',
      textSecondary: '#666666',
      background: '#ffffff',
      backgroundSecondary: '#fef2f2',
      accent: '#ec4899',
      border: '#fce7f3',
      button: '#ec4899',
      buttonText: '#ffffff',
      overlay: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    },
    fonts: {
      heading: "'Playfair Display', serif",
      body: "'Inter', sans-serif",
    },
  },
  {
    name: 'Birthday',
    type: 'predefined',
    colors: {
      text: '#1f2937',
      textSecondary: '#6b7280',
      background: '#ffffff',
      backgroundSecondary: '#fef3c7',
      accent: '#f59e0b',
      border: '#fde68a',
      button: '#f59e0b',
      buttonText: '#ffffff',
      overlay: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    },
    fonts: {
      heading: "'Comic Sans MS', cursive",
      body: "'Inter', sans-serif",
    },
  },
  {
    name: 'Minimal',
    type: 'predefined',
    colors: {
      text: '#111827',
      textSecondary: '#6b7280',
      background: '#ffffff',
      backgroundSecondary: '#f9fafb',
      accent: '#3b82f6',
      border: '#e5e7eb',
      button: '#3b82f6',
      buttonText: '#ffffff',
      overlay: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
  },
  {
    name: 'Dark',
    type: 'predefined',
    colors: {
      text: '#f9fafb',
      textSecondary: '#d1d5db',
      background: '#111827',
      backgroundSecondary: '#1f2937',
      accent: '#8b5cf6',
      border: '#374151',
      button: '#8b5cf6',
      buttonText: '#ffffff',
      overlay: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
  },
  {
    name: 'Bright',
    type: 'predefined',
    colors: {
      text: '#111827',
      textSecondary: '#4b5563',
      background: '#ffffff',
      backgroundSecondary: '#fef3c7',
      accent: '#10b981',
      border: '#d1fae5',
      button: '#10b981',
      buttonText: '#ffffff',
      overlay: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
  },
];

export function getDefaultTheme(): ThemeConfig {
  return PREDEFINED_THEMES[0]; // Romantic as default
}

export function getThemeByName(name: string): ThemeConfig | undefined {
  return PREDEFINED_THEMES.find(theme => theme.name === name);
}

