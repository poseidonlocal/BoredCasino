import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function WithdrawalManagement() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch(`/api/admin/withdrawals?status=${filter}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async (withdrawalId, action) => {
    setActionLoading(true);
    
    try {
      const response = await fetch('/api/admin/withdrawal-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          withdrawalId,
          action,
          adminNotes
        })
      });

      if (response.ok) {
        alert(`Withdrawal ${action} successfully`);
        setSelectedWithdrawal(null);
        setAdminNotes('');
        fetchWithdrawals();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to process action');
      }
    } catch (error) {
      console.error('Error processing withdrawal action:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-400 bg-yellow-400/10',
      approved: 'text-blue-400 bg-blue-400/10',
      processed: 'text-green-400 bg-green-400/10',
      rejected: 'text-red-400 bg-red-400/10',
      cancelled: 'text-gray-400 bg-gray-400/10'
    };
    return colors[status] || 'text-gray-400 bg-gray-400/10';
  };

  const getMethodIcon = (method) => {
    const icons = {
      bank_transfer: '🏦',
      paypal: '🅿️',
      crypto: '₿',
      check: '📄'
    };
    return icons[method] || '💰';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Loading withdrawals..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Withdrawal Management</h2>
          <p className="text-gray-400">Review and process user withdrawal requests</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processed">Processed</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          
          <Button
            onClick={fetchWithdrawals}
            variant="secondary"
            size="sm"
            icon="🔄"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {withdrawals.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">💸</div>
              <p>No {filter !== 'all' ? filter : ''} withdrawals found</p>
            </div>
          </Card>
        ) : (
          withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getMethodIcon(withdrawal.method)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white">{withdrawal.username}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400">
                      {withdrawal.amount.toLocaleString()} MSP via {withdrawal.method.replace('_', ' ')}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {new Date(withdrawal.created_at).toLocaleString()} • ID: {withdrawal.transaction_id}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setSelectedWithdrawal(withdrawal)}
                    variant="secondary"
                    size="sm"
                  >
                    View Details
                  </Button>
                  
                  {withdrawal.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                        variant="success"
                        size="sm"
                        loading={actionLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                        variant="danger"
                        size="sm"
                        loading={actionLoading}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {withdrawal.status === 'approved' && (
                    <Button
                      onClick={() => handleWithdrawalAction(withdrawal.id, 'process')}
                      variant="primary"
                      size="sm"
                      loading={actionLoading}
                    >
                      Mark Processed
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Withdrawal Details Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Withdrawal Details</h3>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">User</label>
                  <p className="text-white">{selectedWithdrawal.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Amount</label>
                  <p className="text-white font-bold">{selectedWithdrawal.amount.toLocaleString()} MSP</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Method</label>
                  <p className="text-white">{selectedWithdrawal.method.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedWithdrawal.status)}`}>
                    {selectedWithdrawal.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Transaction ID</label>
                  <p className="text-white">{selectedWithdrawal.transaction_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Created</label>
                  <p className="text-white">{new Date(selectedWithdrawal.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Account Details</label>
                <div className="bg-gray-700 rounded-lg p-3">
                  <pre className="text-white text-sm whitespace-pre-wrap">{selectedWithdrawal.account_details}</pre>
                </div>
              </div>
              
              {selectedWithdrawal.admin_notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-white text-sm">{selectedWithdrawal.admin_notes}</p>
                  </div>
                </div>
              )}
              
              {selectedWithdrawal.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Add Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this withdrawal..."
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  onClick={() => setSelectedWithdrawal(null)}
                  variant="secondary"
                >
                  Close
                </Button>
                
                {selectedWithdrawal.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleWithdrawalAction(selectedWithdrawal.id, 'approve')}
                      variant="success"
                      loading={actionLoading}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleWithdrawalAction(selectedWithdrawal.id, 'reject')}
                      variant="danger"
                      loading={actionLoading}
                    >
                      Reject
                    </Button>
                  </>
                )}
                
                {selectedWithdrawal.status === 'approved' && (
                  <Button
                    onClick={() => handleWithdrawalAction(selectedWithdrawal.id, 'process')}
                    variant="primary"
                    loading={actionLoading}
                  >
                    Mark Processed
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}