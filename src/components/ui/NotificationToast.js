import React, { useState, useEffect } from 'react';

export default function NotificationToast({ message, type = 'info', duration = 5000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 300); // Allow animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600/90 border-green-500';
      case 'error':
        return 'bg-red-600/90 border-red-500';
      case 'warning':
        return 'bg-yellow-600/90 border-yellow-500';
      case 'win':
        return 'bg-yellow-600/90 border-yellow-400';
      default:
        return 'bg-blue-600/90 border-blue-500';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'win':
        return '🎉';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-md transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
    >
      <div className={`rounded-lg shadow-lg border px-4 py-3 ${getTypeStyles()}`}>
        <div className="flex items-center">
          <div className="text-2xl mr-3">{getIcon()}</div>
          <div className="flex-1 text-white">{message}</div>
          <button 
            onClick={() => {
              setVisible(false);
              if (onClose) setTimeout(onClose, 300);
            }}
            className="ml-4 text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}