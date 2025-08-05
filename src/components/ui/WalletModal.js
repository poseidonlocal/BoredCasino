import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import Badge from './Badge';

export default function WalletModal({ isOpen, onClose }) {
  const { user, updateUserCash } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchTransactionHistory();
    }
  }, [isOpen, activeTab]);

  const fetchTransactionHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/transaction-history', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }

    try {
      const newBalance = (user?.cashBalance || 0) + amount;
      await updateUserCash(newBalance);
      
      // Log the deposit transaction
      await fetch('/api/logging/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'deposit',
          amount: amount,
          description: `Deposit of ${amount} MSP`
        })
      });

      setDepositAmount('');
      setShowDepositForm(false);
      alert(`Successfully deposited ${amount} MSP!`);
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Deposit failed. Please try again.');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const currentBalance = user?.cashBalance || 0;
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid withdrawal amount');
      return;
    }

    if (amount > currentBalance) {
      alert('Insufficient balance for withdrawal');
      return;
    }

    try {
      const newBalance = currentBalance - amount;
      await updateUserCash(newBalance);
      
      // Log the withdrawal transaction
      await fetch('/api/logging/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'withdrawal',
          amount: -amount,
          description: `Withdrawal of ${amount} MSP`
        })
      });

      setWithdrawAmount('');
      setShowWithdrawForm(false);
      alert(`Successfully withdrew ${amount} MSP!`);
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Withdrawal failed. Please try again.');
    }
  };

  const formatTransactionType = (type) => {
    const types = {
      'game_win': { label: 'Game Win', color: 'success', icon: '🎉' },
      'game_loss': { label: 'Game Loss', color: 'danger', icon: '😔' },
      'daily_bonus': { label: 'Daily Bonus', color: 'warning', icon: '🎁' },
      'deposit': { label: 'Deposit', color: 'success', icon: '💳' },
      'withdrawal': { label: 'Withdrawal', color: 'info', icon: '🏦' },
      'admin_adjustment': { label: 'Admin Adjustment', color: 'secondary', icon: '⚙️' }
    };
    return types[type] || { label: type, color: 'secondary', icon: '📝' };
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">💳</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Wallet</h2>
              <p className="text-sm text-gray-400">Manage your MSP balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'deposit', label: 'Deposit', icon: '💰' },
            { id: 'withdraw', label: 'Withdraw', icon: '🏦' },
            { id: 'history', label: 'History', icon: '📜' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-red-400 border-b-2 border-red-400 bg-red-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Balance Display */}
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {(user?.cashBalance || 0).toLocaleString()} MSP
                </div>
                <p className="text-gray-400">Current Balance</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setActiveTab('deposit')}
                  variant="success"
                  icon="💰"
                  fullWidth
                >
                  Deposit MSP
                </Button>
                <Button
                  onClick={() => setActiveTab('withdraw')}
                  variant="info"
                  icon="🏦"
                  fullWidth
                >
                  Withdraw MSP
                </Button>
              </div>

              {/* Links to dedicated pages */}
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Or use our dedicated pages:</p>
                <div className="flex justify-center space-x-4">
                  <a 
                    href="/deposit" 
                    className="text-red-400 hover:text-red-300 text-sm underline"
                    onClick={() => onClose()}
                  >
                    💰 Full Deposit Page
                  </a>
                  <a 
                    href="/withdraw" 
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                    onClick={() => onClose()}
                  >
                    💸 Full Withdraw Page
                  </a>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {user?.totalWinnings?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-400">Total Winnings</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {user?.gamesPlayed || '0'}
                  </div>
                  <div className="text-sm text-gray-400">Games Played</div>
                </div>
              </div>
            </div>
          )}

          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Deposit MSP</h3>
                <p className="text-gray-400">Add funds to your casino account</p>
              </div>

              <div className="space-y-4">
                {/* Quick Deposit Amounts */}
                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 5000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deposit Amount (MSP)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    min="1"
                  />
                </div>

                <Button
                  onClick={handleDeposit}
                  variant="success"
                  fullWidth
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                >
                  Deposit {depositAmount ? `${parseFloat(depositAmount).toLocaleString()} MSP` : 'MSP'}
                </Button>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-400 text-lg">ℹ️</span>
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Demo Mode</p>
                      <p>This is a demo casino. Deposits are simulated and no real money is involved.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Tab */}
          {activeTab === 'withdraw' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Withdraw MSP</h3>
                <p className="text-gray-400">Withdraw funds from your account</p>
              </div>

              <div className="space-y-4">
                {/* Available Balance */}
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-white">
                    Available: {(user?.cashBalance || 0).toLocaleString()} MSP
                  </div>
                </div>

                {/* Quick Withdraw Amounts */}
                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, Math.floor((user?.cashBalance || 0) / 2)].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setWithdrawAmount(amount.toString())}
                      disabled={amount > (user?.cashBalance || 0) || amount <= 0}
                      className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      {amount > 0 ? amount.toLocaleString() : 'Half'}
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Withdrawal Amount (MSP)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    min="1"
                    max={user?.cashBalance || 0}
                  />
                </div>

                <Button
                  onClick={handleWithdraw}
                  variant="info"
                  fullWidth
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > (user?.cashBalance || 0)}
                >
                  Withdraw {withdrawAmount ? `${parseFloat(withdrawAmount).toLocaleString()} MSP` : 'MSP'}
                </Button>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-yellow-400 text-lg">⚠️</span>
                    <div className="text-sm text-yellow-300">
                      <p className="font-medium mb-1">Withdrawal Policy</p>
                      <p>Withdrawals are processed instantly in demo mode. Minimum withdrawal: 1 MSP.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Transaction History</h3>
                <Button
                  onClick={fetchTransactionHistory}
                  variant="secondary"
                  size="sm"
                  icon="🔄"
                >
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner text="Loading transactions..." />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {transactions.map((transaction, index) => {
                    const typeInfo = formatTransactionType(transaction.transaction_type);
                    return (
                      <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{typeInfo.icon}</span>
                          <div>
                            <div className="text-white font-medium">{typeInfo.label}</div>
                            <div className="text-sm text-gray-400">
                              {getTimeAgo(transaction.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} MSP
                          </div>
                          <Badge variant={typeInfo.color} size="xs">
                            {transaction.game_type || 'System'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📝</div>
                  <p>No transactions found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}