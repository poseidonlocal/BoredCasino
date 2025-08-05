import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useSound from '../../hooks/useSound';

const ACHIEVEMENTS = {
  firstWin: {
    id: 'firstWin',
    title: 'First Victory',
    description: 'Win your first game',
    icon: '🏆',
    rarity: 'common',
    reward: 100
  },
  bigWin: {
    id: 'bigWin',
    title: 'Big Winner',
    description: 'Win 1000+ MSP in a single game',
    icon: '💰',
    rarity: 'rare',
    reward: 500
  },
  jackpot: {
    id: 'jackpot',
    title: 'Jackpot Master',
    description: 'Hit a jackpot in slots',
    icon: '🎰',
    rarity: 'epic',
    reward: 1000
  },
  streakMaster: {
    id: 'streakMaster',
    title: 'Streak Master',
    description: 'Win 5 games in a row',
    icon: '🔥',
    rarity: 'legendary',
    reward: 2000
  },
  highRoller: {
    id: 'highRoller',
    title: 'High Roller',
    description: 'Bet 500+ MSP in a single game',
    icon: '💎',
    rarity: 'epic',
    reward: 750
  },
  rouletteKing: {
    id: 'rouletteKing',
    title: 'Roulette Royalty',
    description: 'Win 10 roulette games',
    icon: '👑',
    rarity: 'rare',
    reward: 600
  },
  pokerPro: {
    id: 'pokerPro',
    title: 'Poker Professional',
    description: 'Win with a Royal Flush',
    icon: '🃏',
    rarity: 'legendary',
    reward: 1500
  },
  dailyPlayer: {
    id: 'dailyPlayer',
    title: 'Daily Dedication',
    description: 'Play for 7 consecutive days',
    icon: '📅',
    rarity: 'rare',
    reward: 800
  },
  millionaire: {
    id: 'millionaire',
    title: 'Millionaire',
    description: 'Accumulate 1,000,000 MSP',
    icon: '🏦',
    rarity: 'legendary',
    reward: 5000
  },
  socialButterfly: {
    id: 'socialButterfly',
    title: 'Social Butterfly',
    description: 'Play multiplayer games 20 times',
    icon: '🦋',
    rarity: 'common',
    reward: 300
  },
  tournamentWinner: {
    id: 'tournamentWinner',
    title: 'Tournament Champion',
    description: 'Win your first tournament',
    icon: '🏆',
    rarity: 'epic',
    reward: 2000
  },
  tournamentParticipant: {
    id: 'tournamentParticipant',
    title: 'Tournament Player',
    description: 'Join your first tournament',
    icon: '🎯',
    rarity: 'common',
    reward: 500
  },
  podiumFinisher: {
    id: 'podiumFinisher',
    title: 'Podium Finisher',
    description: 'Finish in the top 3 of a tournament',
    icon: '🥉',
    rarity: 'rare',
    reward: 1000
  },
  challengeCompleter: {
    id: 'challengeCompleter',
    title: 'Challenge Master',
    description: 'Complete your first daily challenge',
    icon: '🎯',
    rarity: 'common',
    reward: 300
  },
  caseOpener: {
    id: 'caseOpener',
    title: 'Case Opener',
    description: 'Open your first case',
    icon: '📦',
    rarity: 'common',
    reward: 200
  },
  rghMaster: {
    id: 'rghMaster',
    title: 'RGH Master',
    description: 'Unbox a legendary RGH item',
    icon: '⚡',
    rarity: 'epic',
    reward: 1500
  },
  devkitCollector: {
    id: 'devkitCollector',
    title: 'Devkit Collector',
    description: 'Collect 5 devkit items',
    icon: '🛠️',
    rarity: 'rare',
    reward: 800
  },
  exploitHunter: {
    id: 'exploitHunter',
    title: 'Exploit Hunter',
    description: 'Unbox the legendary 0Fuse exploit',
    icon: '💣',
    rarity: 'legendary',
    reward: 5000
  },
  firstCaseOpen: {
    id: 'firstCaseOpen',
    title: 'Unboxer',
    description: 'Open your first case',
    icon: '📦',
    rarity: 'common',
    reward: 200
  },
  legendaryItem: {
    id: 'legendaryItem',
    title: 'Legendary Collector',
    description: 'Unbox a legendary item',
    icon: '👑',
    rarity: 'legendary',
    reward: 1000
  },
  xboxEnthusiast: {
    id: 'xboxEnthusiast',
    title: 'Xbox 360 Enthusiast',
    description: 'Collect 10 Xbox 360 items',
    icon: '🎮',
    rarity: 'rare',
    reward: 500
  }
};

