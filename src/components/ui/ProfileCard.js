import React from 'react';
import Link from 'next/link';
import Badge from './Badge';

export default function ProfileCard({ 
  profile, 
  size = 'md', 
  showStats = true, 
  showBio = true,
  className = '' 
}) {
  const sizeClasses = {
    sm: {
      avatar: 'w-12 h-12 text-lg',
      title: 'text-lg',
      subtitle: 'text-sm',
      stats: 'text-sm'
    },
    md: {
      avatar: 'w-16 h-16 text-2xl',
      title: 'text-xl',
      subtitle: 'text-base',
      stats: 'text-base'
    },
    lg: {
      avatar: 'w-20 h-20 text-3xl',
      title: 'text-2xl',
      subtitle: 'text-lg',
      stats: 'text-lg'
    }
  };

  const getRankColor = (rank) => {
    if (rank <= 3) return 'success';
    if (rank <= 10) return 'warning';
    return 'info';
  };

  const classes = sizeClasses[size];

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 ${className}`}>
      <div className="text-center">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div className={`bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center font-bold text-white mx-auto ${classes.avatar}`}>
            {profile.username.charAt(0).toUpperCase()}
          </div>
          {profile.isOnline && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
          )}
        </div>

        {/* Username */}
        <Link href={`/profile/${profile.username}`}>
          <h3 className={`font-bold text-white hover:text-yellow-400 transition-colors cursor-pointer mb-2 ${classes.title}`}>
            {profile.username}
          </h3>
        </Link>

        {/* Badges */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge variant={getRankColor(profile.rank)} size="sm">
            #{profile.rank}
          </Badge>
          <Badge variant="primary" size="sm">
            Lv.{profile.level}
          </Badge>
          {profile.isVip && (
            <Badge variant="warning" size="sm">
              👑
            </Badge>
          )}
        </div>

        {/* Bio */}
        {showBio && profile.bio && (
          <p className={`text-gray-400 mb-4 line-clamp-2 ${classes.subtitle}`}>
            {profile.bio}
          </p>
        )}

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`font-bold text-green-400 ${classes.stats}`}>
                {profile.totalWinnings?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-gray-400">MSP Won</div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-blue-400 ${classes.stats}`}>
                {profile.gamesPlayed || 0}
              </div>
              <div className="text-xs text-gray-400">Games</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}