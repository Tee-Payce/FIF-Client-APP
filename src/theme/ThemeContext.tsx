import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from './colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  mode: 'system',
  setMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedMode = await AsyncStorage.getItem('themeMode');
        if (storedMode) {
          setModeState(storedMode as ThemeMode);
        }
      } catch (e) {
        console.error('Failed to load theme mode', e);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem('themeMode', newMode);
    } catch (e) {
      console.error('Failed to save theme mode', e);
    }
  };

  const toggleTheme = () => {
    const currentIsDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
    setMode(currentIsDark ? 'light' : 'dark');
  };

  if (!isReady) return null;

  const currentTheme = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark') 
    ? darkTheme 
    : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
