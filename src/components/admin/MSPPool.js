import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

const MSPPool = () => {
  const [poolData, setPoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPoolData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/msp-pool', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPoolData(data);
        setError(null);
      } else {
        setError('Failed to fetch MSP pool data');
      }
    } catch (error) {
      console.error('Error fetching MSP pool:', error);
      setError('Error fetching MSP pool data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPoolData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-400">
          <p>{error}</p>
          <button 
            onClick={fetchPoolData}
            className="mt-2 btn-primary text-sm"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* MSP Pool Overview */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">MSP Pool Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="modern-card p-4 text-center">
            <div className="text-2xl font-bold text-primary-400">
              {poolData?.totalMSP?.toLocaleString() || 0}
            </div>
            <div className="text-gray-400 text-sm">Total MSP in Circulation</div>
          </div>
          <div className="modern-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-400">
              {poolData?.userCount || 0}
            </div>
            <div className="text-gray-400 text-sm">Active Users</div>
          </div>
          <div className="modern-card p-4 text-center">
            <div className="text-2xl font-bold text-success-400">
              {poolData?.averageMSP?.toLocaleString() || 0}
            </div>
            <div className="text-gray-400 text-sm">Average MSP per User</div>
          </div>
        </div>
      </Card>

      {/* Top 3 Users */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">Top 3 Users by MSP</h3>
        <div className="space-y-3">
          {poolData?.topUsers?.map((user, index) => (
            <div key={user.username} className="flex items-center justify-between p-3 modern-card">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  'bg-orange-600 text-white'
                }`}>
                  {index + 1}
                </div>
                <span className="text-white font-medium">{user.username}</span>
              </div>
              <div className="text-primary-400 font-bold">
                {user.balance.toLocaleString()} MSP
              </div>
            </div>
          )) || (
            <div className="text-gray-400 text-center py-4">
              No user data available
            </div>
          )}
        </div>
      </Card>

      {/* MSP Distribution */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">MSP Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="modern-card p-4 text-center">
            <div className="text-xl font-bold text-yellow-400">
              {poolData?.distribution?.whales || 0}
            </div>
            <div className="text-gray-400 text-sm">Whales</div>
            <div className="text-xs text-gray-500">10k+ MSP</div>
          </div>
          <div className="modern-card p-4 text-center">
            <div className="text-xl font-bold text-purple-400">
              {poolData?.distribution?.highRollers || 0}
            </div>
            <div className="text-gray-400 text-sm">High Rollers</div>
            <div className="text-xs text-gray-500">5k-10k MSP</div>
          </div>
          <div className="modern-card p-4 text-center">
            <div className="text-xl font-bold text-blue-400">
              {poolData?.distribution?.regularPlayers || 0}
            </div>
            <div className="text-gray-400 text-sm">Regular Players</div>
            <div className="text-xs text-gray-500">1k-5k MSP</div>
          </div>
          <div className="modern-card p-4 text-center">
            <div className="text-xl font-bold text-gray-400">
              {poolData?.distribution?.lowBalance || 0}
            </div>
            <div className="text-gray-400 text-sm">Low Balance</div>
            <div className="text-xs text-gray-500">&lt;1k MSP</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MSPPool;