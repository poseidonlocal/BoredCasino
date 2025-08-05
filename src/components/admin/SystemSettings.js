import React, { useState, useEffect } from 'react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    fetchSettings();
    fetchAnnouncements();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const updateSetting = async (key, value) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ key, value }),
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, [key]: value }));
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    } finally {
      setSaving(false);
    }
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) return;

    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newAnnouncement),
      });

      if (response.ok) {
        setNewAnnouncement({ title: '', message: '', type: 'info' });
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const toggleAnnouncement = async (id, isActive) => {
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, isActive: !isActive }),
      });

      if (response.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };
  
  const deleteAnnouncement = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const response = await fetch('/api/admin/announcements', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          fetchAnnouncements();
        }
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-casino-gold text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Configuration */}
      <div className="casino-card">
        <h2 className="text-2xl font-bold text-casino-gold mb-6">System Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Casino Name
            </label>
            <input
              type="text"
              value={settings.casino_name || ''}
              onChange={(e) => updateSetting('casino_name', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-casino-gold"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Daily Bonus Amount ($)
            </label>
            <input
              type="number"
              value={settings.daily_bonus_amount || 100}
              onChange={(e) => updateSetting('daily_bonus_amount', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-casino-gold"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Maximum Bet Amount ($)
            </label>
            <input
              type="number"
              value={settings.max_bet_amount || 1000}
              onChange={(e) => updateSetting('max_bet_amount', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-casino-gold"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Minimum Bet Amount ($)
            </label>
            <input
              type="number"
              value={settings.min_bet_amount || 1}
              onChange={(e) => updateSetting('min_bet_amount', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-casino-gold"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Welcome Bonus ($)
            </label>
            <input
              type="number"
              value={settings.welcome_bonus || 1000}
              onChange={(e) => updateSetting('welcome_bonus', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-casino-gold"
            />
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Maintenance Mode</span>
            <button
              onClick={() => updateSetting('maintenance_mode', settings.maintenance_mode === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.maintenance_mode === 'true' ? 'bg-red-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.maintenance_mode === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-300">Registration Enabled</span>
            <button
              onClick={() => updateSetting('registration_enabled', settings.registration_enabled === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.registration_enabled === 'true' ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.registration_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="casino-card">
        <h2 className="text-2xl font-bold text-casino-gold mb-6">System Announcements</h2>
        
        {/* Create New Announcement */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Create New Announcement</h3>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Announcement title..."
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-casino-gold"
              />
            </div>
            <div>
              <textarea
                placeholder="Announcement message..."
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                rows="3"
                className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-casino-gold"
              />
            </div>
            <div className="flex justify-between items-center">
              <select
                value={newAnnouncement.type}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-casino-gold"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
              <button
                onClick={createAnnouncement}
                className="bg-casino-gold hover:bg-yellow-400 text-casino-dark font-bold py-2 px-4 rounded transition-colors duration-200"
              >
                Create Announcement
              </button>
            </div>
          </div>
        </div>

        {/* Existing Announcements */}
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="text-white font-bold mr-2">{announcement.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      announcement.type === 'info' ? 'bg-blue-600' :
                      announcement.type === 'warning' ? 'bg-yellow-600' :
                      announcement.type === 'success' ? 'bg-green-600' :
                      'bg-red-600'
                    } text-white`}>
                      {announcement.type}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2">{announcement.message}</p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(announcement.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleAnnouncement(announcement.id, announcement.is_active)}
                    className={`px-3 py-1 rounded text-sm font-bold transition-colors duration-200 ${
                      announcement.is_active
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-white'
                    }`}
                  >
                    {announcement.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;