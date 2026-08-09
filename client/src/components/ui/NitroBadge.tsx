import React from 'react';
import clsx from 'clsx';
import type { NitroTier } from '../../store/useNitroStore';

interface NitroBadgeProps {
  tier: NitroTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const NitroBadge: React.FC<NitroBadgeProps> = ({ tier, size = 'sm', showLabel = false, className }) => {
  if (!tier) return null;

  const isNitro = tier === 'nitro';

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-1 gap-1',
    lg: 'text-sm px-3 py-1.5 gap-1.5',
  };

  const iconSize = { sm: 10, md: 12, lg: 14 }[size];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-black border select-none shrink-0',
        sizeClasses[size],
        isNitro
          ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-300'
          : 'bg-purple-500/15 border-purple-500/40 text-purple-300',
        className
      )}
      title={isNitro ? 'ProChat Nitro Subscriber' : 'ProChat Nitro Classic Subscriber'}
    >
      <span>{isNitro ? '🌟' : '⚡'}</span>
      {showLabel && (
        <span>{isNitro ? 'Nitro' : 'Classic'}</span>
      )}
    </span>
  );
};

export default NitroBadge;
