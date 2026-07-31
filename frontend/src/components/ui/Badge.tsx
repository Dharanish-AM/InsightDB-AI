import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'blue' | 'cyan' | 'green' | 'yellow' | 'red' | 'gray';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'gray', size = 'md', children, icon, className }: BadgeProps) {
  return (
    <span className={clsx('badge', `badge-${variant}`, size === 'sm' && 'text-[10px] px-1.5 py-0.5', className)}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
