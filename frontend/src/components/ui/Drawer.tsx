import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

const widthMap = { sm: 'w-80', md: 'w-[480px]', lg: 'w-[600px]' };

export function Drawer({ open, onClose, title, children, width = 'md' }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx('fixed inset-0 z-40 transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        style={{ background: 'var(--bg-overlay)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={clsx(
          'fixed right-0 top-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-out',
          widthMap[width],
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ background: 'var(--bg-raised)', borderLeft: '1px solid var(--border-base)', boxShadow: 'var(--shadow-dialog)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--border-base)' }}>
          {title && <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>}
          <button onClick={onClose} className="btn btn-ghost p-1.5 ml-auto" aria-label="Close drawer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  );
}
