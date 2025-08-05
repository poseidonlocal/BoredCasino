import React from 'react';

const Logo = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
    '2xl': 'w-32 h-32 text-4xl'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center`}>
      {/* Circular border with glow effect */}
      <div className="absolute inset-0 rounded-full border-4 border-primary-500 bg-gradient-to-br from-primary-500/20 to-dark-800/40 shadow-lg shadow-primary-500/30 backdrop-blur-sm">
        {/* Inner glow ring */}
        <div className="absolute inset-1 rounded-full border-2 border-primary-500/50 bg-gradient-to-br from-primary-500/10 to-transparent"></div>
        
        {/* Outer glow effect */}
        <div className="absolute -inset-2 rounded-full bg-primary-500/20 blur-md opacity-60 animate-pulse"></div>
      </div>
      
      {/* Logo content */}
      <div className="relative z-10 flex items-center justify-center text-primary-500 font-bold">
        <span className="drop-shadow-lg">XB</span>
      </div>
      
      {/* Gaming controller icon overlay */}
      <div className="absolute bottom-0 right-0 text-primary-500/70 text-xs transform translate-x-1 translate-y-1">
        🎮
      </div>
    </div>
  );
};

export default Logo;