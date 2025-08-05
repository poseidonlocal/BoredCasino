import React, { useState } from 'react';
import Navigation from './Navigation';
import XPTracker from './ui/XPTracker';
import DailyBonusPopup from './DailyBonusPopup';
import Announcements from './Announcements';
import ParticleSystem from './ui/ParticleSystem';
import LiveChat from './ui/LiveChat';
import ChatToggle from './ui/ChatToggle';
import Logo from './ui/Logo';
import { useTheme } from '../hooks/useTheme';
import { AchievementNotification, useAchievements } from './ui/AchievementSystem';

const Layout = ({ children }) => {
  const { customSettings } = useTheme();
  const { notifications, removeNotification } = useAchievements();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Dynamic Particle System */}
      {customSettings.particlesEnabled && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <ParticleSystem 
            type="default" 
            intensity="medium" 
            isActive={customSettings.particlesEnabled}
          />
        </div>
      )}
      
      {/* Enhanced Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        {/* Additional ambient elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
      </div>
      
      <div className="relative z-10">
        <Navigation />
        <Announcements />
        <main className="min-h-screen">
          <div className="fade-in">
            {children}
          </div>
        </main>
        
        {/* Daily Bonus Popup */}
        <DailyBonusPopup />
        
        {/* XP Tracker for notifications */}
        <XPTracker />
        
        {/* Achievement Notifications */}
        {notifications.map((achievement) => (
          <AchievementNotification
            key={achievement.id}
            achievement={achievement}
            onClose={() => removeNotification(achievement.id)}
          />
        ))}
        
        {/* Live Chat System */}
        <LiveChat 
          isOpen={isChatOpen} 
          onToggle={() => setIsChatOpen(!isChatOpen)} 
        />
        
        {/* Chat Toggle Button */}
        {!isChatOpen && (
          <ChatToggle 
            isOpen={isChatOpen} 
            onToggle={() => setIsChatOpen(!isChatOpen)}
            unreadCount={3}
          />
        )}
        
        {/* Modern footer */}
        <footer className="relative border-t border-dark-700/50 bg-dark-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Brand section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Logo size="lg" />
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                    xbox360.cc
                  </h3>
                </div>
                <p className="text-dark-400 text-sm leading-relaxed">
                  Experience the thrill of premium online gaming with our modern, secure platform.
                </p>
              </div>
              
              {/* Quick links */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Quick Links</h4>
                <div className="space-y-2">
                  <a href="/roulette" className="block text-gray-400 hover:text-purple-400 transition-colors text-sm">Roulette</a>
                  <a href="/slots" className="block text-gray-400 hover:text-purple-400 transition-colors text-sm">Slots</a>
                  <a href="/poker" className="block text-gray-400 hover:text-purple-400 transition-colors text-sm">Texas Hold'em</a>
                </div>
              </div>
              
              {/* Legal info */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Responsible Gaming</h4>
                <div className="space-y-2 text-sm text-dark-400">
                  <p>Play responsibly. Must be 18+ to play.</p>
                  <p>This is a demo application for entertainment purposes only.</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-dark-700/50 mt-8 pt-8 text-center">
              <p className="text-dark-500 text-sm">
                © 2024 BoredCasino. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;