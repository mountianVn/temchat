import type { User } from '@/types';

interface AvatarProps {
  user?: Partial<User>;
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: User['status'];
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const statusDotClasses = {
  online: 'bg-success',
  offline: 'bg-dark-textMuted',
  away: 'bg-warning',
  busy: 'bg-danger',
};

export default function Avatar({
  user,
  name,
  src,
  size = 'md',
  status,
  showStatus = false,
  className = '',
}: AvatarProps) {
  const displayName = name || user?.display_name || user?.username || '?';
  const imageSrc = src || user?.avatar;
  const userStatus = status || user?.status;

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorHues = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-yellow-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
  ];

  const colorIndex = displayName.charCodeAt(0) % colorHues.length;

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {imageSrc ? (
        <img
          src={imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`}
          alt={displayName}
          className={`${sizeClasses[size]} rounded-full object-cover bg-dark-surface`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${colorHues[colorIndex]} flex items-center justify-center font-semibold text-white overflow-hidden ${
          imageSrc ? 'hidden' : ''
        }`}
      >
        {initials}
      </div>
      {showStatus && userStatus && (
        <span
          className={`absolute bottom-0 right-0 ${size === 'xs' ? 'w-1.5 h-1.5' : 'w-3 h-3'} rounded-full border-2 border-white dark:border-dark-surface ${statusDotClasses[userStatus]}`}
        />
      )}
    </div>
  );
}
