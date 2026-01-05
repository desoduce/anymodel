import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import ApiService from '../src/services/ApiService';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  userTheme: ThemeType;
  setUserTheme: (theme: ThemeType) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [userTheme, setUserThemeState] = useState<ThemeType>('system');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const settings = await ApiService.getSettings();
      setUserThemeState(settings.theme);
    } catch (error) {
      if (__DEV__) console.warn('Failed to load theme setting, using system default');
      setUserThemeState('system');
    }
  };

  const setUserTheme = async (newTheme: ThemeType) => {
    setUserThemeState(newTheme);
    
    try {
      const currentSettings = await ApiService.getSettings();
      await ApiService.saveSettings({
        ...currentSettings,
        theme: newTheme,
      });
    } catch (error) {
      if (__DEV__) console.error('Failed to save theme setting:', error);
    }
  };

  const effectiveTheme = userTheme === 'system' ? (systemTheme ?? 'light') : userTheme;

  const value: ThemeContextType = {
    theme: effectiveTheme,
    userTheme,
    setUserTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
