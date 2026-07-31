import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, MessageSquareCode, Database, FolderTree, Clock, BarChart2, Settings, HelpCircle, X, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const { connections, setActiveConnection } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const go = useCallback((path: string) => { navigate(path); onClose(); }, [navigate, onClose]);

  const staticItems: CommandItem[] = [
    { id: 'dashboard',     label: 'Dashboard',       description: 'Overview and metrics',    icon: <LayoutDashboard className="w-4 h-4" />,      action: () => go('/dashboard'),      category: 'Navigation' },
    { id: 'query-studio',  label: 'Query Studio',    description: 'Ask AI questions',        icon: <MessageSquareCode className="w-4 h-4" />,    action: () => go('/query-studio'),   category: 'Navigation' },
    { id: 'connections',   label: 'Connections',     description: 'Manage databases',        icon: <Database className="w-4 h-4" />,             action: () => go('/connections'),    category: 'Navigation' },
    { id: 'schema',        label: 'Schema Explorer', description: 'Browse table structure',  icon: <FolderTree className="w-4 h-4" />,           action: () => go('/schema'),         category: 'Navigation' },
    { id: 'history',       label: 'Query History',   description: 'View past queries',       icon: <Clock className="w-4 h-4" />,                action: () => go('/history'),        category: 'Navigation' },
    { id: 'reports',       label: 'Reports',         description: 'Saved exports',           icon: <BarChart2 className="w-4 h-4" />,            action: () => go('/reports'),        category: 'Navigation' },
    { id: 'settings',      label: 'Settings',        description: 'Configure preferences',   icon: <Settings className="w-4 h-4" />,             action: () => go('/settings'),       category: 'Navigation' },
    { id: 'help',          label: 'Help & Docs',     description: 'Shortcuts and guides',    icon: <HelpCircle className="w-4 h-4" />,           action: () => go('/help'),           category: 'Navigation' },
  ];

  const connectionItems: CommandItem[] = connections.map(c => ({
    id: `conn-${c.id}`,
    label: `Use: ${c.name}`,
    description: `${c.db_type} · ${c.host}`,
    icon: <Database className="w-4 h-4" />,
    action: () => { setActiveConnection(c); go('/query-studio'); },
    category: 'Connections',
  }));

  const allItems = [...staticItems, ...connectionItems];

  const filtered = query.trim()
    ? allItems.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item];
    return acc;
  }, {});

  useEffect(() => { if (open) { setQuery(''); setActiveIdx(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); filtered[activeIdx]?.action(); }
    if (e.key === 'Escape')    { onClose(); }
  };

  if (!open) return null;

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4"
      style={{ background: 'var(--bg-overlay)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl animate-scale-in overflow-hidden"
        style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-dialog)' }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-base)' }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, connections, actions…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="btn btn-ghost p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
            style={{ background: 'var(--bg-tag)', border: '1px solid var(--border-base)', color: 'var(--text-muted)' }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-10" style={{ color: 'var(--text-muted)' }}>
              <Zap className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No results for "{query}"</p>
            </div>
          )}
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {category}
              </p>
              {items.map(item => {
                const idx = globalIdx++;
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={item.id}
                    onClick={() => item.action()}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                    style={{
                      background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: isActive ? 'rgba(59,130,246,0.15)' : 'var(--bg-tag)', color: isActive ? 'var(--text-brand)' : 'var(--text-secondary)' }}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      {item.description && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.description}</p>}
                    </div>
                    {isActive && <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-brand)' }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t text-[11px]" style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1"><kbd className="px-1 rounded" style={{ background: 'var(--bg-tag)', border: '1px solid var(--border-base)' }}>↑↓</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 rounded" style={{ background: 'var(--bg-tag)', border: '1px solid var(--border-base)' }}>↵</kbd> Select</span>
          <span className="flex items-center gap-1"><kbd className="px-1 rounded" style={{ background: 'var(--bg-tag)', border: '1px solid var(--border-base)' }}>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
