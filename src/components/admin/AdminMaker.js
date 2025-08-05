import React, { useState } from 'react';
import Card from '../ui/Card';

const AdminMaker = () => {
  const [username, setUsername] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const makeAdmin = async () => {
    if (!username || !adminKey) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, adminKey })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setUsername('');
        setAdminKey('');
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/migrate-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migrationKey: 'fix-database-2024' })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Admin Tools</h2>
        
        {/* Make Admin Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Make User Admin</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="modern-input w-full"
                placeholder="Enter username to make admin"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Admin Key</label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="modern-input w-full"
                placeholder="Enter: make-me-admin-2024"
              />
            </div>
            <button
              onClick={makeAdmin}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Processing...' : 'Make Admin'}
            </button>
          </div>
        </div>

        {/* Migration Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Database Migration</h3>
          <p className="text-gray-300 mb-4">
            Run this to fix missing database columns and tables.
          </p>
          <button
            onClick={runMigration}
            disabled={loading}
            className="btn-accent w-full"
          >
            {loading ? 'Running Migration...' : 'Fix Database Schema'}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <p className="text-white">{message}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
          <h4 className="text-blue-400 font-bold mb-2">Instructions:</h4>
          <ol className="text-gray-300 text-sm space-y-1">
            <li>1. First, register a user account if you haven't already</li>
            <li>2. Use the "Make User Admin" section with admin key: <code className="bg-gray-800 px-1 rounded">make-me-admin-2024</code></li>
            <li>3. Run the database migration to fix any schema issues</li>
            <li>4. Refresh the page and you should have admin access</li>
          </ol>
        </div>
      </Card>
    </div>
  );
};

export default AdminMaker;