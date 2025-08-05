import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useXP } from './ui/XPTracker';
import { useAchievements } from './ui/AchievementSystem';
import useSound from '../hooks/useSound';
import ParticleSystem from './ui/ParticleSystem';
import { useTheme } from '../hooks/useTheme';

// Xbox 360 RGH/Devkit themed cases and items
const CASE_TYPES = {
  starter: {
    id: 'starter',
    name: 'Starter Kit Case',
    description: 'Basic modding tools and common items',
    price: 100,
    icon: '📦',
    rarity: 'common',
    gradient: 'from-gray-500 to-gray-600'
  },
  rgh: {
    id: 'rgh',
    name: 'RGH Modding Case',
    description: 'Reset Glitch Hack components and tools',
    price: 500,
    icon: '⚡',
    rarity: 'rare',
    gradient: 'from-blue-500 to-blue-600'
  },
  devkit: {
    id: 'devkit',
    name: 'Devkit Collection',
    description: 'Rare development hardware and software',
    price: 2000,
    icon: '🛠️',
    rarity: 'epic',
    gradient: 'from-purple-500 to-purple-600'
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary Modder Case',
    description: 'Ultra-rare items for elite modders',
    price: 5000,
    icon: '👑',
    rarity: 'legendary',
    gradient: 'from-yellow-500 to-orange-500'
  }
};

// Xbox 360 themed items with authentic modding references
const CASE_ITEMS = {
  starter: [
    // Common Tools (70% chance)
    { name: 'Torx T8 Screwdriver', rarity: 'common', value: 25, icon: '🔧', description: 'Essential for opening Xbox 360 cases' },
    { name: 'Plastic Prying Tools', rarity: 'common', value: 15, icon: '🔨', description: 'Safe case opening without damage' },
    { name: 'Anti-Static Wrist Strap', rarity: 'common', value: 20, icon: '⚡', description: 'Protect sensitive components' },
    { name: 'Thermal Paste', rarity: 'common', value: 30, icon: '🧴', description: 'Arctic Silver 5 for CPU/GPU' },
    { name: 'Cleaning Alcohol', rarity: 'common', value: 10, icon: '🧽', description: '99% Isopropyl for cleaning' },
    
    // Uncommon Items (25% chance)
    { name: 'Soldering Iron Kit', rarity: 'uncommon', value: 75, icon: '🔥', description: 'Temperature controlled soldering station' },
    { name: 'Multimeter', rarity: 'uncommon', value: 60, icon: '📊', description: 'Digital multimeter for testing' },
    { name: 'Flux Paste', rarity: 'uncommon', value: 40, icon: '💧', description: 'No-clean flux for soldering' },
    
    // Rare Items (5% chance)
    { name: 'Hot Air Rework Station', rarity: 'rare', value: 200, icon: '🌪️', description: 'For BGA chip work' }
  ],
  
  rgh: [
    // Common RGH Components (60% chance)
    { name: 'Coolrunner Rev C', rarity: 'common', value: 80, icon: '💾', description: 'Popular RGH glitch chip' },
    { name: 'Matrix Glitcher V1', rarity: 'common', value: 70, icon: '🔲', description: 'Alternative glitch chip' },
    { name: '22AWG Kynar Wire', rarity: 'common', value: 25, icon: '🔌', description: 'Thin wire for point connections' },
    { name: 'Oscilloscope Probe', rarity: 'common', value: 45, icon: '📡', description: 'For timing measurements' },
    
    // Uncommon RGH Items (30% chance)
    { name: 'Coolrunner Rev D', rarity: 'uncommon', value: 120, icon: '💎', description: 'Improved glitch chip with better timing' },
    { name: 'Matrix Glitcher V3', rarity: 'uncommon', value: 110, icon: '🔷', description: 'Latest Matrix glitch chip' },
    { name: 'RGH Timing Files', rarity: 'uncommon', value: 90, icon: '📁', description: 'Pre-configured timing files' },
    { name: 'NAND Programmer', rarity: 'uncommon', value: 150, icon: '💿', description: 'For NAND reading/writing' },
    
    // Rare RGH Items (10% chance)
    { name: 'Demon Modchip', rarity: 'rare', value: 300, icon: '😈', description: 'Advanced RGH solution with auto-timing' },
    { name: 'RGH3 Kit', rarity: 'rare', value: 400, icon: '🚀', description: 'Latest RGH method for newer consoles' }
  ],
  
  devkit: [
    // Uncommon Devkit Items (50% chance)
    { name: 'XDK Documentation', rarity: 'uncommon', value: 200, icon: '📚', description: 'Official Xbox Development Kit docs' },
    { name: 'Debug BIOS', rarity: 'uncommon', value: 250, icon: '🐛', description: 'Development console BIOS' },
    { name: 'Devkit HDD', rarity: 'uncommon', value: 180, icon: '💽', description: '120GB development drive' },
    { name: 'XNA Game Studio', rarity: 'uncommon', value: 150, icon: '🎮', description: 'Game development software' },
    
    // Rare Devkit Items (35% chance)
    { name: 'Alpha Devkit Console', rarity: 'rare', value: 800, icon: '🖥️', description: 'Early development hardware' },
    { name: 'Beta Devkit Console', rarity: 'rare', value: 600, icon: '📺', description: 'Pre-release development unit' },
    { name: 'Devkit Controller', rarity: 'rare', value: 300, icon: '🎯', description: 'Special development controller' },
    { name: 'XDK Software Suite', rarity: 'rare', value: 500, icon: '💿', description: 'Complete development environment' },
    
    // Epic Devkit Items (15% chance)
    { name: 'Xenon Alpha Kit', rarity: 'epic', value: 1500, icon: '⚛️', description: 'Ultra-rare pre-launch devkit' },
    { name: 'Reviewer Guide Console', rarity: 'epic', value: 1200, icon: '📝', description: 'Press review unit' }
  ],
  
  legendary: [
    // Rare Items (40% chance)
    { name: '0Fuse Exploit Kit', rarity: 'rare', value: 1000, icon: '💣', description: 'Legendary bootloader exploit' },
    { name: 'King Kong Exploit', rarity: 'rare', value: 800, icon: '🦍', description: 'Historic game save exploit' },
    { name: 'Hypervisor Bypass', rarity: 'rare', value: 1200, icon: '🔓', description: 'Low-level system access' },
    
    // Epic Items (35% chance)
    { name: 'Jtag Modchip', rarity: 'epic', value: 2000, icon: '🔌', description: 'Original hardware modification' },
    { name: 'Blades Dashboard', rarity: 'epic', value: 1500, icon: '⚔️', description: 'Original Xbox 360 interface' },
    { name: 'Prototype Motherboard', rarity: 'epic', value: 2500, icon: '🔬', description: 'Pre-production hardware' },
    
    // Legendary Items (20% chance)
    { name: 'Xenon Prototype', rarity: 'legendary', value: 5000, icon: '👑', description: 'Holy grail of Xbox 360 collecting' },
    { name: 'Microsoft Signing Keys', rarity: 'legendary', value: 10000, icon: '🗝️', description: 'The ultimate prize' },
    
    // Mythic Items (5% chance)
    { name: 'Xbox 360 Source Code', rarity: 'mythic', value: 25000, icon: '💎', description: 'Legendary development artifact' }
  ]
};

