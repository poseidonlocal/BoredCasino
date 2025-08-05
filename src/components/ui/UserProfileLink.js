import React from 'react';
import Link from 'next/link';

export default function UserProfileLink({ 
  username, 
  displayName, 
  showAvatar = true, 
  avatarSize = 'md',
  className = '',
  onClick
}) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
    xl: 'w-12 h-12 text-xl'
  };

  const ProfileContent = () => (
    <div className={`flex items-center ${className}`}>
      {showAvatar && (
        <div className={`bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center font-bold text-white mr-2 ${sizeClasses[avatarSize]}`}>
          {username.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-white hover:text-yellow-400 transition-colors">
        {displayName || username}
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="text-left">
        <ProfileContent />
      </button>
    );
  }

  return (
    <Link href={`/profile/${username}`}>
      <ProfileContent />
    </Link>
  );
}