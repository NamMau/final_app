import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

interface Theme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

const lightTheme: Theme = {
  primary: '#2196F3',
  secondary: '#FFC107',
  background: '#FFFFFF',
  text: '#000000',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
};

const darkTheme: Theme = {
  primary: '#64B5F6',
  secondary: '#FFD54F',
  background: '#121212',
  text: '#FFFFFF',
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  info: '#42A5F5',
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 