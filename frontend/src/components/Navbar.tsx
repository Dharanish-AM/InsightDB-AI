import React from 'react';
import { Database, Sparkles, FolderTree, LogOut, User as UserIcon, Server, Sun, Moon, ChevronDown, History } from 'lucide-react';
import { DatabaseConnection, User } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  user: User | null;
  activeTab: 'studio' | 'connections' | 'schema' | 'history';
  setActiveTab: (tab: 'studio' | 'connections' | 'schema' | 'history') => void;
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection | null;
  setActiveConnection: (conn: DatabaseConnection | null) => void;
  onLogout: () => void;
}

const navItems = [
  { id: 'studio' as const, label: 'Ask Insight', icon: Sparkles },
  { id: 'history' as const, label: 'History & Logs', icon: History },
  { id: 'connections' as const, label: 'Connections', icon: Server },
  { id: 'schema' as const, label: 'Data catalog', icon: FolderTree }
];

export const Navbar: React.FC<NavbarProps> = ({ user, activeTab, setActiveTab, connections, activeConnection, setActiveConnection, onLogout }) => {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: 'color-mix(in srgb, var(--bg-base) 82%, transparent)', borderColor: 'var(--border-base)', backdropFilter: 'blur(18px)' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-[76px] flex items-center gap-5">
        <button aria-label="Go to Ask Insight" onClick={() => setActiveTab('studio')} className="flex items-center gap-2.5 shrink-0 text-left">
          <span className="w-9 h-9 rounded-xl grid place-items-center bg-gradient-to-br from-violet-500 to-violet-800 shadow-lg shadow-violet-900/30">
            <Sparkles className="w-[18px] h-[18px] text-white" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-[15px] font-bold tracking-[-.035em]" style={{ color: 'var(--text-primary)' }}>InsightDB</span>
            <span className="block text-[10px] font-semibold tracking-[.12em] uppercase" style={{ color: 'var(--text-muted)' }}>AI workspace</span>
          </span>
        </button>
        <nav aria-label="Main navigation" className="flex items-center gap-1 overflow-x-auto flex-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={activeTab === id ? { background: 'var(--bg-tag)', color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 rounded-xl border px-3 py-2 max-w-[250px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)' }}>
            <Database className="w-4 h-4 text-violet-400 shrink-0" />
            <select
              aria-label="Active database connection"
              value={activeConnection?.id || ''}
              onChange={e => setActiveConnection(connections.find(c => c.id === Number(e.target.value)) ?? null)}
              className="appearance-none bg-transparent min-w-0 flex-1 text-xs font-semibold outline-none cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
            >
              <option value="" disabled>Select database</option>
              {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          </div>
          <button
            aria-label="Toggle color theme"
            onClick={toggle}
            className="w-9 h-9 rounded-lg border grid place-items-center transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-base)' }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-500" />}
          </button>
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l" style={{ borderColor: 'var(--border-base)' }}>
            <span title={user?.email} className="w-8 h-8 rounded-full grid place-items-center bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <UserIcon className="w-4 h-4" />
            </span>
            <span title={user?.email} className="hidden xl:block max-w-[130px] truncate text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
            <button
              aria-label="Sign out"
              onClick={onLogout}
              title="Sign out"
              className="p-2 rounded-lg transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="lg:hidden px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)' }}>
          <Database className="w-4 h-4 text-violet-400" />
          <select
            aria-label="Active database connection"
            value={activeConnection?.id || ''}
            onChange={e => setActiveConnection(connections.find(c => c.id === Number(e.target.value)) ?? null)}
            className="bg-transparent min-w-0 flex-1 text-xs font-semibold outline-none"
            style={{ color: 'var(--text-primary)' }}
          >
            <option value="" disabled>Select database</option>
            {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
    </header>
  );
};
