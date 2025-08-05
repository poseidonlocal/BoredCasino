import React from 'react';

const Card = ({
  children,
  variant = 'default',
  hover = true,
  glow = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'relative overflow-hidden rounded-2xl p-6 shadow-2xl transition-all duration-300';
  
  const variantClasses = {
    default: 'modern-card',
    glow: 'glow-card',
    game: 'game-card',
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10',
    gradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20'
  };

  const hoverClasses = hover ? 'hover:transform hover:-translate-y-2' : '';
  const glowClasses = glow ? 'glow-pulse' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${glowClasses} ${className}`}
      {...props}
    >
      {/* Animated border gradient */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </div>
    </div>
  );
};

export default Card;