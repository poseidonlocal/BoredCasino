import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  howlgg: {
    name: 'Howl.gg',
    primary: '#7c3aed',
    secondary: '#a855f7',
    accent: '#c084fc',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 100%)',
    cardBg: 'linear-gradient(135deg, rgba(15, 15, 35, 0.95) 0%, rgba(26, 26, 46, 0.9) 50%, rgba(22, 33, 62, 0.95) 100%)',
    textPrimary: '#ffffff',
    textSecondary: '#d1d5db',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    particles: '#7c3aed'
  },
  neon: {
    name: 'Neon Nights',
    primary: '#00ffff',
    secondary: '#ff00ff',
    accent: '#ffff00',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 25%, #0a1a1a 50%, #0a0a0a 100%)',
    cardBg: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 10, 26, 0.9) 50%, rgba(10, 26, 26, 0.95) 100%)',
    textPrimary: '#ffffff',
    textSecondary: '#cccccc',
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff0066',
    particles: '#00ffff'
  },
  royal: {
    name: 'Royal Gold',
    primary: '#fbbf24',
    secondary: '#f59e0b',
    accent: '#d97706',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 25%, #1a1a2e 50%, #0f0f23 100%)',
    cardBg: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(45, 27, 105, 0.9) 50%, rgba(26, 26, 46, 0.95) 100%)',
    textPrimary: '#ffffff',
    textSecondary: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    particles: '#fbbf24'
  },
  matrix: {
    name: 'Matrix',
    primary: '#00ff41',
    secondary: '#00cc33',
    accent: '#00aa22',
    background: 'linear-gradient(135deg, #000000 0%, #001100 25%, #000000 50%, #000000 100%)',
    cardBg: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 17, 0, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)',
    textPrimary: '#00ff41',
    textSecondary: '#00cc33',
    success: '#00ff41',
    warning: '#ffff00',
    error: '#ff0000',
    particles: '#00ff41'
  },
  sunset: {
    name: 'Sunset Vibes',
    primary: '#ff6b6b',
    secondary: '#ffa726',
    accent: '#ffcc02',
    background: 'linear-gradient(135deg, #2c1810 0%, #4a2c2a 25%, #2c1810 50%, #1a0f0a 100%)',
    cardBg: 'linear-gradient(135deg, rgba(44, 24, 16, 0.95) 0%, rgba(74, 44, 42, 0.9) 50%, rgba(44, 24, 16, 0.95) 100%)',
    textPrimary: '#ffffff',
    textSecondary: '#f3f4f6',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#ef4444',
    particles: '#ff6b6b'
  },
  ocean: {
    name: 'Deep Ocean',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    accent: '#0369a1',
    background: 'linear-gradient(135deg, #0c1445 0%, #1e3a8a 25%, #0c1445 50%, #030712 100%)',
    cardBg: 'linear-gradient(135deg, rgba(12, 20, 69, 0.95) 0%, rgba(30, 58, 138, 0.9) 50%, rgba(12, 20, 69, 0.95) 100%)',
    textPrimary: '#ffffff',
    textSecondary: '#e0f2fe',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    particles: '#0ea5e9'
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('howlgg');
  const [customSettings, setCustomSettings] = useState({
    particlesEnabled: true,
    animationsEnabled: true,
    soundEnabled: true,
    reducedMotion: false
  });

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('casino-theme');
    const savedSettings = localStorage.getItem('casino-settings');
    
    if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    
    if (savedSettings) {
      try {
        setCustomSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Apply theme to CSS variables
    const theme = THEMES[currentTheme];
    const root = document.documentElement;
    
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-text-primary', theme.textPrimary);
    root.style.setProperty('--theme-text-secondary', theme.textSecondary);
    root.style.setProperty('--theme-success', theme.success);
    root.style.setProperty('--theme-warning', theme.warning);
    root.style.setProperty('--theme-error', theme.error);
    root.style.setProperty('--theme-particles', theme.particles);
    
    // Apply background
    document.body.style.background = theme.background;
    document.body.style.backgroundAttachment = 'fixed';
    
    // Save to localStorage
    localStorage.setItem('casino-theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('casino-settings', JSON.stringify(customSettings));
    
    // Apply reduced motion preference
    if (customSettings.reducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
    }
  }, [customSettings]);

  const changeTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const updateSettings = (newSettings) => {
    setCustomSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setCurrentTheme('howlgg');
    setCustomSettings({
      particlesEnabled: true,
      animationsEnabled: true,
      soundEnabled: true,
      reducedMotion: false
    });
  };

  const value = {
    currentTheme,
    theme: THEMES[currentTheme],
    themes: THEMES,
    customSettings,
    changeTheme,
    updateSettings,
    resetToDefaults
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme;