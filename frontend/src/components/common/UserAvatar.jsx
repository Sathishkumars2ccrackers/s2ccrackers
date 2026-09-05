import React, { useState } from 'react';

/**
 * Extract 1-2 letter initials from a name string
 */
export const getInitials = (name = '') => {
  if (!name || typeof name !== 'string') return 'S2';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S2';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserAvatar = ({
  user,
  profile,
  name,
  photoURL,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const effectiveName = name || profile?.name || user?.displayName || 'Customer';
  const effectivePhoto = !imgError ? (photoURL || profile?.photoURL || user?.photoURL) : null;
  const initials = getInitials(effectiveName);

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-bold',
    lg: 'w-14 h-14 text-lg font-black',
    xl: 'w-20 h-20 text-2xl font-black',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  if (effectivePhoto) {
    return (
      <img
        src={effectivePhoto}
        alt={effectiveName}
        onError={() => setImgError(true)}
        className={`${selectedSize} rounded-full object-cover border border-amber-500/40 shadow-md ${className}`}
      />
    );
  }

  return (
    <div
      className={`${selectedSize} rounded-full bg-gradient-to-tr from-amber-600 via-orange-600 to-red-600 text-white flex items-center justify-center font-bold tracking-wider shadow-md border border-amber-400/40 select-none ${className}`}
      title={effectiveName}
    >
      <span>{initials}</span>
    </div>
  );
};

export default UserAvatar;
