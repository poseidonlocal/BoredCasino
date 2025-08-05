import React from 'react';
import Link from 'next/link';

const BotProfileCard = ({ bot }) => {
  if (!bot || !bot.isBot) return null;
  
  // Get personality description
  const getPersonalityDescription = (style) => {
    const descriptions = {
      aggressive: "Plays aggressively with frequent raises and bluffs",
      tight: "Plays conservatively, only betting with strong hands",
      loose: "Plays many hands and calls frequently",
      balanced: "Plays a balanced strategy with mixed aggression",
      calling_station: "Calls often but rarely raises",
      bluffer: "Bluffs frequently, even with weak hands",
      rock: "Extremely tight player who only plays premium hands",
      wild: "Unpredictable player with wild betting patterns",
      professional: "Skilled player with solid fundamentals",
      maniac: "Extremely aggressive player who raises constantly"
    };
    
    return descriptions[style] || "A poker player with a unique style";
  };
  
  // Get personality style color
  const getStyleColor = (style) => {
    const colors = {
      aggressive: "text-red-400",
      tight: "text-blue-400",
      loose: "text-yellow-400",
      balanced: "text-green-400",
      calling_station: "text-purple-400",
      bluffer: "text-orange-400",
      rock: "text-gray-400",
      wild: "text-pink-400",
      professional: "text-cyan-400",
      maniac: "text-red-500"
    };
    
    return colors[style] || "text-white";
  };
  
  const personality = bot.personality || { style: 'unknown', aggression: 0.5, bluffRate: 0.2 };
  const style = personality.style || 'unknown';
  
  return (
    <div className="bot-profile-card bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
      <div className="flex items-center mb-3">
        <div className="text-3xl mr-3">{bot.avatar}</div>
        <div>
          <h3 className="text-lg font-bold text-white">
            {bot.profileUrl ? (
              <Link href={bot.profileUrl}>
                <a className="hover:text-green-400 transition-colors">{bot.name}</a>
              </Link>
            ) : (
              bot.name
            )}
          </h3>
          <div className={`text-sm ${getStyleColor(style)}`}>
            {style.charAt(0).toUpperCase() + style.slice(1)} Player
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-400 mb-3">
        {getPersonalityDescription(style)}
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-500">Aggression</span>
            <span className="text-xs text-gray-300">{Math.round(personality.aggression * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-red-500 h-1.5 rounded-full" 
              style={{ width: `${personality.aggression * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-500">Bluff Rate</span>
            <span className="text-xs text-gray-300">{Math.round(personality.bluffRate * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full" 
              style={{ width: `${personality.bluffRate * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {bot.profileUrl && (
        <div className="mt-3 text-center">
          <Link href={bot.profileUrl}>
            <a className="text-xs text-green-400 hover:text-green-300 underline">
              View Full Profile
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default BotProfileCard;