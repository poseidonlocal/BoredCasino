import React, { useState, useEffect } from 'react';

export default function XboxAchievementNotification({ 
  show, 
  type = 'xp', 
  title, 
  description, 
  xpGained, 
  level, 
  onClose 
}) {
  const [visible, setVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('entering');

  useEffect(() => {
    if (show) {
      setVisible(true);
      setAnimationPhase('entering');
      
      // Animation sequence
      const timer1 = setTimeout(() => setAnimationPhase('visible'), 300);
      const timer2 = setTimeout(() => setAnimationPhase('exiting'), 4000);
      const timer3 = setTimeout(() => {
        setVisible(false);
        setAnimationPhase('entering');
        if (onClose) onClose();
      }, 4500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [show, onClose]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'levelup':
        return '🏆';
      case 'achievement':
        return '🏅';
      case 'xp':
      default:
        return '⭐';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'levelup':
        return title || `Level Up!`;
      case 'achievement':
        return title || 'Achievement Unlocked';
      case 'xp':
      default:
        return title || 'Experience Gained';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'levelup':
        return description || `You reached level ${level}!`;
      case 'achievement':
        return description || 'You unlocked a new achievement!';
      case 'xp':
      default:
        return description || `+${xpGained} XP earned`;
    }
  };

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'entering':
        return 'translate-x-full opacity-0';
      case 'visible':
        return 'translate-x-0 opacity-100';
      case 'exiting':
        return '-translate-x-full opacity-0';
      default:
        return 'translate-x-full opacity-0';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div 
        className={`xbox-achievement-notification transform transition-all duration-500 ease-out ${getAnimationClasses()}`}
      >
        {/* Xbox-style notification container */}
        <div className="relative bg-gradient-to-r from-green-600 via-green-500 to-green-400 rounded-lg shadow-2xl border-2 border-green-300 overflow-hidden min-w-[320px]">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-transparent animate-pulse"></div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 shadow-[0_0_30px_rgba(34,197,94,0.6)] rounded-lg"></div>
          
          {/* Content */}
          <div className="relative flex items-center p-4 space-x-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <span className="text-2xl">{getIcon()}</span>
              </div>
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">
                  {getTitle()}
                </h3>
                {type === 'xp' && xpGained && (
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-bold">
                    +{xpGained} XP
                  </span>
                )}
                {type === 'levelup' && level && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    LV {level}
                  </span>
                )}
              </div>
              <p className="text-white/90 text-sm">
                {getDescription()}
              </p>
            </div>
            
            {/* Xbox-style corner decoration */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 transform rotate-45 translate-x-4 -translate-y-4"></div>
          </div>
          
          {/* Progress bar for XP notifications */}
          {type === 'xp' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div 
                className="h-full bg-white/60 transition-all duration-4000 ease-out"
                style={{ width: animationPhase === 'visible' ? '100%' : '0%' }}
              ></div>
            </div>
          )}
          
          {/* Sound wave animation */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-white/40 rounded-full animate-pulse"
                  style={{
                    height: `${12 + i * 4}px`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s'
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Achievement sound effect indicator */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
          <span className="text-xs">🔊</span>
        </div>
      </div>
    </div>
  );
}