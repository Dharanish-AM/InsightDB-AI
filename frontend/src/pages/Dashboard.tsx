import { useNavigate } from 'react-router-dom';
import {
  MessageSquareCode, Database, Clock, CheckCircle,
  Zap, ArrowRight, Plus, BarChart2, Activity, FolderTree
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { EmptyState } from '../components/ui/EmptyState';
import { useHistoryStats, useHistory } from '../hooks/useHistory';
import { useAuth } from '../context/AuthContext';

// Generate mock 14-day activity data
const generateActivity = () => {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      queries: Math.floor(Math.random() * 80) + 10,
      success: Math.floor(Math.random() * 70) + 10,
    });
  }
  return days;
};
const activityData = generateActivity();

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs" style={{ boxShadow: 'var(--shadow-dialog)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'queries' ? 'Total' : 'Success'}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export function Dashboard() {
  const navigate = useNavigate();
  const { connections, activeConnection } = useAuth();
  const { data: stats, isLoading: statsLoading } = useHistoryStats();
  const { data: historyData, isLoading: historyLoading } = useHistory(undefined, 0, 8);

  const recentQueries = historyData?.items ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="page-eyebrow mb-1.5">Overview</p>
          <h1 className="page-title">Dashboard</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your database intelligence at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/connections')}
          >
            Add Connection
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<MessageSquareCode className="w-3.5 h-3.5" />}
            onClick={() => navigate('/query-studio')}
          >
            Ask AI
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Queries"
          value={statsLoading ? '—' : (stats?.total_queries ?? 0).toLocaleString()}
          icon={<MessageSquareCode className="w-4 h-4" />}
          accentColor="#3b82f6"
          trend={12}
          subtext="vs last week"
          loading={statsLoading}
        />
        <MetricCard
          label="Success Rate"
          value={statsLoading ? '—' : `${stats?.success_rate_percentage?.toFixed(1) ?? 0}%`}
          icon={<CheckCircle className="w-4 h-4" />}
          accentColor="#10b981"
          trend={3}
          subtext="vs last week"
          loading={statsLoading}
        />
        <MetricCard
          label="Avg Latency"
          value={statsLoading ? '—' : `${Math.round(stats?.average_execution_time_ms ?? 0)}ms`}
          icon={<Clock className="w-4 h-4" />}
          accentColor="#f59e0b"
          trend={-8}
          subtext="vs last week"
          loading={statsLoading}
        />
        <MetricCard
          label="Connected DBs"
          value={connections.length}
          icon={<Database className="w-4 h-4" />}
          accentColor="#06b6d4"
          subtext="active connections"
        />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Activity Chart */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">Query Volume</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Last 14 days</p>
            </div>
            <Badge variant="blue" icon={<Activity className="w-3 h-3" />}>Live</Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradQueries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="queries" stroke="#3b82f6" strokeWidth={2} fill="url(#gradQueries)" />
              <Area type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} fill="url(#gradSuccess)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="w-2.5 h-0.5 rounded-full inline-block" style={{ background: '#3b82f6' }} />Total Queries
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="w-2.5 h-0.5 rounded-full inline-block" style={{ background: '#10b981' }} />Successful
            </span>
          </div>
        </Card>

        {/* Connected Databases */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Databases</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/connections')}>
              Manage
            </Button>
          </div>
          {connections.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No connections"
              description="Add a database to get started"
              size="sm"
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/connections')}>
                  Add connection
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {connections.map(conn => (
                <div
                  key={conn.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                  style={{ background: activeConnection?.id === conn.id ? 'rgba(59,130,246,0.08)' : 'var(--bg-tag)', border: activeConnection?.id === conn.id ? '1px solid rgba(59,130,246,0.2)' : '1px solid var(--border-base)' }}
                  onClick={() => navigate('/query-studio')}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <Database className="w-4 h-4" style={{ color: 'var(--text-brand)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{conn.name}</p>
                    <p className="text-[11px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>{conn.db_type}</p>
                  </div>
                  <StatusIndicator status="online" pulse={activeConnection?.id === conn.id} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Queries + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        {/* Recent Queries */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-base)' }}>
            <h2 className="section-title">Recent Queries</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')} iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
              View all
            </Button>
          </div>
          {historyLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="skeleton w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-2.5 w-1/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentQueries.length === 0 ? (
            <EmptyState icon={Clock} title="No queries yet" description="Ask your first question in Query Studio" size="sm" />
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {recentQueries.map(q => (
                <div
                  key={q.id}
                  className="flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-[var(--bg-tag)]"
                  onClick={() => navigate('/history')}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: q.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}
                  >
                    {q.status === 'success'
                      ? <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                      : <Zap className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{q.user_query}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(q.created_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {q.status === 'success' && (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>· {q.row_count} rows · {q.execution_time_ms}ms</span>
                      )}
                    </div>
                  </div>
                  <Badge variant={q.status === 'success' ? 'green' : 'red'} size="sm">
                    {q.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card padding="lg">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { icon: MessageSquareCode, label: 'Ask AI a question', desc: 'Natural language query', path: '/query-studio', color: '#3b82f6' },
              { icon: Database, label: 'Add connection', desc: 'Connect a new database', path: '/connections', color: '#06b6d4' },
              { icon: FolderTree, label: 'Explore schema', desc: 'Browse table structure', path: '/schema', color: '#10b981' },
              { icon: BarChart2, label: 'View reports', desc: 'Download past exports', path: '/reports', color: '#f59e0b' },
            ].map(action => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:translate-x-0.5"
                style={{ background: 'var(--bg-tag)', border: '1px solid var(--border-base)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${action.color}18`, color: action.color }}
                >
                  <action.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{action.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
