import React from 'react';

interface AvatarProps {
  src: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt = 'Avatar', 
  size = 'md',
  className = '' 
}) => {
  const sizeClass = sizeClasses[size];
  
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          // Fallback to default avatar if image fails to load
          (e.target as HTMLImageElement).src = '/default-avatar.svg';
        }}
      />
    </div>
  );
};

export default Avatar;
