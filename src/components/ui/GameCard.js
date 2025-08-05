import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

const GameCard = ({ game }) => {
  const { isAuthenticated } = useAuth();

  return (
    <Link href={isAuthenticated ? game.href : '/auth'}>
      <div className={`game-card group ${game.glowColor || 'shadow-primary-500/20'} hover:shadow-2xl slide-in-left`}>
        <div className="text-center relative">
          {/* Game icon with enhanced styling */}
          <div className="relative mb-8">
            <div className={`w-24 h-24 mx-auto bg-gradient-to-r ${game.gradient} rounded-3xl flex items-center justify-center text-5xl group-hover:scale-110 transition-all duration-500 shadow-2xl`}>
              {game.icon}
            </div>
            {/* Glow effect */}
            <div className={`absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-r ${game.gradient} rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500`}></div>
          </div>
          
          <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors duration-300">
            {game.name}
          </h3>
          <p className="text-gray-300 mb-8 leading-relaxed text-lg">
            {game.description}
          </p>
          
          {/* Enhanced play button */}
          <div className="relative">
            <div className="btn-gaming inline-block group-hover:scale-105 transition-all duration-300">
              {isAuthenticated ? '🎮 Play Now' : '🔐 Login to Play'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;