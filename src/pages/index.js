import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import CashDisplay from '../components/CashDisplay';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  const games = [
    {
      name: 'Roulette',
      description: 'Spin the wheel and bet on your lucky numbers. Classic gaming excitement with multiple betting options.',
      icon: '🎰',
      href: '/roulette',
      gradient: 'from-red-500 to-pink-600',
      glowColor: 'shadow-red-500/20'
    },
    {
      name: 'Slots',
      description: 'Pull the lever and match the symbols. Easy to play with exciting jackpot opportunities.',
      icon: '🎲',
      href: '/slots',
      gradient: 'from-blue-500 to-cyan-600',
      glowColor: 'shadow-blue-500/20'
    },
    {
      name: 'Case Opening',
      description: 'Unbox rare Xbox 360 modding items, devkit hardware, and legendary exploits!',
      icon: '📦',
      href: '/cases',
      gradient: 'from-purple-500 to-indigo-600',
      glowColor: 'shadow-purple-500/20'
    },
    {
      name: 'Texas Hold\'em',
      description: 'Test your poker skills in the ultimate card game. Bluff, bet, and win big.',
      icon: '🃏',
      href: '/poker',
      gradient: 'from-green-500 to-emerald-600',
      glowColor: 'shadow-green-500/20'
    }
  ];

  const features = [
    {
      icon: '💰',
      title: 'Virtual Currency',
      description: 'Start with $1,000 and manage your bankroll wisely across all games.',
      color: 'text-warning-400'
    },
    {
      icon: '🎯',
      title: 'Fair Play',
      description: 'All games use random number generation for fair and exciting gameplay.',
      color: 'text-primary-400'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Play on any device with our responsive design and touch-friendly controls.',
      color: 'text-accent-400'
    },
    {
      icon: '🔒',
      title: 'Secure Gaming',
      description: 'Your account and gameplay data are protected with modern security.',
      color: 'text-success-400'
    }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-24 relative">
          {/* Floating particles background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="particle absolute top-20 left-10 animate-pulse"></div>
            <div className="particle absolute top-40 right-20 animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="particle absolute bottom-20 left-1/4 animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="particle absolute bottom-40 right-1/3 animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
          
          <div className="relative z-10">
            <div className="mb-12">
              <div className="flex items-center justify-center mb-8">
                <Logo size="2xl" className="mr-6" />
                <h1 className="text-6xl md:text-8xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl">
                    xbox360.cc
                  </span>
                </h1>
              </div>
              <div className="max-w-4xl mx-auto">
                <p className="text-2xl md:text-3xl text-gray-300 mb-6 leading-relaxed font-light">
                  Experience the thrill of premium online gaming
                </p>
                <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                  Cutting-edge graphics, immersive gameplay, and the excitement of real gaming action
                </p>
              </div>
            </div>

            {isAuthenticated && (
              <div className="max-w-md mx-auto mb-12 fade-in">
                <CashDisplay />
              </div>
            )}

            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center fade-in">
                <Link href="/auth" className="btn-gaming text-lg px-10 py-4 transform hover:scale-105">
                  🚀 Get Started
                </Link>
                <Link href="#games" className="btn-secondary text-lg px-10 py-4 transform hover:scale-105">
                  🎮 View Games
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Games Section */}
        <div id="games" className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-gaming-green to-gaming-accent bg-clip-text text-transparent">
                Choose Your Game
              </span>
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
              From classic table games to modern slots, find your perfect gaming experience in our premium collection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game, index) => (
              <Link key={game.name} href={isAuthenticated ? game.href : '/auth'}>
                <div className={`game-card group ${game.glowColor} hover:shadow-2xl slide-in-left`} 
                     style={{animationDelay: `${index * 0.2}s`}}>
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
            ))}
          </div>
        </div>

        {/* Enhanced Features Section */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-gaming-green to-gaming-accent bg-clip-text text-transparent">
                Why Choose xbox360.cc?
              </span>
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
              Built with cutting-edge technology and designed for the ultimate gaming experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="modern-card text-center group hover:border-purple-400/40 bounce-in" 
                   style={{animationDelay: `${index * 0.1}s`}}>
                <div className="relative mb-6">
                  <div className={`text-6xl mb-4 ${feature.color} group-hover:scale-125 transition-all duration-500 float-animation`}
                       style={{animationDelay: `${index * 0.5}s`}}>
                    {feature.icon}
                  </div>
                  {/* Icon glow effect */}
                  <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 text-6xl ${feature.color} opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-500`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Game Rules Section */}
        <div className="glow-card max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-gaming-green to-gaming-accent bg-clip-text text-transparent">
              How to Play
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="modern-card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-gaming-green to-gaming-accent rounded-lg flex items-center justify-center text-2xl mr-4">
                  🎰
                </div>
                <h4 className="text-xl font-bold text-white">Roulette</h4>
              </div>
              <ul className="text-dark-300 space-y-2">
                <li>• Place bets on colors, numbers, or ranges</li>
                <li>• Spin the wheel to see where the ball lands</li>
                <li>• Win up to 35:1 on single number bets</li>
                <li>• Multiple betting options available</li>
              </ul>
            </div>

            <div className="modern-card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-gaming-green-dark to-gaming-green rounded-lg flex items-center justify-center text-2xl mr-4">
                  🎲
                </div>
                <h4 className="text-xl font-bold text-white">Slots</h4>
              </div>
              <ul className="text-dark-300 space-y-2">
                <li>• Match symbols across the reels</li>
                <li>• Three of a kind pays the highest</li>
                <li>• Jackpot: Triple 7s pays 100x your bet</li>
                <li>• Two of a kind also pays out</li>
              </ul>
            </div>

            <div className="modern-card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-gaming-green-light to-gaming-green rounded-lg flex items-center justify-center text-2xl mr-4">
                  🃏
                </div>
                <h4 className="text-xl font-bold text-white">Texas Hold'em</h4>
              </div>
              <ul className="text-dark-300 space-y-2">
                <li>• Get dealt two hole cards</li>
                <li>• Make the best 5-card hand</li>
                <li>• Bet, raise, or fold strategically</li>
                <li>• Beat the dealer to win</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="text-center mt-20">
            <div className="glow-card max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to Start Playing?
              </h3>
              <p className="text-dark-300 mb-8 text-lg">
                Join thousands of players and experience the excitement of BoredCasino
              </p>
              <Link href="/auth" className="btn-primary text-lg px-8 py-4">
                Create Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}