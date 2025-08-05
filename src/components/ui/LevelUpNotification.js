import React, { useState, useEffect } from 'react';

export default function LevelUpNotification({ 
  show, 
  oldLevel, 
  newLevel, 
  rewards, 
  onClose 
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Auto close after 8 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
      
      {/* Notification */}
      <div className={`relative bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600 rounded-2xl p-8 max-w-md mx-4 text-center transform transition-all duration-500 ${visible ? 'scale-100 rotate-0' : 'scale-75 rotate-12'}`}>
        {/* Celebration Effects */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-white/20 rounded-full animate-ping"></div>
          <div className="absolute -top-2 -right-6 w-6 h-6 bg-white/30 rounded-full animate-ping animation-delay-200"></div>
          <div className="absolute -bottom-3 -left-2 w-4 h-4 bg-white/25 rounded-full animate-ping animation-delay-400"></div>
          <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-white/15 rounded-full animate-ping animation-delay-600"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Level Up Icon */}
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          
          {/* Level Up Text */}
          <h2 className="text-3xl font-bold text-white mb-2">LEVEL UP!</h2>
          
          {/* Level Progress */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="bg-white/20 rounded-full px-4 py-2">
              <span className="text-2xl font-bold text-white">{oldLevel}</span>
            </div>
            <div className="text-white text-2xl">→</div>
            <div className="bg-white/30 rounded-full px-4 py-2 ring-4 ring-white/20">
              <span className="text-2xl font-bold text-white">{newLevel}</span>
            </div>
          </div>
          
          {/* New Title */}
          <div className="bg-white/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-white/80 mb-1">New Rank</p>
            <p className="text-lg font-bold text-white">{rewards?.title}</p>
          </div>
          
          {/* Rewards */}
          {rewards?.benefits && rewards.benefits.length > 0 && (
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-white mb-2">New Benefits:</p>
              <ul className="text-xs text-white/90 space-y-1">
                {rewards.benefits.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-300 mr-2">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Unlocks */}
          {rewards?.unlocks && rewards.unlocks.length > 0 && (
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-white mb-2">Unlocked:</p>
              <ul className="text-xs text-white/90 space-y-1">
                {rewards.unlocks.slice(0, 2).map((unlock, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-blue-300 mr-2">🔓</span>
                    {unlock}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Continue Playing
          </button>
        </div>
      </div>
    </div>
  );
}