import React from 'react';
import { getXPProgress } from '../../lib/xpSystem';

export default function LevelProgressBar({ 
  totalXP, 
  showDetails = true, 
  size = 'md',
  className = '' 
}) {
  const progress = getXPProgress(totalXP || 0);
  
  const sizeClasses = {
    sm: 'h-2 text-xs',
    md: 'h-3 text-sm',
    lg: 'h-4 text-base'
  };

  return (
    <div className={`level-progress-container ${className}`}>
      {showDetails && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-white font-bold">Level {progress.currentLevel}</span>
            {!progress.isMaxLevel && (
              <span className="text-gray-400 text-sm">
                ({progress.progressXP}/{progress.requiredXP} XP)
              </span>
            )}
          </div>
          {!progress.isMaxLevel && (
            <span className="text-gray-400 text-sm">
              {Math.round(progress.progressPercentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`relative bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        {/* Progress bar background */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700"></div>
        
        {/* Progress fill */}
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 rounded-full transition-all duration-1000 ease-out"
          style={{ 
            width: progress.isMaxLevel ? '100%' : `${progress.progressPercentage}%`,
            boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)'
          }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
        
        {/* Level indicator */}
        {showDetails && size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-xs drop-shadow-lg">
              {progress.isMaxLevel ? 'MAX' : `${Math.round(progress.progressPercentage)}%`}
            </span>
          </div>
        )}
      </div>
      
      {showDetails && !progress.isMaxLevel && (
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{progress.currentLevelXP.toLocaleString()} XP</span>
          <span>{progress.nextLevelXP.toLocaleString()} XP</span>
        </div>
      )}
      
      {progress.isMaxLevel && showDetails && (
        <div className="text-center mt-2">
          <span className="text-yellow-400 font-bold text-sm">🏆 Max Level Reached!</span>
        </div>
      )}
    </div>
  );
}