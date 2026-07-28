import React, { useEffect, useState } from 'react';
import { FolderTree, RefreshCw, Edit3, Key, Hash, Type, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { DatabaseConnection, SchemaTable, SchemaColumn } from '../types';

interface SchemaExplorerProps {
  connection: DatabaseConnection | null;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({ connection }) => {
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'table' | 'column'; item: SchemaTable | SchemaColumn } | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSchema = async () => {
    if (!connection) return;
    setLoading(true);
    try {
      const data = await api.getSchema(connection.id);
      setTables(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, [connection]);

  const handleSync = async () => {
    if (!connection) return;
    setSyncing(true);
    try {
      await api.syncSchema(connection.id);
      await fetchSchema();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenEdit = (type: 'table' | 'column', item: SchemaTable | SchemaColumn) => {
    setEditingItem({ type, item });
    setBusinessName(item.annotation?.business_name || '');
    setDescription(item.annotation?.description || '');
  };

  const handleSaveAnnotation = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      if (editingItem.type === 'table') {
        await api.updateTableAnnotation(editingItem.item.id, {
          business_name: businessName,
          description: description,
        });
      } else {
        await api.updateColumnAnnotation(editingItem.item.id, {
          business_name: businessName,
          description: description,
        });
      }
      setEditingItem(null);
      await fetchSchema();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!connection) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-3 max-w-xl mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mx-auto" />
        <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>No Database Selected</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Please select an active database connection from the top header to view and annotate schema metadata.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
            <FolderTree className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            <span>Schema Explorer & Annotator</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Inspecting {connection.name} ({connection.db_type.toUpperCase()})
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center space-x-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing Inspection...' : 'Sync Schema Metadata'}</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 dark:text-indigo-400" />
          <p className="text-sm">Loading schema structure...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tables.map((table) => (
            <div key={table.id} className="glass-panel p-5 rounded-2xl border space-y-4" style={{ borderColor: 'var(--border-base)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{table.table_name}</span>
                    {table.annotation?.business_name && (
                      <span className="text-xs bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-medium">
                        {table.annotation.business_name}
                      </span>
                    )}
                  </div>
                  {table.annotation?.description && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{table.annotation.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleOpenEdit('table', table)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="border-t pt-3 space-y-2" style={{ borderColor: 'var(--border-base)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Columns</span>
                <div className="space-y-1.5">
                  {table.columns.map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center justify-between p-2 rounded-xl border text-xs transition-colors"
                      style={{ background: 'var(--bg-table-row)', borderColor: 'var(--border-base)' }}
                    >
                      <div className="flex items-center space-x-2">
                        {col.is_primary_key ? (
                          <Key className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        ) : col.data_type.includes('INT') ? (
                          <Hash className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        ) : (
                          <Type className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        )}
                        <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{col.column_name}</span>
                        <span className="font-mono" style={{ color: 'var(--text-muted)' }}>({col.data_type})</span>
                        {col.annotation?.business_name && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                            {col.annotation.business_name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleOpenEdit('column', col)}
                        className="hover:text-indigo-500 p-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border space-y-4" style={{ borderColor: 'var(--border-base)' }}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Edit Business Annotation ({editingItem.type.toUpperCase()})
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Customer Order Records"
                  className="w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed business description of this schema item..."
                  className="w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-sm font-medium hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAnnotation}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Annotation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
