import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface AppSettingsContextType {
  autosaveEnabled: boolean;
  setAutosaveEnabled: (value: boolean) => void;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'appSettings';

// Load initial settings from localStorage synchronously
function loadInitialSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        autosaveEnabled: typeof parsed.autosaveEnabled === 'boolean' ? parsed.autosaveEnabled : true,
        theme: (parsed.theme === 'dark' || parsed.theme === 'light') ? parsed.theme : 'light' as ThemeMode,
      };
    }
  } catch {
    // ignore corrupt settings
  }
  return {
    autosaveEnabled: true,
    theme: 'light' as ThemeMode,
  };
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const initialSettings = loadInitialSettings();
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(initialSettings.autosaveEnabled);
  const [theme, setThemeState] = useState<ThemeMode>(initialSettings.theme);
  const [isInitialized, setIsInitialized] = useState(false);

  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Persist settings (only after initialization to avoid overwriting with defaults)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ autosaveEnabled, theme }));
    }
  }, [autosaveEnabled, theme, isInitialized]);

  // Apply theme class to document (also add Tailwind's .dark for dark mode)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'dark');
    if (theme === 'dark') {
      root.classList.add('theme-dark', 'dark');
    } else {
      root.classList.add('theme-light');
    }
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  return (
    <AppSettingsContext.Provider value={{ autosaveEnabled, setAutosaveEnabled, theme, setTheme }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}

