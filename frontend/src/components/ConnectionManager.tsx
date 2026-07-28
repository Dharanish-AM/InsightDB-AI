import React, { useState } from 'react';
import { Database, Plus, CheckCircle, AlertCircle, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { DatabaseConnection } from '../types';

interface ConnectionManagerProps {
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection | null;
  onSelectConnection: (conn: DatabaseConnection) => void;
  onRefreshConnections: () => void;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  connections,
  activeConnection,
  onSelectConnection,
  onRefreshConnections,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [dbType, setDbType] = useState<'postgresql' | 'mysql'>('postgresql');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(5432);
  const [databaseName, setDatabaseName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      const res = await api.testConnection({
        name,
        db_type: dbType,
        host,
        port: Number(port),
        database_name: databaseName,
        username,
        password,
      });
      setTestResult({ success: true, message: res.message || 'Connection successful!' });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await api.createConnection({
        name,
        db_type: dbType,
        host,
        port: Number(port),
        database_name: databaseName,
        username,
        password,
      });
      setShowAdd(false);
      onRefreshConnections();
      onSelectConnection(created);
      setName('');
      setPassword('');
      setDatabaseName('');
    } catch (err: any) {
      setError(err.message || 'Failed to save database connection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Server className="w-6 h-6 text-indigo-400" />
            <span>Database Connections</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage target database connectors and encrypted access credentials</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center space-x-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Connection</span>
        </button>
      </div>

      {showAdd && (
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-lg font-semibold text-white">Configure New Connection</h3>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Connection Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production PostgreSQL"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Database Engine</label>
              <select
                value={dbType}
                onChange={(e) => {
                  const type = e.target.value as 'postgresql' | 'mysql';
                  setDbType(type);
                  setPort(type === 'postgresql' ? 5432 : 3306);
                }}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Host</label>
              <input
                type="text"
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Port</label>
              <input
                type="number"
                required
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Database Name</label>
              <input
                type="text"
                required
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
                placeholder="sales_db"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {testResult && (
              <div
                className={`md:col-span-2 p-3 rounded-xl border text-sm flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="md:col-span-2 flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium px-4 py-2 rounded-xl transition-all flex items-center space-x-2"
              >
                {testing && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Test Connection</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/25"
              >
                {saving ? 'Saving...' : 'Save Connection'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((conn) => {
          const isActive = activeConnection?.id === conn.id;
          return (
            <div
              key={conn.id}
              onClick={() => onSelectConnection(conn)}
              className={`glass-panel-interactive p-5 rounded-2xl cursor-pointer relative overflow-hidden ${
                isActive ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : ''
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-medium flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Active</span>
                </div>
              )}
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{conn.name}</h4>
                  <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">{conn.db_type}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-400 font-mono">
                <div className="flex justify-between">
                  <span>Host:</span>
                  <span className="text-gray-200">{conn.host}:{conn.port}</span>
                </div>
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className="text-gray-200">{conn.database_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>User:</span>
                  <span className="text-gray-200">{conn.username}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
