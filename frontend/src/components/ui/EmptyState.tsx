import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ icon: Icon, title, description, action, size = 'md' }: EmptyStateProps) {
  const sizeMap = {
    sm: { wrap: 'py-10', iconBox: 'w-10 h-10', iconSize: 'w-5 h-5', title: 'text-base', desc: 'text-sm' },
    md: { wrap: 'py-16', iconBox: 'w-14 h-14', iconSize: 'w-6 h-6', title: 'text-lg', desc: 'text-sm' },
    lg: { wrap: 'py-24', iconBox: 'w-16 h-16', iconSize: 'w-7 h-7', title: 'text-xl', desc: 'text-base' },
  };
  const s = sizeMap[size];

  return (
    <div className={`flex flex-col items-center text-center ${s.wrap} px-4 animate-fade-in`}>
      <div
        className={`${s.iconBox} rounded-2xl flex items-center justify-center mb-5`}
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <Icon className={`${s.iconSize}`} style={{ color: 'var(--text-brand)' }} />
      </div>
      <h3 className={`font-semibold ${s.title} mb-2`} style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && (
        <p className={`${s.desc} max-w-sm leading-6`} style={{ color: 'var(--text-secondary)' }}>{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
