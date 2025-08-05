import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import ProfileCard from '../components/ui/ProfileCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

export default function PublicProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rank');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, [sortBy, searchTerm]);

  const fetchProfiles = async (page = 0) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profiles?page=${page}&sort=${sortBy}&search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        if (page === 0) {
          setProfiles(data.profiles);
        } else {
          setProfiles(prev => [...prev, ...data.profiles]);
        }
        setHasMore(data.hasMore);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchProfiles(currentPage + 1);
  };

  const getRankColor = (rank) => {
    if (rank <= 3) return 'success';
    if (rank <= 10) return 'warning';
    return 'info';
  };

  const getOnlineStatus = (isOnline) => {
    return isOnline ? 'Online' : 'Offline';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-4">
            👥 Player Profiles
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover and connect with other BoredCasino players
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="rank">Sort by Rank</option>
                <option value="winnings">Sort by Winnings</option>
                <option value="games">Sort by Games Played</option>
                <option value="recent">Recently Active</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Profiles Grid */}
        {loading && profiles.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading profiles..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {profiles.map((profile, index) => (
                <ProfileCard 
                  key={profile.username} 
                  profile={profile}
                  size="lg"
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <Button
                  onClick={handleLoadMore}
                  loading={loading}
                  variant="primary"
                  size="lg"
                >
                  Load More Profiles
                </Button>
              </div>
            )}

            {profiles.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">No Profiles Found</h3>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search terms' : 'No public profiles available'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}