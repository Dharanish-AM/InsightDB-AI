import React from 'react';
import { Database, Sparkles, FolderTree, LogOut, User as UserIcon, Server } from 'lucide-react';
import { DatabaseConnection, User } from '../types';

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
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-gray-800 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-indigo-300">
                InsightDB AI
              </span>
              <span className="block text-xs text-indigo-400 font-medium tracking-wide">Autonomous SQL Agent</span>
            </div>
          </div>

          <nav className="flex items-center space-x-1 bg-gray-900/60 p-1.5 rounded-xl border border-gray-800/80">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'studio'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Query Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('connections')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'connections'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Connections</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'schema'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>Schema Explorer</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-1.5">
            <Database className="w-4 h-4 text-indigo-400" />
            <select
              value={activeConnection?.id || ''}
              onChange={(e) => {
                const conn = connections.find((c) => c.id === Number(e.target.value));
                setActiveConnection(conn || null);
              }}
              className="bg-transparent text-sm text-gray-200 focus:outline-none cursor-pointer pr-2"
            >
              <option value="" disabled className="bg-gray-900 text-gray-400">Select Database Connection</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id} className="bg-gray-900 text-gray-200">
                  {c.name} ({c.db_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {user && (
            <div className="flex items-center space-x-3 pl-2 border-l border-gray-800">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="font-medium hidden sm:inline">{user.email}</span>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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
