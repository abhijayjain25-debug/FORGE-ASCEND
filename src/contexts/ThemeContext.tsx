import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'FORGE' | 'ASCEND';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('app-theme') as ThemeType;
    return saved === 'ASCEND' ? 'ASCEND' : 'FORGE';
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app-theme-mode') as ThemeMode;
    return saved === 'light' ? 'light' : 'dark';
  });

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'FORGE' ? 'ASCEND' : 'FORGE');
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('app-theme-mode', newMode);
  };

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes first to prevent stale classes
    root.classList.remove('theme-forge', 'theme-ascend', 'theme-dark', 'theme-light', 'dark');

    if (theme === 'FORGE') {
      root.classList.add('theme-forge');
    } else {
      root.classList.add('theme-ascend');
    }

    if (mode === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.add('theme-dark');
    }
  }, [theme, mode]);


  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
