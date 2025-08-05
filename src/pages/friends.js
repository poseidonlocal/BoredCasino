import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { calculateLevel } from '../lib/xpSystem';

const FriendsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Load real data from API
  useEffect(() => {
    if (isAuthenticated) {
      loadFriends();
      loadFriendRequests();
    }
  }, [isAuthenticated]);

  const loadFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const friendsData = await response.json();
        setFriends(friendsData.map(friend => ({
          ...friend,
          avatar: getRandomAvatar(),
          currentGame: friend.status === 'online' ? getRandomGame() : null
        })));
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await fetch('/api/friends/requests');
      if (response.ok) {
        const requestsData = await response.json();
        setFriendRequests(requestsData.map(request => ({
          ...request,
          avatar: getRandomAvatar()
        })));
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const getRandomAvatar = () => {
    const avatars = ['🎮', '🔧', '⚡', '🎯', '🆕', '🎰', '🎲', '🃏', '📦', '🏆'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const getRandomGame = () => {
    const games = ['Roulette', 'Slots', 'Poker', 'Case Opening', 'Coinflip'];
    return Math.random() > 0.5 ? games[Math.floor(Math.random() * games.length)] : null;
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const response = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results.map(result => ({
            ...result,
            avatar: getRandomAvatar()
          })));
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const sendFriendRequest = async (userId) => {
    const targetUser = searchResults.find(u => u.id === userId);
    if (!targetUser) return;

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUsername: targetUser.username })
      });

      if (response.ok) {
        alert('Friend request sent successfully!');
        // Remove from search results
        setSearchResults(prev => prev.filter(u => u.id !== userId));
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'accept' })
      });

      if (response.ok) {
        loadFriends();
        loadFriendRequests();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject' })
      });

      if (response.ok) {
        loadFriendRequests();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to reject friend request');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request');
    }
  };

  const getStatusColor = (status) => {
    return status === 'online' ? 'text-green-400' : 'text-gray-400';
  };

  const getStatusDot = (status) => {
    return status === 'online' ? 'bg-green-400' : 'bg-gray-400';
  };

  const formatLastSeen = (lastSeen) => {
    const now = new Date();
    const diff = now - lastSeen;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Friends</h1>
            <p className="text-gray-400 mb-8">Please log in to view your friends</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Friends & Social
            </span>
          </h1>
          <p className="text-gray-300 text-xl">Connect with other players and build your gaming network</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 rounded-xl p-1 border border-gray-700/50">
            {[
              { id: 'friends', label: 'Friends', count: friends.length },
              { id: 'requests', label: 'Requests', count: friendRequests.length },
              { id: 'search', label: 'Find Players', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Your Friends ({friends.length})</h2>
              {friends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No friends yet</h3>
                  <p className="text-gray-400 mb-6">Start building your gaming network by finding and adding players</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Find Players
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {friends.map((friend) => (
                    <div key={friend.id} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30 hover:border-blue-500/50 transition-all duration-200">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                            {friend.avatar}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusDot(friend.status)} rounded-full border-2 border-gray-800`}></div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{friend.username}</h3>
                          <p className="text-sm text-gray-400">Level {friend.level}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={`font-medium ${getStatusColor(friend.status)}`}>
                            {friend.status === 'online' ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        
                        {friend.currentGame && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Playing:</span>
                            <span className="text-blue-400 font-medium">{friend.currentGame}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last seen:</span>
                          <span className="text-gray-300">{formatLastSeen(friend.lastSeen)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                          Message
                        </button>
                        <button className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                          Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friend Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Friend Requests ({friendRequests.length})</h2>
              {friendRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📬</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No pending requests</h3>
                  <p className="text-gray-400">You'll see friend requests here when other players want to connect</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                            {request.avatar}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{request.username}</h3>
                            <p className="text-sm text-gray-400">Level {request.level} • Sent {formatLastSeen(request.sentAt)}</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => acceptFriendRequest(request.requestId)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectFriendRequest(request.requestId)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Find Players</h2>
              
              {/* Search Input */}
              <div className="mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for players by username..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Search Results */}
              {searchQuery.length > 2 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No players found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchResults.map((player) => (
                        <div key={player.id} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                                {player.avatar}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">{player.username}</h3>
                                <p className="text-sm text-gray-400">Level {player.level} • {player.totalXP.toLocaleString()} XP</p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => sendFriendRequest(player.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                              Add Friend
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {searchQuery.length <= 2 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Search for Players</h3>
                  <p className="text-gray-400">Enter at least 3 characters to search for other players</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FriendsPage;