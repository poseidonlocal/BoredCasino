import React, { useState, useEffect } from 'react';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    }
  };

  const getAnnouncementStyles = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'success':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      default:
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  if (!announcements.length || !visible) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className={`relative rounded-lg p-4 border ${getAnnouncementStyles(announcement.type)}`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-xl">{getIcon(announcement.type)}</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-white">{announcement.title}</h3>
              <div className="text-sm text-gray-300 mt-1">
                <p>{announcement.message}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default Announcements;