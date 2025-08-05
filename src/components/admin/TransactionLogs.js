import React, { useState, useEffect } from 'react';

export default function TransactionLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchTransactionLogs();
  }, [filter, currentPage]);

  const fetchTransactionLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/transaction-logs?limit=50&offset=${currentPage * 50}&type=${filter === 'all' ? '' : filter}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setStats(data.stats || {});
        setHasMore(data.pagination?.hasMore || false);
      } else {
        console.error('Failed to fetch transaction logs');
      }
    } catch (error) {
      console.error('Error fetching transaction logs:', error);
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
      return 'text-green-400 bg-green-400/10';
    } else {
      return 'text-red-400 bg-red-400/10';
    }
  };

  const formatAmount = (amount) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${amount.toLocaleString()} MSP`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getGameTypeColor = (gameType) => {
    switch (gameType) {
      case 'roulette':
        return 'bg-red-500/20 text-red-300';
      case 'slots':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'texas_holdem':
        return 'bg-blue-500/20 text-blue-300';
      case 'coinflip':
        return 'bg-yellow-500/20 text-yellow-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        <span className="ml-2 text-gray-300">Loading transaction logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Transaction Logs</h2>
        <button
          onClick={() => {
            setCurrentPage(0);
            fetchTransactionLogs();
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Total Transactions</p>
              <p className="text-2xl font-bold text-white">{stats.total_transactions || 0}</p>
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
            <div className="p-2 bg-green-500/20 rounded-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Total Wins</p>
              <p className="text-2xl font-bold text-green-400">{(stats.total_wins || 0).toLocaleString()} MSP</p>
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

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'all', name: 'All Transactions', icon: '📋' },
          { id: 'game_bet', name: 'Game Bets', icon: '🎲' },
          { id: 'game_win', name: 'Game Wins', icon: '🏆' },
          { id: 'daily_bonus', name: 'Daily Bonuses', icon: '🎁' },
          { id: 'admin_adjustment', name: 'Admin Actions', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setFilter(tab.id);
              setCurrentPage(0);
            }}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.id
                ? 'bg-yellow-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Transaction Logs Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Game
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
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                    No transaction logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTransactionIcon(log.transaction_type)}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionColor(log.transaction_type, log.amount)}`}>
                          {log.transaction_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{log.username || 'Unknown'}</div>
                      <div className="text-sm text-gray-400">ID: {log.user_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${log.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatAmount(log.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.game_type ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGameTypeColor(log.game_type)}`}>
                          {log.game_type.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div>{log.balance_before?.toLocaleString()} → {log.balance_after?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 max-w-xs">
                        <div className="truncate">{log.description}</div>
                        {log.game_data && (
                          <div className="text-xs text-gray-500 mt-1">
                            {JSON.stringify(JSON.parse(log.game_data)).substring(0, 50)}...
                          </div>
                        )}
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
          Showing {logs.length} transactions
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