import React from 'react';
import { Database, Sparkles, FolderTree, LogOut, User as UserIcon, Server, Sun, Moon } from 'lucide-react';
import { DatabaseConnection, User } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  user: User | null;
  activeTab: 'studio' | 'connections' | 'schema';
  setActiveTab: (tab: 'studio' | 'connections' | 'schema') => void;
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection | null;
  setActiveConnection: (conn: DatabaseConnection | null) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  connections,
  activeConnection,
  setActiveConnection,
  onLogout,
}) => {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-50 glass-panel border-b px-6 py-3.5" style={{ borderColor: 'var(--border-base)' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-indigo-300" style={{ backgroundImage: theme === 'light' ? 'linear-gradient(to right, #1e1b4b, #312e81, #4f46e5)' : undefined }}>
                InsightDB AI
              </span>
              <span className="block text-xs text-indigo-400 font-medium tracking-wide">Autonomous SQL Agent</span>
            </div>
          </div>

          <nav className="flex items-center space-x-1 p-1.5 rounded-xl border" style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)' }}>
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'studio'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              style={activeTab !== 'studio' ? { color: 'var(--text-secondary)' } : {}}
            >
              <Sparkles className="w-4 h-4" />
              <span>Query Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('connections')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'connections'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              style={activeTab !== 'connections' ? { color: 'var(--text-secondary)' } : {}}
            >
              <Server className="w-4 h-4" />
              <span>Connections</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'schema'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              style={activeTab !== 'schema' ? { color: 'var(--text-secondary)' } : {}}
            >
              <FolderTree className="w-4 h-4" />
              <span>Schema Explorer</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 border rounded-xl px-3 py-1.5" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)' }}>
            <Database className="w-4 h-4 text-indigo-400" />
            <select
              value={activeConnection?.id || ''}
              onChange={(e) => {
                const conn = connections.find((c) => c.id === Number(e.target.value));
                setActiveConnection(conn || null);
              }}
              className="bg-transparent text-sm focus:outline-none cursor-pointer pr-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <option value="" disabled style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>Select Database Connection</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  {c.name} ({c.db_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            id="theme-toggle"
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-tag)', border: '1px solid var(--border-base)' }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {user && (
            <div className="flex items-center space-x-3 pl-2 border-l" style={{ borderColor: 'var(--border-base)' }}>
              <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="font-medium hidden sm:inline">{user.email}</span>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
