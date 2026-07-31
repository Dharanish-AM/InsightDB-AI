import React, { useState } from 'react';
import {
  Database, Plus, CheckCircle, AlertCircle, Pencil, Trash2, PlugZap, Eye, EyeOff, LockKeyhole, Server, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { DatabaseConnection } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Dialog } from './ui/Dialog';
import { StatusIndicator } from './ui/StatusIndicator';
import { EmptyState } from './ui/EmptyState';
import { InlineError } from './ui/ErrorState';
import toast from 'react-hot-toast';

type FormState = {
  name: string; dbType: 'postgresql' | 'mysql';
  host: string; port: number; databaseName: string; username: string; password: string;
};
const blank: FormState = { name: '', dbType: 'postgresql', host: 'localhost', port: 5432, databaseName: '', username: '', password: '' };

export function ConnectionManager() {
  const { connections, refreshConnections, activeConnection, setActiveConnection } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DatabaseConnection | null>(null);
  const [deleting, setDeleting] = useState<DatabaseConnection | null>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const update = (k: keyof FormState, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(blank); setError(null); setTestResult(null); setShowForm(true); };
  const openEdit = (c: DatabaseConnection) => {
    setEditing(c);
    setForm({ name: c.name, dbType: c.db_type, host: c.host, port: c.port, databaseName: c.database_name, username: c.username, password: '' });
    setError(null); setTestResult(null); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(blank); setError(null); setTestResult(null); };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = editing && !form.password
        ? await api.testSavedConnection(editing.id)
        : await api.testConnection({ name: form.name, db_type: form.dbType, host: form.host, port: form.port, database_name: form.databaseName, username: form.username, password: form.password });
      setTestResult({ success: res.success, message: res.message || (res.success ? 'Connection successful.' : 'Connection failed.') });
      if (res.success) toast.success('Connection test passed!');
      else toast.error('Connection test failed');
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
      toast.error(e.message);
    } finally { setTesting(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const payload = { name: form.name, db_type: form.dbType, host: form.host, port: Number(form.port), database_name: form.databaseName, username: form.username, ...(form.password ? { password: form.password } : {}) };
      let saved: DatabaseConnection;
      if (editing) saved = await api.updateConnection(editing.id, payload);
      else saved = await api.createConnection({ ...payload, password: form.password });
      await refreshConnections();
      setActiveConnection(saved);
      closeForm();
      toast.success(editing ? 'Connection updated' : 'Connection created');
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    if (activeConnection?.id === deleting.id && deleteConfirm !== deleting.name) return;
    setSaving(true);
    try {
      await api.deleteConnection(deleting.id);
      if (activeConnection?.id === deleting.id) setActiveConnection(connections.find(c => c.id !== deleting.id) ?? null);
      await refreshConnections();
      setDeleting(null); setDeleteConfirm('');
      toast.success('Connection deleted');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-7 animate-fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="page-eyebrow mb-1.5">Data Sources</p>
          <h1 className="page-title">Database Connections</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage your database connections and configure access.
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={openNew}>
          Add Connection
        </Button>
      </div>

      {/* Stats bar */}
      {connections.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: connections.length, color: '#3b82f6', icon: <Database className="w-4 h-4" /> },
            { label: 'Active', value: activeConnection ? 1 : 0, color: '#10b981', icon: <Activity className="w-4 h-4" /> },
            { label: 'Types', value: new Set(connections.map(c => c.db_type)).size, color: '#06b6d4', icon: <Server className="w-4 h-4" /> },
          ].map(stat => (
            <div key={stat.label} className="metric-card flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${stat.color}18`, color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connection grid */}
      {connections.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Database}
            title="No connections yet"
            description="Add your first PostgreSQL or MySQL database to get started with AI-powered queries."
            action={<Button variant="primary" onClick={openNew} icon={<Plus className="w-4 h-4" />}>Add your first connection</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {connections.map(conn => {
            const isActive = activeConnection?.id === conn.id;
            const isRevealed = revealedId === conn.id;
            return (
              <article
                key={conn.id}
                className={`glass rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 ${isActive ? 'border-[rgba(59,130,246,0.4)] shadow-[0_0_24px_rgba(59,130,246,0.1)]' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: isActive ? 'rgba(59,130,246,0.15)' : 'var(--bg-tag)', color: isActive ? 'var(--text-brand)' : 'var(--text-secondary)' }}
                    >
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate text-sm" style={{ color: 'var(--text-primary)' }}>{conn.name}</h3>
                      <Badge variant={conn.db_type === 'postgresql' ? 'blue' : 'cyan'} size="sm">
                        {conn.db_type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      title="Edit"
                      onClick={() => openEdit(conn)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-tag)] transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => setDeleting(conn)}
                      className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Connection details */}
                <div className="rounded-xl border p-3 text-xs" style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)' }}>
                  {isRevealed ? (
                    <dl className="space-y-1.5 code-font" style={{ color: 'var(--text-secondary)' }}>
                      {[
                        ['Host', `${conn.host}:${conn.port}`],
                        ['Database', conn.database_name],
                        ['User', conn.username],
                        ['Added', new Date(conn.created_at).toLocaleDateString()],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3">
                          <dt>{k}</dt>
                          <dd className="truncate" style={{ color: 'var(--text-primary)' }}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <LockKeyhole className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-brand)' }} />
                      <span>Connection details protected</span>
                    </div>
                  )}
                  <button
                    onClick={() => setRevealedId(isRevealed ? null : conn.id)}
                    className="flex items-center gap-1 mt-2 text-[11px] font-semibold"
                    style={{ color: 'var(--text-brand)' }}
                  >
                    {isRevealed ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Reveal</>}
                  </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                  <StatusIndicator status={isActive ? 'online' : 'offline'} label={isActive ? 'Active' : 'Available'} pulse={isActive} />
                  <Button
                    variant={isActive ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setActiveConnection(conn)}
                  >
                    {isActive ? 'Selected' : 'Use'}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onClose={closeForm} title={editing ? `Edit ${editing.name}` : 'New Connection'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <InlineError message={error} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Connection Name" value={form.name} onChange={e => update('name', e.target.value)} required placeholder="Production PostgreSQL" />
            <Select label="Database Engine" value={form.dbType} onChange={e => { const t = e.target.value as FormState['dbType']; setForm(f => ({ ...f, dbType: t, port: t === 'postgresql' ? 5432 : 3306 })); }}>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
            </Select>
            <Input label="Host" value={form.host} onChange={e => update('host', e.target.value)} required placeholder="localhost"
              hint="Use 'postgres' inside Docker compose" />
            <Input label="Port" type="number" value={form.port} onChange={e => update('port', Number(e.target.value))} required min={1} max={65535} />
            <Input label="Database Name" value={form.databaseName} onChange={e => update('databaseName', e.target.value)} required placeholder="my_database" />
            <Input label="Username" value={form.username} onChange={e => update('username', e.target.value)} required />
            <div className="sm:col-span-2">
              <Input
                label={editing ? 'Password (leave blank to keep current)' : 'Password'}
                type="password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required={!editing}
              />
            </div>
          </div>

          {testResult && (
            <div
              className="flex items-center gap-2 rounded-xl border p-3 text-sm"
              style={{
                background: testResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                borderColor: testResult.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
                color: testResult.success ? '#34d399' : '#f87171',
              }}
            >
              {testResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {testResult.message}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2.5 pt-2 border-t" style={{ borderColor: 'var(--border-base)' }}>
            <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
            <Button
              type="button"
              variant="secondary"
              loading={testing}
              icon={<PlugZap className="w-3.5 h-3.5" />}
              onClick={handleTest}
              disabled={!editing && !form.password}
            >
              Test Connection
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editing ? 'Save Changes' : 'Create Connection'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleting} onClose={() => { setDeleting(null); setDeleteConfirm(''); }} title="Delete Connection?" size="sm">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This will permanently remove <strong style={{ color: 'var(--text-primary)' }}>{deleting.name}</strong> and its encrypted credentials.
            </p>
            {activeConnection?.id === deleting.id && (
              <div className="space-y-2">
                <p className="text-xs" style={{ color: 'var(--warning)' }}>This is your active connection. Type its name to confirm:</p>
                <Input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={deleting.name}
                />
              </div>
            )}
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="ghost" onClick={() => { setDeleting(null); setDeleteConfirm(''); }}>Cancel</Button>
              <Button
                variant="danger-solid"
                loading={saving}
                disabled={activeConnection?.id === deleting.id && deleteConfirm !== deleting.name}
                onClick={handleDelete}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
