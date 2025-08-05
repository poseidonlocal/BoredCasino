import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DailyBonusPopup = () => {
  const { user, isAuthenticated, checkAuthStatus } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(100);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkDailyBonusEligibility();
    }
  }, [isAuthenticated, user]);

  const checkDailyBonusEligibility = async () => {
    try {
      // Check if we've already shown the popup today for this session
      const today = new Date().toISOString().split('T')[0];
      const sessionKey = `daily_bonus_popup_shown_${user.id}_${today}`;
      
      if (sessionStorage.getItem(sessionKey)) {
        return; // Already shown today
      }

      const response = await fetch('/api/user/daily-bonus-popup', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCanClaim(data.canClaim);
        setBonusAmount(data.bonusAmount);
        
        if (data.shouldShowPopup) {
          setShowPopup(true);
          // Mark as shown for this session
          sessionStorage.setItem(sessionKey, 'true');
        }
      }
    } catch (error) {
      console.error('Error checking daily bonus eligibility:', error);
    }
  };

  const claimDailyBonus = async () => {
    setIsClaimingBonus(true);
    try {
      const response = await fetch('/api/user/claim-daily-bonus', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setShowPopup(false);
        setCanClaim(false);
        
        // Refresh user data to update balance
        await checkAuthStatus();
        
        // Show success message
        showSuccessMessage(data.bonusAmount);
      } else {
        const errorData = await response.json();
        console.error('Failed to claim bonus:', errorData.message);
      }
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
    } finally {
      setIsClaimingBonus(false);
    }
  };

  const showSuccessMessage = (amount) => {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="text-2xl mr-2">🎉</span>
        <div>
          <div class="font-bold">Daily Bonus Claimed!</div>
          <div class="text-sm">+${amount} MSP added to your balance</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  if (!showPopup || !canClaim) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-4 relative animate-scale-in">
        {/* Close button */}
        <button
          onClick={closePopup}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ×
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎁</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Daily Bonus Available!</h2>
          <p className="text-gray-300 mb-6">
            Welcome back! Claim your daily bonus to boost your Microsoft Points balance.
          </p>
          
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="text-3xl font-bold text-yellow-400 mb-1">
              +{bonusAmount} MSP
            </div>
            <div className="text-sm text-gray-400">
              Daily Bonus Reward
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={closePopup}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={claimDailyBonus}
              disabled={isClaimingBonus}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isClaimingBonus ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Claiming...
                </div>
              ) : (
                'Claim Bonus'
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DailyBonusPopup;