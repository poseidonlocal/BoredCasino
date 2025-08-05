import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCash } from '../context/CashContext';
import { calculateLevel, getXPProgress } from '../lib/xpSystem';
import ThemeCustomizer from './ui/ThemeCustomizer';
import WalletModal from './ui/WalletModal';
import NotificationCenter from './ui/NotificationCenter';
import Logo from './ui/Logo';

const Navigation = () => {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { cash } = useCash();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setShowUserDropdown(false);
  };

  // Organized navigation items like Howl.gg
  const navSections = {
    casino: {
      label: 'Casino',
      items: [
        { href: '/roulette', label: 'Roulette', icon: '🎰', emoji: true },
        { href: '/slots', label: 'Slots', icon: '🎰', emoji: true },
        { href: '/poker', label: 'Poker', icon: '🃏', emoji: true },
        { href: '/coinflip', label: 'Coinflip', icon: '🪙', emoji: true },
        { href: '/crash', label: 'Crash', icon: '🚀', emoji: true, new: true },
        { href: '/dice', label: 'Dice', icon: '🎲', emoji: true, new: true },
        { href: '/mines', label: 'Mines', icon: '💣', emoji: true, new: true },
        { href: '/wheel', label: 'Wheel', icon: '🎡', emoji: true, new: true },
        { href: '/cases', label: 'Case Opening', icon: '📦', emoji: true }
      ]
    },
    compete: {
      label: 'Compete',
      items: [
        { href: '/tournaments', label: 'Tournaments', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
        { href: '/leaderboard', label: 'Leaderboard', icon: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z' },
        { href: '/challenges', label: 'Challenges', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' }
      ]
    },
    social: {
      label: 'Social',
      items: [
        { href: '/friends', label: 'Friends', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { href: '/profiles', label: 'Players', icon: 'M16 7c0-2.21-1.79-4-4-4S8 4.79 8 7s1.79 4 4 4 4-1.79 4-4zM12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
        { href: '/stats', label: 'Statistics', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
        { href: '/game-history', label: 'Game History', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' }
      ]
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50 shadow-2xl' 
        : 'bg-gray-900/80 backdrop-blur-md border-b border-gray-800/30'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          
          {/* Logo Section - Gaming Style */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <Logo size="md" className="group-hover:scale-105 transition-transform duration-300" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white group-hover:text-gaming-green transition-colors">
                  xbox360.cc
                </span>
                <span className="text-xs text-gray-400 -mt-1">Gaming Casino</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Howl.gg Style */}
          <nav className="hidden lg:flex items-center space-x-8">
            {/* Casino Games Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors py-2">
                <span className="font-medium">Casino</span>
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {navSections.casino.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center px-4 py-3 text-sm transition-colors ${
                      router.pathname === item.href 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}>
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Compete Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors py-2">
                <span className="font-medium">Compete</span>
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {navSections.compete.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center px-4 py-3 text-sm transition-colors ${
                      router.pathname === item.href 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}>
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Social Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors py-2">
                <span className="font-medium">Social</span>
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {navSections.social.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center px-4 py-3 text-sm transition-colors ${
                      router.pathname === item.href 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}>
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Shop Link */}
            <Link href="/shop" className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              router.pathname === '/shop'
                ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/30'
                : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-500/5'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Shop</span>
              <span className="px-2 py-0.5 bg-yellow-500 text-gray-900 text-xs font-bold rounded-full">NEW</span>
            </Link>

            {/* Admin Panel */}
            {isAuthenticated && user?.isAdmin && (
              <Link href="/admin" className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Right Section - Howl.gg Style */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Balance Display */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700/50">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91 2.28.6 4.18 1.58 4.18 3.91 0 1.82-1.33 2.96-3.12 3.16z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-green-400 font-bold text-sm">
                        {(cash || user?.cashBalance || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">MSP</span>
                    </div>
                  </div>
                  
                  {/* Level Display */}
                  <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700/50">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{calculateLevel(user?.totalXP || 0)}</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs text-blue-400 font-medium">
                        Level {calculateLevel(user?.totalXP || 0)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {(() => {
                          const progress = getXPProgress(user?.totalXP || 0);
                          return `${progress.progressXP}/${progress.requiredXP}`;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <NotificationCenter />
                    
                    <button 
                      onClick={() => setShowWalletModal(true)}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Wallet</span>
                    </button>
                    
                    <Link href="/deposit">
                      <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Deposit</span>
                      </button>
                    </Link>
                  </div>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg px-3 py-2 transition-colors border border-gray-700/50"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-white">{user?.username}</div>
                      <div className="text-xs text-gray-400">Level {calculateLevel(user?.totalXP || 0)}</div>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Dropdown */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 py-2">
                      <div className="px-4 py-3 border-b border-gray-700/50">
                        <div className="text-sm font-medium text-white">{user?.username}</div>
                        <div className="text-xs text-gray-400">Level {calculateLevel(user?.totalXP || 0)} • Premium Player</div>
                      </div>
                      
                      <Link href={`/profile/${user?.username}`}>
                        <div className="flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors cursor-pointer">
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <div className="font-medium">Profile</div>
                            <div className="text-xs text-gray-400">View your profile</div>
                          </div>
                        </div>
                      </Link>
                      
                      <button
                        onClick={() => {
                          setShowThemeCustomizer(true);
                          setShowUserDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                        </svg>
                        <div className="text-left">
                          <div className="font-medium">Customize</div>
                          <div className="text-xs text-gray-400">Theme settings</div>
                        </div>
                      </button>
                      
                      <Link href="/profile/settings">
                        <div className="flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors cursor-pointer">
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div>
                            <div className="font-medium">Settings</div>
                            <div className="text-xs text-gray-400">Account settings</div>
                          </div>
                        </div>
                      </Link>
                      
                      <div className="border-t border-gray-700/50 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <div className="text-left">
                            <div className="font-medium">Sign Out</div>
                            <div className="text-xs text-red-400/70">End session</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/shop">
                  <button className="flex items-center space-x-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 hover:text-yellow-300 px-4 py-2 rounded-lg font-medium transition-colors border border-yellow-600/30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Shop</span>
                  </button>
                </Link>
                <Link href="/auth">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors">
                    Sign In
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-800/50 bg-gray-900/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-1">
              {/* Casino Games */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Casino</div>
                {navSections.casino.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      router.pathname === item.href 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                    }`} onClick={() => setIsMobileMenuOpen(false)}>
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Compete */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Compete</div>
                {navSections.compete.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      router.pathname === item.href 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                    }`} onClick={() => setIsMobileMenuOpen(false)}>
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Social */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Social</div>
                {navSections.social.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      router.pathname === item.href 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                    }`} onClick={() => setIsMobileMenuOpen(false)}>
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Shop */}
              <Link href="/shop">
                <div className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  router.pathname === '/shop'
                    ? 'text-yellow-400 bg-yellow-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`} onClick={() => setIsMobileMenuOpen(false)}>
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Shop
                  <span className="ml-auto px-2 py-0.5 bg-yellow-500 text-gray-900 text-xs font-bold rounded-full">NEW</span>
                </div>
              </Link>
              
              {/* Mobile Balance */}
              {isAuthenticated && (
                <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs text-gray-400">Balance</div>
                      <div className="text-lg font-bold text-green-400">
                        {(cash || user?.cashBalance || 0).toLocaleString()} MSP
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91 2.28.6 4.18 1.58 4.18 3.91 0 1.82-1.33 2.96-3.12 3.16z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        setShowWalletModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center space-x-1 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Wallet</span>
                    </button>
                    
                    <Link href="/deposit">
                      <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center space-x-1 py-2 text-sm bg-green-600 text-white rounded-lg font-medium w-full"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Deposit</span>
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
      
      <ThemeCustomizer 
        isOpen={showThemeCustomizer} 
        onClose={() => setShowThemeCustomizer(false)} 
      />
    </header>
  );
};

export default Navigation;