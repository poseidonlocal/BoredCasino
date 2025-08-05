import React, { useState, useEffect } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users); // Correctly set the users array from the response
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action, value = null) => {
    try {
      const response = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          action,
          value
        }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the user list
        setShowUserModal(false);
      }
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') return matchesSearch && user.is_active && !user.is_banned;
    if (filterStatus === 'banned') return matchesSearch && user.is_banned;
    if (filterStatus === 'admin') return matchesSearch && user.is_admin;
    
    return matchesSearch;
  });

  const getUserStatusBadge = (user) => {
    if (user.is_banned) return <span className="px-2 py-1 text-xs bg-danger-500/20 text-danger-400 rounded-full">Banned</span>;
    if (user.is_admin) return <span className="px-2 py-1 text-xs bg-accent-500/20 text-accent-400 rounded-full">Admin</span>;
    if (user.is_active) return <span className="px-2 py-1 text-xs bg-success-500/20 text-success-400 rounded-full">Active</span>;
    return <span className="px-2 py-1 text-xs bg-dark-600 text-dark-400 rounded-full">Inactive</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="flex gap-2">
          <button className="btn-primary text-sm px-4 py-2">
            Export Users
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="modern-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Search Users</label>
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="modern-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="modern-input w-full"
            >
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
              <option value="banned">Banned Users</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="btn-secondary text-sm px-4 py-2 w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="modern-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">Games Played</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-dark-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{user.username}</div>
                        <div className="text-sm text-dark-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getUserStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {user.cash_balance?.toLocaleString() || '0'} MSP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {user.games_played || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="text-primary-400 hover:text-primary-300 mr-3"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-dark-400 text-lg">No users found</div>
            <div className="text-dark-500 text-sm mt-1">Try adjusting your search or filter criteria</div>
          </div>
        )}
      </div>

      {/* User Management Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glow-card max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Manage User</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-dark-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-white font-semibold">{selectedUser.username}</div>
                  <div className="text-dark-400 text-sm">{selectedUser.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Balance</label>
                  <input
                    type="number"
                    defaultValue={selectedUser.cash_balance}
                    className="modern-input w-full"
                    id="userBalance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Status</label>
                  {getUserStatusBadge(selectedUser)}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    const newBalance = document.getElementById('userBalance').value;
                    handleUserAction(selectedUser.id, 'updateBalance', parseFloat(newBalance));
                  }}
                  className="btn-primary w-full"
                >
                  Update Balance
                </button>

                {!selectedUser.is_banned ? (
                  <button
                    onClick={() => handleUserAction(selectedUser.id, 'ban')}
                    className="btn-danger w-full"
                  >
                    Ban User
                  </button>
                ) : (
                  <button
                    onClick={() => handleUserAction(selectedUser.id, 'unban')}
                    className="btn-success w-full"
                  >
                    Unban User
                  </button>
                )}

                {!selectedUser.is_admin && (
                  <button
                    onClick={() => handleUserAction(selectedUser.id, 'makeAdmin')}
                    className="btn-accent w-full"
                  >
                    Make Admin
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;