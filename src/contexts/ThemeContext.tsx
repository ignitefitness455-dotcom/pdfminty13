import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('theme-preference') || localStorage.getItem('theme');
        if (saved) {
          return saved === 'dark';
        }
      } catch {
        // ignore
      }
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
      try {
        localStorage.setItem('theme-preference', 'dark');
        localStorage.setItem('theme', 'dark');
      } catch {
        // ignore localStorage write errors in sandboxed/private environments
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      try {
        localStorage.setItem('theme-preference', 'light');
        localStorage.setItem('theme', 'light');
      } catch {
        // ignore localStorage write errors in sandboxed/private environments
      }
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setIsDark(theme === 'dark');
  }, []);

  const value = useMemo(
    () => ({ isDark, toggleTheme, setTheme }),
    [isDark, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