const RARITY_COLORS = {
  common: { bg: 'from-gray-500 to-gray-600', text: 'text-gray-300', glow: 'shadow-gray-500/20' },
  uncommon: { bg: 'from-green-500 to-green-600', text: 'text-green-300', glow: 'shadow-green-500/20' },
  rare: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-300', glow: 'shadow-blue-500/20' },
  epic: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-300', glow: 'shadow-purple-500/20' },
  legendary: { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/20' },
  mythic: { bg: 'from-pink-500 to-red-500', text: 'text-pink-300', glow: 'shadow-pink-500/20' }
};

const RARITY_CHANCES = {
  starter: { common: 70, uncommon: 25, rare: 5 },
  rgh: { common: 60, uncommon: 30, rare: 10 },
  devkit: { uncommon: 50, rare: 35, epic: 15 },
  legendary: { rare: 40, epic: 35, legendary: 20, mythic: 5 }
};

export default function CaseOpening() {
  const { user, updateUserCash } = useAuth();
  const { awardXP } = useXP();
  const { checkAchievement } = useAchievements();
  const { playSound, playWinSequence } = useSound();
  const { customSettings } = useTheme();
  
  const [selectedCase, setSelectedCase] = useState('starter');
  const [isOpening, setIsOpening] = useState(false);
  const [openedItem, setOpenedItem] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [openingAnimation, setOpeningAnimation] = useState(false);
  
  const cash = user?.cashBalance || 0;
  
  // Load inventory from localStorage
  useEffect(() => {
    const savedInventory = localStorage.getItem('caseInventory');
    if (savedInventory) {
      const parsed = JSON.parse(savedInventory);
      setInventory(parsed);
      setTotalValue(parsed.reduce((sum, item) => sum + item.value, 0));
    }
  }, []);
  
  // Save inventory to localStorage
  const saveInventory = (newInventory) => {
    localStorage.setItem('caseInventory', JSON.stringify(newInventory));
    setInventory(newInventory);
    setTotalValue(newInventory.reduce((sum, item) => sum + item.value, 0));
  };
  
  // Get random item based on rarity chances
  const getRandomItem = (caseType) => {
    const items = CASE_ITEMS[caseType];
    const chances = RARITY_CHANCES[caseType];
    
    const random = Math.random() * 100;
    let threshold = 0;
    let selectedRarity = 'common';
    
    for (const [rarity, chance] of Object.entries(chances)) {
      threshold += chance;
      if (random <= threshold) {
        selectedRarity = rarity;
        break;
      }
    }
    
    const rarityItems = items.filter(item => item.rarity === selectedRarity);
    return rarityItems[Math.floor(Math.random() * rarityItems.length)];
  };
  
  // Open case animation and logic
  const openCase = async () => {
    const caseData = CASE_TYPES[selectedCase];
    
    if (cash < caseData.price) {
      playSound('error');
      alert('Insufficient funds to open this case!');
      return;
    }
    
    setIsOpening(true);
    setOpeningAnimation(true);
    playSound('spin');
    
    // Deduct case price
    const newBalance = cash - caseData.price;
    await updateUserCash(newBalance);
    
    // Simulate opening animation
    setTimeout(() => {
      const item = getRandomItem(selectedCase);
      const itemWithId = {
        ...item,
        id: Date.now(),
        caseType: selectedCase,
        openedAt: new Date().toISOString()
      };
      
      setOpenedItem(itemWithId);
      setOpeningAnimation(false);
      
      // Add to inventory
      const newInventory = [...inventory, itemWithId];
      saveInventory(newInventory);
      
      // Award XP based on rarity
      const xpMultiplier = {
        common: 1,
        uncommon: 1.5,
        rare: 2,
        epic: 3,
        legendary: 5,
        mythic: 10
      }[item.rarity] || 1;
      
      if (awardXP) {
        awardXP('ACHIEVEMENT_UNLOCKED', xpMultiplier, {
          gamesPlayed: user.gamesPlayed || 0,
          totalWinnings: (user.totalWinnings || 0) + item.value,
          winRate: user.winRate || 0
        });
      }
      
      // Check achievements
      checkAchievement('firstWin', true);
      if (item.rarity === 'legendary' || item.rarity === 'mythic') {
        checkAchievement('bigWin', true);
        setShowCelebration(true);
        playWinSequence();
        setTimeout(() => setShowCelebration(false), 3000);
      } else {
        playSound('win');
      }
      
      // Special achievements for specific items
      if (item.name.includes('0Fuse')) {
        checkAchievement('riskTaker', true);
      }
      
      setTimeout(() => {
        setIsOpening(false);
        setOpenedItem(null);
      }, 5000);
      
    }, 3000);
  };
  
  // Sell item from inventory
  const sellItem = async (itemId) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    
    const sellPrice = Math.floor(item.value * 0.7); // 70% of original value
    const newBalance = cash + sellPrice;
    await updateUserCash(newBalance);
    
    const newInventory = inventory.filter(i => i.id !== itemId);
    saveInventory(newInventory);
    
    playSound('success');
  };
  
  // Sell all items
  const sellAllItems = async () => {
    if (inventory.length === 0) return;
    
    const totalSellValue = Math.floor(totalValue * 0.7);
    const newBalance = cash + totalSellValue;
    await updateUserCash(newBalance);
    
    saveInventory([]);
    playSound('success');
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6 relative">
      {/* Celebration Particles */}
      {showCelebration && customSettings.particlesEnabled && (
        <div className="fixed inset-0 pointer-events-none z-10">
          <ParticleSystem 
            type="confetti" 
            intensity="high" 
            isActive={showCelebration}
          />
        </div>
      )}

      {/* Header */}
      <div className="gaming-header mb-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              📦 Xbox 360 Case Opening
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Unbox rare Xbox 360 modding items, devkit hardware, and legendary exploits!
          </p>
          <div className="flex justify-center items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              <span>RGH Components</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
              <span>Devkit Hardware</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-purple-400 rounded-full"></span>
              <span>Legendary Exploits</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="modern-card text-center p-4">
          <div className="text-2xl mb-2">💰</div>
          <div className="text-2xl font-bold text-green-400">{cash}</div>
          <div className="text-gray-400 text-sm">Your Balance</div>
        </div>
        <div className="modern-card text-center p-4">
          <div className="text-2xl mb-2">📦</div>
          <div className="text-2xl font-bold text-blue-400">{inventory.length}</div>
          <div className="text-gray-400 text-sm">Items Owned</div>
        </div>
        <div className="modern-card text-center p-4">
          <div className="text-2xl mb-2">💎</div>
          <div className="text-2xl font-bold text-purple-400">{totalValue}</div>
          <div className="text-gray-400 text-sm">Total Value</div>
        </div>
        <div className="modern-card text-center p-4">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-2xl font-bold text-yellow-400">
            {inventory.filter(i => i.rarity === 'legendary' || i.rarity === 'mythic').length}
          </div>
          <div className="text-gray-400 text-sm">Legendary Items</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Case Selection */}
        <div className="lg:col-span-2">
          <div className="modern-card mb-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">📦</span>
              Select Your Case
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.values(CASE_TYPES).map((caseType) => (
                <div
                  key={caseType.id}
                  onClick={() => setSelectedCase(caseType.id)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedCase === caseType.id
                      ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-4xl mb-3 ${selectedCase === caseType.id ? 'animate-bounce' : ''}`}>
                      {caseType.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{caseType.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{caseType.description}</p>
                    <div className="text-2xl font-bold text-green-400">{caseType.price} MSP</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Opening Animation */}
            {openingAnimation && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-spin">📦</div>
                <div className="text-2xl font-bold text-white mb-2">Opening Case...</div>
                <div className="text-gray-400">Revealing your item...</div>
              </div>
            )}
            
            {/* Opened Item Display */}
            {openedItem && !openingAnimation && (
              <div className="text-center py-8">
                <div className={`inline-block p-8 rounded-2xl bg-gradient-to-br ${RARITY_COLORS[openedItem.rarity].bg} shadow-2xl ${RARITY_COLORS[openedItem.rarity].glow} mb-4`}>
                  <div className="text-6xl mb-4">{openedItem.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{openedItem.name}</h3>
                  <p className="text-gray-200 text-sm mb-3">{openedItem.description}</p>
                  <div className="text-3xl font-bold text-green-400">{openedItem.value} MSP</div>
                  <div className={`text-sm font-bold mt-2 ${RARITY_COLORS[openedItem.rarity].text}`}>
                    {openedItem.rarity.toUpperCase()}
                  </div>
                </div>
              </div>
            )}
            
            {/* Open Case Button */}
            {!isOpening && (
              <div className="text-center">
                <button
                  onClick={openCase}
                  disabled={cash < CASE_TYPES[selectedCase].price}
                  className={`btn-gaming px-8 py-4 text-xl ${
                    cash < CASE_TYPES[selectedCase].price
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105'
                  }`}
                >
                  Open {CASE_TYPES[selectedCase].name} - {CASE_TYPES[selectedCase].price} MSP
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Inventory */}
        <div className="lg:col-span-1">
          <div className="modern-card h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3">🎒</span>
                Inventory ({inventory.length})
              </h3>
              {inventory.length > 0 && (
                <button
                  onClick={sellAllItems}
                  className="btn-success px-3 py-1 text-sm"
                >
                  Sell All
                </button>
              )}
            </div>
            
            {inventory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-4">📦</div>
                <p>No items yet. Open some cases to start collecting!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {inventory.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-xl border bg-gradient-to-r ${RARITY_COLORS[item.rarity].bg} ${RARITY_COLORS[item.rarity].glow} transition-all duration-300 hover:scale-105`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{item.icon}</div>
                        <div>
                          <div className="font-bold text-white text-sm">{item.name}</div>
                          <div className={`text-xs ${RARITY_COLORS[item.rarity].text}`}>
                            {item.rarity.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => sellItem(item.id)}
                        className="btn-secondary px-2 py-1 text-xs"
                      >
                        Sell {Math.floor(item.value * 0.7)}
                      </button>
                    </div>
                    <div className="text-xs text-gray-300">{item.description}</div>
                    <div className="text-sm font-bold text-green-400 mt-1">{item.value} MSP</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Xbox 360 Modding Info */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="modern-card">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center text-3xl">
              ⚡
            </div>
            <h3 className="text-xl font-bold text-white mb-3">RGH Modding</h3>
            <p className="text-gray-400 text-sm">
              Reset Glitch Hack - The most popular Xbox 360 modification method using timing attacks on the CPU.
            </p>
          </div>
        </div>
        
        <div className="modern-card">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center text-3xl">
              🛠️
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Devkit Hardware</h3>
            <p className="text-gray-400 text-sm">
              Official Microsoft development consoles used for game development and testing.
            </p>
          </div>
        </div>
        
        <div className="modern-card">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl">
              💣
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Historic Exploits</h3>
            <p className="text-gray-400 text-sm">
              Legendary exploits like 0Fuse and King Kong that changed Xbox 360 modding forever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}