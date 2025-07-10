import { useEffect, useState } from 'react';
import { useDevicePreferences } from './useDevicePreferences';

export const useEnhancedTheme = () => {
  const { preferences, setPreference } = useDevicePreferences();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial system theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Calculate effective theme based on user preference
  useEffect(() => {
    let theme: 'light' | 'dark';
    
    if (preferences.theme === 'system') {
      theme = systemTheme;
    } else {
      theme = preferences.theme;
    }
    
    setEffectiveTheme(theme);
    
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Apply accessibility preferences
    if (preferences.reducedMotion) {
      document.documentElement.style.setProperty('--transition-smooth', 'none');
      document.documentElement.style.setProperty('--transition-fast', 'none');
    } else {
      document.documentElement.style.removeProperty('--transition-smooth');
      document.documentElement.style.removeProperty('--transition-fast');
    }
    
    // Apply font size
    const fontSizeMap = {
      'small': '0.875rem',
      'medium': '1rem',
      'large': '1.125rem',
      'extra-large': '1.25rem',
    };
    
    document.documentElement.style.setProperty(
      '--base-font-size',
      fontSizeMap[preferences.fontSize]
    );
    
    // Apply high contrast mode
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Apply accent color
    if (preferences.accentColor) {
      document.documentElement.style.setProperty('--accent', preferences.accentColor);
    }
    
  }, [preferences.theme, preferences.reducedMotion, preferences.fontSize, preferences.highContrast, preferences.accentColor, systemTheme]);

  const toggleTheme = () => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setPreference('theme', newTheme);
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setPreference('theme', theme);
  };

  const toggleHighContrast = () => {
    setPreference('highContrast', !preferences.highContrast);
  };

  const setFontSize = (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    setPreference('fontSize', size);
  };

  const setAccentColor = (color: string) => {
    setPreference('accentColor', color);
  };

  const toggleReducedMotion = () => {
    setPreference('reducedMotion', !preferences.reducedMotion);
  };

  return {
    theme: preferences.theme,
    effectiveTheme,
    systemTheme,
    fontSize: preferences.fontSize,
    highContrast: preferences.highContrast,
    reducedMotion: preferences.reducedMotion,
    accentColor: preferences.accentColor,
    toggleTheme,
    setTheme,
    toggleHighContrast,
    setFontSize,
    setAccentColor,
    toggleReducedMotion,
  };
};