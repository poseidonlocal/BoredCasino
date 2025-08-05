import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import XboxAchievementNotification from './XboxAchievementNotification';
import { awardXP, checkForNewAchievements } from '../../lib/xpSystem';

export default function XPTracker() {
  const { user, updateUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);

  // Process notification queue
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      const nextNotification = notifications[0];
      setCurrentNotification(nextNotification);
      setNotifications(prev => prev.slice(1));
    }
  }, [notifications, currentNotification]);

  const addNotification = (notification) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
  };

  const handleNotificationClose = () => {
    setCurrentNotification(null);
  };

  // Function to award XP and show notifications
  const awardExperience = async (source, multiplier = 1, customData = {}) => {
    if (!user) return;

    const currentXP = user.totalXP || 0;
    const currentStats = {
      level: user.level || 1,
      gamesPlayed: user.gamesPlayed || 0,
      totalWinnings: user.totalWinnings || 0,
      winRate: user.winRate || 0
    };

    const xpResult = awardXP(currentXP, source, multiplier);
    
    // Update user data with new XP and level
    const updatedUserData = {
      totalXP: xpResult.newTotalXP,
      level: xpResult.newLevel,
      gamesPlayed: customData.gamesPlayed || currentStats.gamesPlayed,
      totalWinnings: customData.totalWinnings || currentStats.totalWinnings,
      winRate: customData.winRate || currentStats.winRate
    };

    // Update user in context/database
    if (updateUser) {
      await updateUser(updatedUserData);
    }

    // Show XP notification
    addNotification({
      type: 'xp',
      title: 'Experience Gained',
      description: getXPDescription(source),
      xpGained: xpResult.xpGained,
      level: xpResult.newLevel
    });

    // Show level up notification if leveled up
    if (xpResult.leveledUp) {
      setTimeout(() => {
        addNotification({
          type: 'levelup',
          title: 'Level Up!',
          description: `You reached level ${xpResult.newLevel}!`,
          level: xpResult.newLevel
        });
      }, 1000);
    }

    // Check for new achievements
    const newStats = {
      ...currentStats,
      level: xpResult.newLevel,
      ...customData
    };

    const newAchievements = checkForNewAchievements(currentStats, newStats);
    
    // Show achievement notifications
    newAchievements.forEach((achievement, index) => {
      setTimeout(() => {
        addNotification({
          type: 'achievement',
          title: 'Achievement Unlocked',
          description: `${achievement.name}: ${achievement.description}`,
          icon: achievement.icon
        });
      }, 2000 + (index * 1000));
    });

    return xpResult;
  };

  const getXPDescription = (source) => {
    const descriptions = {
      GAME_PLAYED: 'Played a game',
      GAME_WON: 'Won a game',
      BIG_WIN: 'Big win bonus',
      DAILY_BONUS: 'Daily bonus claimed',
      FIRST_GAME: 'First game bonus',
      STREAK_BONUS: 'Win streak bonus',
      HIGH_ROLLER: 'High roller bonus',
      ACHIEVEMENT_UNLOCKED: 'Achievement unlocked'
    };
    return descriptions[source] || 'Experience gained';
  };

  // Expose the awardExperience function globally
  useEffect(() => {
    window.awardXP = awardExperience;
    return () => {
      delete window.awardXP;
    };
  }, [user]);

  return (
    <>
      <XboxAchievementNotification
        show={!!currentNotification}
        type={currentNotification?.type}
        title={currentNotification?.title}
        description={currentNotification?.description}
        xpGained={currentNotification?.xpGained}
        level={currentNotification?.level}
        onClose={handleNotificationClose}
      />
    </>
  );
}

// Hook for easy XP awarding in components
export function useXP() {
  const awardXP = (source, multiplier = 1, customData = {}) => {
    if (window.awardXP) {
      return window.awardXP(source, multiplier, customData);
    }
  };

  return { awardXP };
}