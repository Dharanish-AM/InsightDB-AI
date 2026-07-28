import React, { useEffect, useMemo, useState } from 'react';
import { FolderTree, RefreshCw, Edit3, Key, Hash, Type, Check, AlertCircle, Search, ChevronDown, ChevronUp, ToggleRight, Info, X } from 'lucide-react';
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
  const [query, setQuery] = useState('');
  const [expandedTableIds, setExpandedTableIds] = useState<Set<number>>(new Set());
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = async () => {
    if (!connection) return;
    setLoading(true);
    try {
      const data = await api.getSchema(connection.id);
      setTables(data);
    } catch (err: any) {
      setError(err.message || 'Could not load the data catalog.');
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
      const result = await api.syncSchema(connection.id);
      await fetchSchema();
      setSyncMessage(result.message || `Synced ${result.tables_synced} tables and ${result.columns_synced} columns.`);
    } catch (err: any) {
      setError(err.message || 'Schema synchronization failed.');
    } finally {
      setSyncing(false);
    }
  };

  const visibleTables = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return tables;
    return tables.filter(table => table.table_name.toLowerCase().includes(lowered) || table.columns.some(column => column.column_name.toLowerCase().includes(lowered)));
  }, [tables, query]);

  const columnIcon = (column: SchemaColumn) => {
    if (column.is_primary_key) return <Key aria-label="Primary key" className="w-3.5 h-3.5 text-amber-500" />;
    if (column.data_type.toUpperCase().includes('BOOL')) return <ToggleRight aria-label="Boolean" className="w-3.5 h-3.5 text-sky-500" />;
    if (column.data_type.toUpperCase().includes('INT') || column.data_type.toUpperCase().includes('DECIMAL') || column.data_type.toUpperCase().includes('NUMERIC')) return <Hash aria-label="Number" className="w-3.5 h-3.5 text-indigo-500" />;
    return <Type aria-label="Text or other type" className="w-3.5 h-3.5 text-emerald-500" />;
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
      <div className="glass-panel p-12 rounded-3xl text-center space-y-3 max-w-xl mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-violet-400 mx-auto" />
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>No data source selected</h3>
        <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>Select a connection in the workspace header to browse its structure and add business context.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Data catalog</span><h1 className="page-title mt-2">Know your schema</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Browsing <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{connection.name}</span> · {connection.db_type.toUpperCase()}</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing Inspection...' : 'Sync Schema Metadata'}</span>
        </button>
      </div>

      {(syncMessage || error) && <div role={error ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}><AlertCircle className="mt-0.5 w-4 h-4 shrink-0" /><span>{error || syncMessage}</span><button aria-label="Dismiss message" onClick={() => { setError(null); setSyncMessage(null); }} className="ml-auto"><X className="w-4 h-4" /></button></div>}

      {loading ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 dark:text-indigo-400" />
          <p className="text-sm">Loading schema structure...</p>
        </div>
      ) : (
        tables.length === 0 ? <div className="glass-panel p-12 rounded-3xl text-center"><FolderTree className="w-9 h-9 mx-auto text-violet-400" /><h3 className="mt-4 text-lg font-bold">No business tables discovered</h3><p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Sync the schema to inspect available tables and fields. Operational tables are kept out of this catalog.</p></div> : <><div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3" style={{ borderColor: 'var(--border-base)' }}><div className="relative flex-1"><Search className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--text-muted)' }} /><input value={query} onChange={e => setQuery(e.target.value)} className="form-control has-leading-icon" placeholder="Search tables or columns" aria-label="Search tables or columns" /></div><span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{visibleTables.length} of {tables.length} tables</span><span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Info className="w-3.5 h-3.5" /> Keys · numbers · text · booleans</span></div>{visibleTables.length === 0 ? <div className="glass-panel rounded-2xl p-10 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No catalog items match “{query}”.</div> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {visibleTables.map((table) => { const expanded = expandedTableIds.has(table.id); const previewColumns = expanded ? table.columns : table.columns.slice(0, 5); return (
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
                  aria-label={`Edit annotation for ${table.table_name}`}
                  title="Edit table annotation"
                  onClick={() => handleOpenEdit('table', table)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="border-t pt-3 space-y-2" style={{ borderColor: 'var(--border-base)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Columns · {table.columns.length}</span>
                <div className="space-y-1.5">
                  {previewColumns.map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center justify-between p-2 rounded-xl border text-xs transition-colors"
                      style={{ background: 'var(--bg-table-row)', borderColor: 'var(--border-base)' }}
                    >
                      <div className="flex items-center space-x-2">
                        {columnIcon(col)}
                        <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{col.column_name}</span>
                        <span className="font-mono" style={{ color: 'var(--text-muted)' }}>({col.data_type})</span>
                        {col.annotation?.business_name && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                            {col.annotation.business_name}
                          </span>
                        )}
                      </div>
                      <button
                        aria-label={`Edit annotation for ${col.column_name}`}
                        title="Edit column annotation"
                        onClick={() => handleOpenEdit('column', col)}
                        className="hover:text-indigo-500 p-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {table.columns.length > 5 && <button onClick={() => setExpandedTableIds(current => { const next = new Set(current); if (next.has(table.id)) next.delete(table.id); else next.add(table.id); return next; })} className="text-xs font-semibold text-violet-600 dark:text-violet-300 flex items-center gap-1 pt-1">{expanded ? <><ChevronUp className="w-3.5 h-3.5" />Show fewer columns</> : <><ChevronDown className="w-3.5 h-3.5" />Show {table.columns.length - 5} more columns</>}</button>}
              </div>
            </div>
          ); })}
        </div>}</>
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
