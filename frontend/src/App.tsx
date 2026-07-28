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
  const fetchConnections = async () => { try { const data = await api.getConnections(); setConnections(data); setActiveConnection(current => current ?? data[0] ?? null); } catch (err) { console.error(err); } };
  useEffect(() => { (async () => { try { if (localStorage.getItem('insightdb_token')) { setUser(await api.getMe()); await fetchConnections(); } } catch { localStorage.removeItem('insightdb_token'); setUser(null); } finally { setLoadingUser(false); } })(); }, []);
  const handleLogout = () => { localStorage.removeItem('insightdb_token'); setUser(null); setConnections([]); setActiveConnection(null); };
  if (loadingUser) return <div className="min-h-screen flex items-center justify-center"><div className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}><span className="w-8 h-8 rounded-xl animate-pulse bg-violet-600" />Preparing your workspace…</div></div>;
  if (!user) return <AuthView onSuccess={async u => { setUser(u); await fetchConnections(); }} />;
  return <div className="app-shell"><Navbar user={user} activeTab={activeTab} setActiveTab={setActiveTab} connections={connections} activeConnection={activeConnection} setActiveConnection={setActiveConnection} onLogout={handleLogout} /><main className="app-main">{activeTab === 'studio' && <QueryStudio connection={activeConnection} />}{activeTab === 'connections' && <ConnectionManager connections={connections} activeConnection={activeConnection} onSelectConnection={setActiveConnection} onRefreshConnections={fetchConnections} />}{activeTab === 'schema' && <SchemaExplorer connection={activeConnection} />}</main><footer className="mt-auto border-t px-6 py-5 text-center text-xs" style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}>InsightDB AI <span className="mx-2">·</span> Intelligence for every SQL decision</footer></div>;
}
export default App;
