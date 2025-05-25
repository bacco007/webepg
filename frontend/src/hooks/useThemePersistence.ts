'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function useThemePersistence() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Get the stored theme from localStorage
    const storedTheme = localStorage.getItem('theme');

    // If there's a stored theme and it's different from the current theme
    if (storedTheme && storedTheme !== theme) {
      setTheme(storedTheme);
    }
  }, []);

  // Update localStorage when theme changes
  useEffect(() => {
    if (theme) {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);
}
