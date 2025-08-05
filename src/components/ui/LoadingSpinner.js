import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  text = '', 
  color = 'purple',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const colorClasses = {
    purple: 'border-purple-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Modern spinning loader */}
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-gray-700 rounded-full animate-spin`}>
          <div className={`absolute inset-0 border-4 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}></div>
        </div>
        
        {/* Inner glow effect */}
        <div className={`absolute inset-2 ${sizeClasses[size]} border-2 border-gray-600 rounded-full opacity-30`}></div>
      </div>

      {/* Loading text */}
      {text && (
        <div className="text-center">
          <p className="text-gray-300 font-medium animate-pulse">
            {text}
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;