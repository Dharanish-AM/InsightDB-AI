import { useEffect, useState } from 'react';
import { api } from './services/api';
import { DatabaseConnection, User } from './types';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { ConnectionManager } from './components/ConnectionManager';
import { SchemaExplorer } from './components/SchemaExplorer';
import { QueryStudio } from './components/QueryStudio';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'studio' | 'connections' | 'schema'>('studio');
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<DatabaseConnection | null>(null);

  const fetchConnections = async () => {
    try {
      const data = await api.getConnections();
      setConnections(data);
      if (data.length > 0 && !activeConnection) {
        setActiveConnection(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('insightdb_token');
        if (token) {
          const me = await api.getMe();
          setUser(me);
          await fetchConnections();
        }
      } catch (err) {
        localStorage.removeItem('insightdb_token');
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    init();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('insightdb_token');
    setUser(null);
    setConnections([]);
    setActiveConnection(null);
  };

  const handleAuthSuccess = async (u: User) => {
    setUser(u);
    await fetchConnections();
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-indigo-500 dark:text-indigo-400">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 animate-pulse" />
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading InsightDB AI...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <AuthView onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connections={connections}
        activeConnection={activeConnection}
        setActiveConnection={setActiveConnection}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'studio' && (
          <QueryStudio connection={activeConnection} />
        )}
        {activeTab === 'connections' && (
          <ConnectionManager
            connections={connections}
            activeConnection={activeConnection}
            onSelectConnection={setActiveConnection}
            onRefreshConnections={fetchConnections}
          />
        )}
        {activeTab === 'schema' && (
          <SchemaExplorer connection={activeConnection} />
        )}
      </main>

      <footer className="glass-panel border-t py-4 px-6 text-center text-xs" style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}>
        InsightDB AI &copy; 2026. Autonomous SQL & Business Intelligence Agent System.
      </footer>
    </div>
  );
}

export default App;
