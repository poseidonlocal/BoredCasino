import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function TransactionHistory() {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactionHistory();
    }
  }, [isAuthenticated, currentPage]);

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/transaction-history?limit=20&offset=${currentPage * 20}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setStats(data.stats || {});
        setHasMore(data.pagination?.hasMore || false);
      } else {
        console.error('Failed to fetch transaction history');
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'game_bet':
        return '🎲';
      case 'game_win':
        return '🏆';
      case 'daily_bonus':
        return '🎁';
      case 'admin_adjustment':
        return '⚙️';
      case 'purchase':
        return '💳';
      case 'refund':
        return '↩️';
      default:
        return '📝';
    }
  };

  const getTransactionColor = (type, amount) => {
    if (amount > 0) {
      return 'text-green-400';
    } else {
      return 'text-red-400';
    }
  };

  const formatAmount = (amount) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${amount.toLocaleString()} MSP`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        <span className="ml-2 text-gray-300">Loading transaction history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Transaction History</h2>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Total Winnings</p>
              <p className="text-2xl font-bold text-green-400">{(stats.total_wins || 0).toLocaleString()} MSP</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <span className="text-2xl">🎲</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Total Bets</p>
              <p className="text-2xl font-bold text-red-400">{(stats.total_bets || 0).toLocaleString()} MSP</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <span className="text-2xl">🎁</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Total Bonuses</p>
              <p className="text-2xl font-bold text-yellow-400">{(stats.total_bonuses || 0).toLocaleString()} MSP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                    No transaction history found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTransactionIcon(transaction.transaction_type)}</span>
                        <span className={`text-sm font-medium ${getTransactionColor(transaction.transaction_type, transaction.amount)}`}>
                          {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatAmount(transaction.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div>{transaction.balance_before?.toLocaleString()} → {transaction.balance_after?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 max-w-xs truncate">
                        {transaction.description}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Showing {transactions.length} transactions
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-2 bg-gray-800 text-white rounded-lg">
            Page {currentPage + 1}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!hasMore}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}