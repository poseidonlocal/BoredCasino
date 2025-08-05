import React from 'react';
import { useAuth } from '../context/AuthContext';

const CashDisplay = () => {
  const { user, isAuthenticated } = useAuth();

  const formatMSP = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' MSP';
  };

  const balance = user?.cashBalance || 0;

  return (
    <div className="glow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-success-500 to-success-400 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Your Balance</h2>
            <div className="text-3xl font-bold bg-gradient-to-r from-success-400 to-success-300 bg-clip-text text-transparent">
              {formatMSP(balance)}
            </div>
          </div>
        </div>
      </div>
      
      {balance <= 0 && (
        <div className="mt-4 p-4 bg-danger-500/10 border border-danger-500/30 rounded-lg text-center">
          <div className="text-danger-400 font-bold mb-1">You're out of Microsoft Points!</div>
          <div className="text-danger-300 text-sm">Come back tomorrow for your daily bonus or visit the shop!</div>
        </div>
      )}
    </div>
  );
};

export default CashDisplay;