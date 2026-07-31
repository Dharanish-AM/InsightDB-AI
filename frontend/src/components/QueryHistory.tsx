import React, { useState } from 'react';
import {
  Clock, Search, Trash2, RefreshCw, ChevronRight, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useHistory, useHistoryStats } from '../hooks/useHistory';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Drawer } from './ui/Drawer';
import { EmptyState } from './ui/EmptyState';
import toast from 'react-hot-toast';

interface QueryHistoryViewProps {
  connections: any[];
  onSelectQuery: (sql: string, queryText: string) => void;
}

export function QueryHistoryView({ connections, onSelectQuery }: QueryHistoryViewProps) {
  const { activeConnection } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | undefined>(activeConnection?.id);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: historyData, isLoading, refetch } = useHistory(selectedConnectionId, 0, 50);
  const { data: stats } = useHistoryStats();

  const handleOpenDetail = async (item: any) => {
    try {
      const detail = await api.getHistoryDetail(item.id);
      setSelectedItem(detail);
      setDrawerOpen(true);
    } catch {
      toast.error('Failed to load query details');
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.deleteHistoryItem(id);
      toast.success('Query removed from history');
      refetch();
    } catch {
      toast.error('Failed to delete query history item');
    }
  };

  const filteredItems = (historyData?.items ?? []).filter(item => {
    const matchesSearch = item.user_query.toLowerCase().includes(search.toLowerCase()) || 
      (item.generated_sql && item.generated_sql.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="page-eyebrow mb-1.5">Audit & Logs</p>
          <h1 className="page-title">Query History</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Inspect query history, timing metrics, and reuse verified SQL statements.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Executions</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.total_queries}</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Success Rate</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">{stats.success_rate_percentage.toFixed(1)}%</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Latency</p>
            <p className="text-2xl font-bold mt-1 text-sky-400">{stats.average_execution_time_ms.toFixed(0)}ms</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Rows Fetched</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.total_rows_fetched.toLocaleString()}</p>
          </Card>
        </div>
      )}

      {/* Filter bar */}
      <Card padding="sm" className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search queries or SQL..."
            className="form-input with-icon py-1.5 text-xs"
          />
        </div>
        <select
          value={selectedConnectionId ?? ''}
          onChange={e => setSelectedConnectionId(e.target.value ? Number(e.target.value) : undefined)}
          className="form-input text-xs w-[160px] py-1.5"
        >
          <option value="">All connections</option>
          {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="form-input text-xs w-[120px] py-1.5"
        >
          <option value="all">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </Card>

      {/* History list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Clock}
            title="No history found"
            description="No queries match your current filter settings."
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[var(--bg-tag)] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: item.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: item.status === 'success' ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {item.status === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.user_query}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tag)]">
                        ID: {item.id}
                      </span>
                      <span>·</span>
                      <span>{item.execution_time_ms}ms</span>
                      <span>·</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    title="Delete"
                    onClick={(e) => handleDeleteItem(e, item.id)}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Details drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Query Execution Log"
        width="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div>
              <p className="field-label">Natural Language Question</p>
              <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{selectedItem.user_query}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="field-label">Status</p>
                <Badge variant={selectedItem.status === 'success' ? 'green' : 'red'}>
                  {selectedItem.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="field-label">Execution Time</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedItem.execution_time_ms}ms</p>
              </div>
              <div>
                <p className="field-label">Rows Returned</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedItem.row_count}</p>
              </div>
              <div>
                <p className="field-label">Date</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{new Date(selectedItem.created_at).toLocaleString()}</p>
              </div>
            </div>

            {selectedItem.generated_sql && (
              <div>
                <p className="field-label">Generated Dialect SQL</p>
                <div className="p-4 rounded-xl border mt-1.5 font-mono text-xs overflow-x-auto" style={{ background: 'var(--bg-code)', borderColor: 'var(--border-base)', color: 'var(--text-code)' }}>
                  <pre>{selectedItem.generated_sql}</pre>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() => {
                      onSelectQuery(selectedItem.generated_sql, selectedItem.user_query);
                      setDrawerOpen(false);
                    }}
                  >
                    Reuse Query Studio
                  </Button>
                </div>
              </div>
            )}

            {selectedItem.error && (
              <div>
                <p className="field-label" style={{ color: 'var(--danger)' }}>Execution Error</p>
                <div className="p-4 rounded-xl border border-red-500/20 text-xs text-red-400 mt-1.5 font-mono" style={{ background: 'rgba(239,68,68,0.06)' }}>
                  {selectedItem.error}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
