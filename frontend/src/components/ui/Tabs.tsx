import React from 'react';
import { clsx } from 'clsx';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs({ tabs, activeTab, onChange, className, size = 'md' }: TabsProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-0.5 rounded-xl border p-1',
        className
      )}
      style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)' }}
      role="tablist"
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'flex items-center gap-1.5 rounded-lg font-medium transition-all duration-150',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
            activeTab === tab.id
              ? 'shadow-sm'
              : 'hover:text-[var(--text-primary)]'
          )}
          style={activeTab === tab.id
            ? { background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }
            : { color: 'var(--text-secondary)' }
          }
        >
          {tab.icon && <span className="w-3.5 h-3.5 flex items-center">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: 'var(--bg-tag-hover)', color: 'var(--text-muted)' }}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface UnderlineTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function UnderlineTabs({ tabs, activeTab, onChange, className }: UnderlineTabsProps) {
  return (
    <div className={clsx('flex items-center border-b gap-0', className)} style={{ borderColor: 'var(--border-base)' }} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors',
            activeTab === tab.id ? 'border-[var(--brand-500)]' : 'border-transparent hover:border-[var(--border-strong)]'
          )}
          style={{ color: activeTab === tab.id ? 'var(--text-brand)' : 'var(--text-secondary)' }}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
