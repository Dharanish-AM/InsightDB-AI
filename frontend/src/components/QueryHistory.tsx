import React, { useEffect, useState } from 'react';
import { Clock, RefreshCw, Search, Trash2, ExternalLink, Code2 } from 'lucide-react';
import { api } from '../services/api';
import { DatabaseConnection, HistoryStats, QueryHistoryItem } from '../types';

interface QueryHistoryProps {
  connections: DatabaseConnection[];
  onSelectQuery?: (sql: string, queryText: string) => void;
}

export const QueryHistoryView: React.FC<QueryHistoryProps> = ({ connections, onSelectQuery }) => {
  const [historyItems, setHistoryItems] = useState<QueryHistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<QueryHistoryItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [histData, statsData] = await Promise.all([
        api.getHistory(selectedConnection),
        api.getHistoryStats()
      ]);
      setHistoryItems(histData.items);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load history data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedConnection]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this query history item?')) return;
    try {
      await api.deleteHistoryItem(id);
      setHistoryItems(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
      const updatedStats = await api.getHistoryStats();
      setStats(updatedStats);
    } catch (err) {
      alert('Failed to delete history item');
    }
  };

  const filteredItems = historyItems.filter(item =>
    item.user_query.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sanitized_sql && item.sanitized_sql.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Audit & History Logs</span>
          <h1 className="page-title mt-2 flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-500" />
            Query History & Analytics
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Review previous AI queries, generated SQL, execution metrics, and analytical logs.
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn-secondary px-4 py-2.5 whitespace-nowrap self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border" style={{ borderColor: 'var(--border-base)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total Queries</div>
            <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.total_queries}</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border" style={{ borderColor: 'var(--border-base)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Success Rate</div>
            <div className="text-2xl font-bold mt-1 text-emerald-500 dark:text-emerald-400">{stats.success_rate_percentage}%</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border" style={{ borderColor: 'var(--border-base)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Avg Latency</div>
            <div className="text-2xl font-bold mt-1 text-indigo-500 dark:text-indigo-400">{stats.average_execution_time_ms} ms</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border" style={{ borderColor: 'var(--border-base)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Rows Processed</div>
            <div className="text-2xl font-bold mt-1 text-sky-500 dark:text-sky-400">{stats.total_rows_fetched.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center justify-between" style={{ borderColor: 'var(--border-base)' }}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search query text or SQL..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-control has-leading-icon py-2.5 text-xs"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Connection:</span>
          <select
            value={selectedConnection || ''}
            onChange={e => setSelectedConnection(e.target.value ? Number(e.target.value) : undefined)}
            className="form-control py-2 text-xs w-auto cursor-pointer"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}
          >
            <option value="">All Databases</option>
            {connections.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.db_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-base)' }}>
        {loading ? (
          <div className="p-12 text-center text-sm flex items-center justify-center gap-3" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            Loading query history...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No history entries found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="font-semibold border-b uppercase tracking-wider" style={{ background: 'var(--bg-table-head)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}>
                <tr>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Natural Language Query</th>
                  <th className="px-5 py-3.5">Execution Time</th>
                  <th className="px-5 py-3.5">Rows</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ background: 'var(--bg-table-row)', borderColor: 'var(--border-base)' }}>
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {item.status === 'success' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{item.user_query}</div>
                      {item.sanitized_sql && (
                        <div className="code-font text-[11px] line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {item.sanitized_sql}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 code-font font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.execution_time_ms} ms
                    </td>
                    <td className="px-5 py-3.5 code-font font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.row_count}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="btn-secondary px-2.5 py-1 text-xs"
                      >
                        Inspect
                      </button>

                      {onSelectQuery && item.sanitized_sql && (
                        <button
                          onClick={() => onSelectQuery(item.sanitized_sql!, item.user_query)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 transition-colors"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Use SQL</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                        style={{ color: 'var(--text-muted)' }}
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col border my-auto" style={{ borderColor: 'var(--border-strong)' }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-base)', background: 'var(--bg-table-head)' }}>
              <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ExternalLink className="w-4 h-4 text-violet-400" />
                Query Log Inspection
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-lg grid place-items-center transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div>
                <label className="field-label">Natural Language Intent</label>
                <p className="p-3.5 rounded-xl border font-medium text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}>
                  {selectedItem.user_query}
                </p>
              </div>

              {selectedItem.sanitized_sql && (
                <div>
                  <label className="field-label">Sanitized Dialect SQL Query</label>
                  <pre className="code-font text-xs p-4 rounded-xl border overflow-x-auto whitespace-pre-wrap leading-relaxed" style={{ background: 'var(--bg-code)', borderColor: 'var(--border-base)', color: 'var(--text-code)' }}>
                    {selectedItem.sanitized_sql}
                  </pre>
                </div>
              )}

              {selectedItem.error && (
                <div>
                  <label className="field-label text-rose-500">Error Details</label>
                  <p className="p-3.5 rounded-xl border bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-xs" style={{ borderColor: 'rgba(244,63,94,.3)' }}>
                    {selectedItem.error}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Execution Latency:</span>
                  <span className="code-font font-bold ml-2 text-indigo-500 dark:text-indigo-400">{selectedItem.execution_time_ms} ms</span>
                </div>
                <div className="p-3.5 rounded-xl border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rows Returned:</span>
                  <span className="code-font font-bold ml-2" style={{ color: 'var(--text-primary)' }}>{selectedItem.row_count}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-base)', background: 'var(--bg-table-head)' }}>
              {onSelectQuery && selectedItem.sanitized_sql ? (
                <button
                  onClick={() => {
                    const item = selectedItem;
                    setSelectedItem(null);
                    onSelectQuery(item.sanitized_sql!, item.user_query);
                  }}
                  className="btn-primary px-4 py-2 text-xs"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Use in Studio</span>
                </button>
              ) : <div />}
              <button
                onClick={() => setSelectedItem(null)}
                className="btn-secondary px-5 py-2 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
