// Debug utilities for the casino app
import { calculateLevel, getXPProgress, awardXP } from './xpSystem';

export const DEBUG_MODE = process.env.NODE_ENV === 'development';

export function logUserState(user, context = '') {
  if (!DEBUG_MODE) return;
  
  console.group(`🔍 User State Debug ${context ? `- ${context}` : ''}`);
  console.log('User Object:', user);
  console.log('Current XP:', user?.totalXP || 0);
  console.log('Current Level:', user?.level || 1);
  console.log('Calculated Level:', calculateLevel(user?.totalXP || 0));
  console.log('XP Progress:', getXPProgress(user?.totalXP || 0));
  console.groupEnd();
}

export function logXPAward(source, xpGained, oldXP, newXP, oldLevel, newLevel) {
  if (!DEBUG_MODE) return;
  
  console.group('⭐ XP Award Debug');
  console.log('Source:', source);
  console.log('XP Gained:', xpGained);
  console.log('Old XP:', oldXP);
  console.log('New XP:', newXP);
  console.log('Old Level:', oldLevel);
  console.log('New Level:', newLevel);
  console.log('Level Up:', newLevel > oldLevel);
  console.groupEnd();
}

export function logChallengeState(challenges, context = '') {
  if (!DEBUG_MODE) return;
  
  console.group(`🎯 Challenge State Debug ${context ? `- ${context}` : ''}`);
  challenges.forEach(challenge => {
    console.log(`${challenge.title}:`, {
      current: challenge.current,
      target: challenge.target,
      completed: challenge.completed,
      claimed: challenge.claimed,
      progress: `${challenge.current}/${challenge.target} (${Math.round((challenge.current / challenge.target) * 100)}%)`
    });
  });
  console.groupEnd();
}

export function logDatabaseOperation(operation, table, data, result) {
  if (!DEBUG_MODE) return;
  
  console.group(`💾 Database Operation - ${operation}`);
  console.log('Table:', table);
  console.log('Data:', data);
  console.log('Result:', result);
  console.groupEnd();
}

export function createDebugPanel() {
  if (!DEBUG_MODE || typeof window === 'undefined') return;
  
  // Create debug panel in browser
  const debugPanel = document.createElement('div');
  debugPanel.id = 'casino-debug-panel';
  debugPanel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 300px;
    max-height: 400px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 10px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    overflow-y: auto;
    border: 1px solid #333;
  `;
  
  debugPanel.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 10px;">🎮 Casino Debug Panel</div>
    <div id="debug-content"></div>
    <button onclick="this.parentElement.style.display='none'" style="margin-top: 10px; padding: 5px; background: #333; color: white; border: none; border-radius: 4px;">Hide</button>
  `;
  
  document.body.appendChild(debugPanel);
  
  return debugPanel;
}

export function updateDebugPanel(data) {
  if (!DEBUG_MODE || typeof window === 'undefined') return;
  
  const panel = document.getElementById('casino-debug-panel');
  const content = document.getElementById('debug-content');
  
  if (panel && content) {
    content.innerHTML = `
      <div><strong>User:</strong> ${data.username || 'Not logged in'}</div>
      <div><strong>Level:</strong> ${data.level || 1}</div>
      <div><strong>XP:</strong> ${data.totalXP || 0}</div>
      <div><strong>Balance:</strong> ${data.cashBalance || 0} MSP</div>
      <div><strong>Games Played:</strong> ${data.gamesPlayed || 0}</div>
      <div><strong>Win Rate:</strong> ${data.winRate || 0}%</div>
      <div style="margin-top: 10px; font-size: 10px; color: #888;">
        Last updated: ${new Date().toLocaleTimeString()}
      </div>
    `;
  }
}

// Test functions for debugging
export function testXPSystem() {
  if (!DEBUG_MODE) return;
  
  console.group('🧪 XP System Test');
  
  // Test level calculations
  const testXPValues = [0, 50, 100, 250, 500, 1000, 2000, 5000, 10000];
  testXPValues.forEach(xp => {
    const level = calculateLevel(xp);
    const progress = getXPProgress(xp);
    console.log(`XP: ${xp} → Level: ${level}`, progress);
  });
  
  // Test XP awarding
  const testAward = awardXP(0, 'GAME_WON', 1);
  console.log('Test XP Award:', testAward);
  
  console.groupEnd();
}

export function testChallengeSystem() {
  if (!DEBUG_MODE) return;
  
  console.group('🧪 Challenge System Test');
  
  // Test challenge completion logic
  const mockChallenge = {
    id: 'test',
    title: 'Test Challenge',
    current: 2,
    target: 3,
    completed: false
  };
  
  console.log('Before completion:', mockChallenge);
  
  const updatedChallenge = {
    ...mockChallenge,
    current: 3,
    completed: true
  };
  
  console.log('After completion:', updatedChallenge);
  
  console.groupEnd();
}

// Export debug functions to window for browser console access
if (typeof window !== 'undefined' && DEBUG_MODE) {
  window.casinoDebug = {
    logUserState,
    logXPAward,
    logChallengeState,
    testXPSystem,
    testChallengeSystem,
    createDebugPanel,
    updateDebugPanel
  };
}