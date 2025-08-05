import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onClose }) => {
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-600/90 border-green-500 text-white';
      case 'error':
        return 'bg-red-600/90 border-red-500 text-white';
      case 'warning':
        return 'bg-yellow-600/90 border-yellow-500 text-white';
      case 'win':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 border-yellow-400 text-gray-900';
      default:
        return 'bg-blue-600/90 border-blue-500 text-white';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
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
    <div className={`max-w-md rounded-lg shadow-lg border px-4 py-3 backdrop-blur-sm animate-slide-in ${getTypeStyles()}`}>
      <div className="flex items-center">
        <div className="text-2xl mr-3">{getIcon()}</div>
        <div className="flex-1">
          {notification.title && (
            <div className="font-semibold">{notification.title}</div>
          )}
          <div className={notification.title ? 'text-sm opacity-90' : ''}>
            {notification.message}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
};