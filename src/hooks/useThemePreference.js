import { useState, useEffect } from 'react';

// Custom hook to manage theme preference and sync with localStorage
export function useThemePreference() {
  // Check if the user has a saved preference, otherwise use system preference
  const getSavedTheme = () => {
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme) {
      return savedTheme;
    }
    // Check if system preference is dark
    return window.matchMedia && 
      window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  };

  const [mode, setMode] = useState('light'); // Default to light as fallback

  // Initialize theme once on mount
  useEffect(() => {
    setMode(getSavedTheme());
  }, []);

  // Save preference when it changes
  useEffect(() => {
    localStorage.setItem('theme-preference', mode);
    // Update document attributes for better accessibility
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Only change if user hasn't manually set a preference
      if (!localStorage.getItem('theme-preference')) {
        setMode(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return { mode, toggleTheme };
}

export default useThemePreference; 