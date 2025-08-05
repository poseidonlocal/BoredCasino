// Updated CashContext.js with purchase support
// Copy this to casino-app/src/context/CashContext.js

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { useAuth } from './AuthContext';

const CashContext = createContext();

const INITIAL_CASH = 1000; // Starting cash amount

const cashReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CASH':
      return { ...state, amount: action.payload };
    case 'PLACE_BET':
      if (state.amount >= action.payload) {
        return { 
          ...state, 
          amount: state.amount - action.payload,
          currentBet: action.payload 
        };
      }
      return state;
    case 'WIN':
      return { 
        ...state, 
        amount: state.amount + action.payload,
        currentBet: 0 
      };
    case 'LOSE':
      return { 
        ...state, 
        currentBet: 0 
      };
    case 'DAILY_BONUS':
      return { 
        ...state, 
        amount: state.amount + action.payload
      };
    case 'PURCHASE_CHIPS':
      return { 
        ...state, 
        amount: state.amount + action.payload
      };
    default:
      return state;
  }
};

export const CashProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cashReducer, {
    amount: INITIAL_CASH,
    currentBet: 0
  });

  const { isAuthenticated, user, updateUserCash } = useAuth();

  // Sync cash with authenticated user's balance (only on initial load)
  useEffect(() => {
    if (isAuthenticated && user && user.cashBalance !== undefined) {
      // Only update if the user's cash balance is different from current state
      if (state.amount !== user.cashBalance) {
        dispatch({ type: 'SET_CASH', payload: user.cashBalance });
      }
    } else if (!isAuthenticated) {
      // For non-authenticated users, load from localStorage only once
      const savedCash = localStorage.getItem('casinoCash');
      if (savedCash && state.amount === INITIAL_CASH) {
        dispatch({ type: 'SET_CASH', payload: parseInt(savedCash) });
      }
    }
  }, [isAuthenticated, user?.id]); // Only depend on auth status and user ID, not the full user object

  // Save cash changes (with debouncing to prevent spam)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isAuthenticated && user) {
        // Only update if the amount is different from user's current balance
        if (state.amount !== user.cashBalance) {
          updateUserCash(state.amount);
        }
      } else if (!isAuthenticated) {
        // For non-authenticated users, save to localStorage
        localStorage.setItem('casinoCash', state.amount.toString());
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [state.amount, isAuthenticated, user?.id]); // Don't include updateUserCash or full user object

  const placeBet = (amount) => {
    dispatch({ type: 'PLACE_BET', payload: amount });
  };

  const win = (amount) => {
    dispatch({ type: 'WIN', payload: amount });
  };

  const lose = () => {
    dispatch({ type: 'LOSE' });
  };

  const claimDailyBonus = async () => {
    try {
      const response = await fetch('/api/user/daily-bonus', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'DAILY_BONUS', payload: data.bonusAmount });
        return { success: true, amount: data.bonusAmount };
      }
      return { success: false, error: 'Failed to claim bonus' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const purchaseChips = (amount) => {
    dispatch({ type: 'PURCHASE_CHIPS', payload: amount });
  };

  const canBet = (amount) => {
    return state.amount >= amount;
  };

  const value = {
    cash: state.amount,
    currentBet: state.currentBet,
    placeBet,
    win,
    lose,
    claimDailyBonus,
    purchaseChips,
    canBet
  };

  return (
    <CashContext.Provider value={value}>
      {children}
    </CashContext.Provider>
  );
};

export const useCash = () => {
  const context = useContext(CashContext);
  if (!context) {
    throw new Error('useCash must be used within a CashProvider');
  }
  return context;
};