const AchievementNotification = ({ achievement, onClose }) => {
  const { playJackpotSequence } = useSound();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    playJackpotSequence();
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [playJackpotSequence, onClose]);

  const rarityColors = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-yellow-500 to-orange-500'
  };

  const rarityGlow = {
    common: 'shadow-gray-500/50',
    rare: 'shadow-blue-500/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-yellow-500/50'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-500 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`bg-gradient-to-r ${rarityColors[achievement.rarity]} rounded-2xl p-6 shadow-2xl ${rarityGlow[achievement.rarity]} border border-white/20 backdrop-blur-sm max-w-sm`}>
        <div className="flex items-center space-x-4">
          <div className="text-6xl animate-bounce">
            {achievement.icon}
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-lg mb-1">
              Achievement Unlocked!
            </div>
            <div className="text-white/90 font-semibold text-xl mb-2">
              {achievement.title}
            </div>
            <div className="text-white/80 text-sm mb-3">
              {achievement.description}
            </div>
            <div className="flex items-center justify-between">
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                achievement.rarity === 'legendary' ? 'bg-yellow-400 text-gray-900' :
                achievement.rarity === 'epic' ? 'bg-purple-400 text-white' :
                achievement.rarity === 'rare' ? 'bg-blue-400 text-white' :
                'bg-gray-400 text-white'
              }`}>
                {achievement.rarity}
              </div>
              <div className="text-green-400 font-bold">
                +{achievement.reward} MSP
              </div>
            </div>
          </div>
        </div>
        
        {/* Sparkle effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const AchievementProgress = ({ achievement, progress, total }) => {
  const percentage = Math.min((progress / total) * 100, 100);
  
  return (
    <div className="modern-card p-4">
      <div className="flex items-center space-x-3 mb-3">
        <div className="text-3xl">{achievement.icon}</div>
        <div className="flex-1">
          <div className="text-white font-semibold">{achievement.title}</div>
          <div className="text-gray-400 text-sm">{achievement.description}</div>
        </div>
        <div className="text-green-400 font-bold text-sm">
          +{achievement.reward} MSP
        </div>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div 
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm text-gray-400">
        <span>{progress}/{total}</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
};

export const useAchievements = () => {
  const { user, updateUserCash } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());

  const checkAchievement = async (achievementId, condition = true) => {
    if (!condition || unlockedAchievements.has(achievementId)) return;

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return;

    // Mark as unlocked
    setUnlockedAchievements(prev => new Set([...prev, achievementId]));
    
    // Award MSP
    if (user?.cashBalance !== undefined) {
      await updateUserCash(user.cashBalance + achievement.reward);
    }

    // Show notification
    setNotifications(prev => [...prev, achievement]);

    // Log achievement
    try {
      await fetch('/api/logging/achievement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          achievementId,
          reward: achievement.reward
        })
      });
    } catch (error) {
      console.error('Failed to log achievement:', error);
    }
  };

  const removeNotification = (achievementId) => {
    setNotifications(prev => prev.filter(a => a.id !== achievementId));
  };

  return {
    checkAchievement,
    notifications,
    removeNotification,
    unlockedAchievements: Array.from(unlockedAchievements)
  };
};

export { ACHIEVEMENTS, AchievementNotification, AchievementProgress };
export default useAchievements;