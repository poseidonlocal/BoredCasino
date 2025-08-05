import React, { useState } from 'react';
import { useTheme, THEMES } from '../../hooks/useTheme';
import useSound from '../../hooks/useSound';

const ThemePreview = ({ theme, isActive, onClick }) => {
  return (
    <div 
      className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
        isActive ? 'ring-4 ring-white/50 scale-105' : 'hover:scale-102'
      }`}
      onClick={onClick}
    >
      <div 
        className="w-full h-24 p-4 flex items-center justify-between"
        style={{ background: theme.cardBg }}
      >
        <div className="flex space-x-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.primary }}
          />
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.secondary }}
          />
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
        </div>
        <div 
          className="text-xs font-medium"
          style={{ color: theme.textPrimary }}
        >
          {theme.name}
        </div>
      </div>
      
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="text-white text-2xl">✓</div>
        </div>
      )}
    </div>
  );
};

const SettingToggle = ({ label, description, enabled, onChange, icon }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="text-white font-medium">{label}</div>
          <div className="text-gray-400 text-sm">{description}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-purple-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

const ThemeCustomizer = ({ isOpen, onClose }) => {
  const { currentTheme, themes, customSettings, changeTheme, updateSettings, resetToDefaults } = useTheme();
  const { playSound } = useSound();
  const [activeTab, setActiveTab] = useState('themes');

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
    playSound('click');
  };

  const handleSettingChange = (setting, value) => {
    updateSettings({ [setting]: value });
    playSound('click');
  };

  const handleReset = () => {
    resetToDefaults();
    playSound('notification');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎨</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Theme Customizer</h2>
              <p className="text-sm text-gray-400">Personalize your gaming experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'themes', label: 'Themes', icon: '🎨' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
            { id: 'accessibility', label: 'Accessibility', icon: '♿' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Choose Your Theme</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(themes).map(([key, theme]) => (
                    <ThemePreview
                      key={key}
                      theme={theme}
                      isActive={currentTheme === key}
                      onClick={() => handleThemeChange(key)}
                    />
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Current Theme: {themes[currentTheme].name}</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: themes[currentTheme].primary }}
                      title="Primary Color"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: themes[currentTheme].secondary }}
                      title="Secondary Color"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: themes[currentTheme].accent }}
                      title="Accent Color"
                    />
                  </div>
                  <div className="text-gray-400 text-sm">Color Palette</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Visual Settings</h3>
              
              <SettingToggle
                label="Particle Effects"
                description="Enable floating particle animations"
                icon="✨"
                enabled={customSettings.particlesEnabled}
                onChange={(value) => handleSettingChange('particlesEnabled', value)}
              />
              
              <SettingToggle
                label="Animations"
                description="Enable smooth transitions and animations"
                icon="🎭"
                enabled={customSettings.animationsEnabled}
                onChange={(value) => handleSettingChange('animationsEnabled', value)}
              />
              
              <SettingToggle
                label="Sound Effects"
                description="Play audio feedback for interactions"
                icon="🔊"
                enabled={customSettings.soundEnabled}
                onChange={(value) => handleSettingChange('soundEnabled', value)}
              />
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Accessibility Options</h3>
              
              <SettingToggle
                label="Reduced Motion"
                description="Minimize animations for motion sensitivity"
                icon="🐌"
                enabled={customSettings.reducedMotion}
                onChange={(value) => handleSettingChange('reducedMotion', value)}
              />
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 text-lg">ℹ️</span>
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Accessibility Features</p>
                    <p>We're committed to making our platform accessible to everyone. More accessibility options will be added in future updates.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;