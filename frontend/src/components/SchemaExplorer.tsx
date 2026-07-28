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
        <AlertCircle className="w-10 h-10 text-indigo-400 mx-auto" />
        <h3 className="text-xl font-semibold text-white">No Database Selected</h3>
        <p className="text-sm text-gray-400">Please select an active database connection from the top header to view and annotate schema metadata.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <FolderTree className="w-6 h-6 text-indigo-400" />
            <span>Schema Explorer & Annotator</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
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
        <div className="glass-panel p-12 rounded-2xl text-center text-gray-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
          <p className="text-sm">Loading schema structure...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tables.map((table) => (
            <div key={table.id} className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-lg">{table.table_name}</span>
                    {table.annotation?.business_name && (
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-medium">
                        {table.annotation.business_name}
                      </span>
                    )}
                  </div>
                  {table.annotation?.description && (
                    <p className="text-xs text-gray-400 mt-1">{table.annotation.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleOpenEdit('table', table)}
                  className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="border-t border-gray-800/80 pt-3 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Columns</span>
                <div className="space-y-1.5">
                  {table.columns.map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-900/60 hover:bg-gray-800/40 border border-gray-800/50 text-xs transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        {col.is_primary_key ? (
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                        ) : col.data_type.includes('INT') ? (
                          <Hash className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Type className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span className="font-mono text-gray-200">{col.column_name}</span>
                        <span className="text-gray-500 font-mono">({col.data_type})</span>
                        {col.annotation?.business_name && (
                          <span className="text-[10px] bg-gray-800 text-indigo-300 px-1.5 py-0.5 rounded">
                            {col.annotation.business_name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleOpenEdit('column', col)}
                        className="text-gray-500 hover:text-indigo-400 p-1"
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
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-gray-800 space-y-4">
            <h3 className="text-lg font-bold text-white">
              Edit Business Annotation ({editingItem.type.toUpperCase()})
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Customer Order Records"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed business description of this schema item..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
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
