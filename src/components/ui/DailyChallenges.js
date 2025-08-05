import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useAchievements } from './AchievementSystem';
import { useXP } from './XPTracker';
import useSound from '../../hooks/useSound';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { logChallengeState, logUserState, logXPAward } from '../../lib/debug';

const CHALLENGE_TYPES = {
  WIN_GAMES: 'win_games',
  PLAY_GAMES: 'play_games',
  WIN_AMOUNT: 'win_amount',
  BET_AMOUNT: 'bet_amount'
};

const DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

const generateDailyChallenges = () => {
  const challenges = [
    {
      id: 'daily_1',
      title: 'First Steps',
      description: 'Play 3 games of any type',
      type: CHALLENGE_TYPES.PLAY_GAMES,
      target: 3,
      current: 0,
      reward: 200,
      xpReward: 50,
      difficulty: DIFFICULTIES.EASY,
      icon: '🎮',
      gameType: 'any'
    },
    {
      id: 'daily_2',
      title: 'High Roller',
      description: 'Bet a total of 1000 MSP',
      type: CHALLENGE_TYPES.BET_AMOUNT,
      target: 1000,
      current: 0,
      reward: 300,
      xpReward: 75,
      difficulty: DIFFICULTIES.MEDIUM,
      icon: '💎',
      gameType: 'any'
    },
    {
      id: 'daily_3',
      title: 'Winner',
      description: 'Win 500 MSP total',
      type: CHALLENGE_TYPES.WIN_AMOUNT,
      target: 500,
      current: 0,
      reward: 400,
      xpReward: 100,
      difficulty: DIFFICULTIES.MEDIUM,
      icon: '🏆',
      gameType: 'any'
    }
  ];
  
  return challenges.map(challenge => ({
    ...challenge,
    current: Math.floor(Math.random() * (challenge.target * 0.7)),
    completed: false,
    claimed: false
  }));
};

export default function DailyChallenges() {
  const { user, updateUserCash } = useAuth();
  const { customSettings } = useTheme();
  const { checkAchievement } = useAchievements();
  const { awardXP } = useXP();
  const { playSound, playWinSequence } = useSound();
  
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalRewardsEarned, setTotalRewardsEarned] = useState(0);
  
  useEffect(() => {
    const initializeChallenges = () => {
      const dailyChallenges = generateDailyChallenges();
      setChallenges(dailyChallenges);
      setIsLoading(false);
      
      const completed = dailyChallenges.filter(c => c.completed).length;
      setCompletedToday(completed);
    };
    
    initializeChallenges();
  }, []);
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case DIFFICULTIES.EASY: return 'text-green-400';
      case DIFFICULTIES.MEDIUM: return 'text-yellow-400';
      case DIFFICULTIES.HARD: return 'text-orange-400';
      default: return 'text-white';
    }
  };
  
  const getDifficultyBg = (difficulty) => {
    switch (difficulty) {
      case DIFFICULTIES.EASY: return 'bg-green-500/20 border-green-400/30';
      case DIFFICULTIES.MEDIUM: return 'bg-yellow-500/20 border-yellow-400/30';
      case DIFFICULTIES.HARD: return 'bg-orange-500/20 border-orange-400/30';
      default: return 'bg-gray-800/30 border-gray-700/30';
    }
  };
  
  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };
  
  const claimReward = async (challengeId) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.completed || challenge.claimed) return;
    
    setIsLoading(true);
    
    try {
      // Update user cash
      const newBalance = user.cashBalance + challenge.reward;
      await updateUserCash(newBalance);
      
      // Award XP for completing challenge
      if (awardXP) {
        await awardXP('ACHIEVEMENT_UNLOCKED', 1, {
          gamesPlayed: user.gamesPlayed || 0,
          totalWinnings: (user.totalWinnings || 0) + challenge.reward,
          winRate: user.winRate || 0
        });
      }
      
      // Mark challenge as claimed
      setChallenges(prev => prev.map(c => 
        c.id === challengeId ? { ...c, claimed: true } : c
      ));
      
      setTotalRewardsEarned(prev => prev + challenge.reward);
      playWinSequence();
      checkAchievement('challengeCompleter', true);
      
      alert(`Challenge completed! You earned ${challenge.reward} MSP and ${challenge.xpReward} XP!`);
      
    } catch (error) {
      console.error('Failed to claim reward:', error);
      playSound('error');
      alert('Failed to claim reward. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const simulateProgress = (challengeId) => {
    setChallenges(prev => prev.map(challenge => {
      if (challenge.id === challengeId && !challenge.completed) {
        const newCurrent = Math.min(challenge.current + 1, challenge.target);
        const completed = newCurrent >= challenge.target;
        
        if (completed && !challenge.completed) {
          playSound('achievement');
          setCompletedToday(prev => prev + 1);
        }
        
        return {
          ...challenge,
          current: newCurrent,
          completed
        };
      }
      return challenge;
    }));
  };
  
  const ChallengeCard = ({ challenge }) => {
    const progressPercentage = getProgressPercentage(challenge.current, challenge.target);
    const isCompleted = challenge.completed;
    const isClaimed = challenge.claimed;
    
    return (
      <div className={`modern-card transition-all duration-300 hover:scale-105 ${
        isCompleted ? getDifficultyBg(challenge.difficulty) : 'hover:shadow-lg'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{challenge.icon}</div>
            <div>
              <h3 className="text-lg font-bold text-white">{challenge.title}</h3>
              <p className="text-gray-400 text-sm">{challenge.description}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${getDifficultyColor(challenge.difficulty)}`}>
            {challenge.difficulty.toUpperCase()}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Progress</span>
            <span className="text-white font-bold text-sm">
              {challenge.current}/{challenge.target}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                isCompleted 
                  ? 'bg-gradient-to-r from-green-400 to-green-500' 
                  : 'bg-gradient-to-r from-blue-400 to-purple-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4">
            <div className="text-center">
              <div className="text-yellow-400 font-bold">{challenge.reward}</div>
              <div className="text-gray-400 text-xs">MSP</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-bold">{challenge.xpReward}</div>
              <div className="text-gray-400 text-xs">XP</div>
            </div>
          </div>
          
          {isCompleted && !isClaimed ? (
            <Button
              onClick={() => claimReward(challenge.id)}
              disabled={isLoading}
              className="btn-success px-4 py-2 text-sm"
            >
              Claim Reward
            </Button>
          ) : isClaimed ? (
            <div className="text-green-400 font-bold text-sm flex items-center">
              <span className="mr-2">✅</span>
              Claimed
            </div>
          ) : (
            <Button
              onClick={() => simulateProgress(challenge.id)}
              className="btn-gaming px-4 py-2 text-sm"
            >
              Simulate +1
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  if (isLoading && challenges.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="gaming-header mb-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              🎯 Daily Challenges
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Complete challenges to earn rewards and XP!
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="modern-card text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-2xl font-bold text-green-400 mb-2">
            {completedToday}/{challenges.length}
          </div>
          <div className="text-gray-400">Completed Today</div>
        </div>
        
        <div className="modern-card text-center">
          <div className="text-4xl mb-3">💰</div>
          <div className="text-2xl font-bold text-yellow-400 mb-2">
            {totalRewardsEarned}
          </div>
          <div className="text-gray-400">MSP Earned</div>
        </div>
        
        <div className="modern-card text-center">
          <div className="text-4xl mb-3">⏰</div>
          <div className="text-2xl font-bold text-blue-400 mb-2">
            {Math.max(0, 24 - new Date().getHours())}h
          </div>
          <div className="text-gray-400">Until Reset</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}