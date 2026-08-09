import React from 'react';
import clsx from 'clsx';

interface DiscordNotificationBadgeProps {
  count: number | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'red' | 'yellow' | 'mention';
}

export const DiscordNotificationBadge: React.FC<DiscordNotificationBadgeProps> = ({
  count,
  className,
  size = 'md',
  variant = 'red',
}) => {
  if (!count || count === 0) return null;

  const displayCount = typeof count === 'number' && count > 9 ? '9+' : count;

  return (
    <div
      className={clsx(
        "rounded-full font-black flex items-center justify-center border-2 border-[#08090B] shadow-lg animate-scale-up tracking-tighter shrink-0 select-none",
        variant === 'red' && "bg-[#F23F43] text-white",
        variant === 'yellow' && "bg-[#FACC15] text-black font-black",
        variant === 'mention' && "bg-[#5865F2] text-white",
        size === 'sm' && "min-w-[16px] h-4 px-1 text-[10px]",
        size === 'md' && "min-w-[20px] h-5 px-1.5 text-[11px]",
        size === 'lg' && "min-w-[24px] h-6 px-2 text-xs",
        className
      )}
    >
      {displayCount}
    </div>
  );
};

export default DiscordNotificationBadge;
