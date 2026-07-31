import { useNavigate } from 'react-router-dom';
import { MessageSquareCode, Database, Settings, LogOut, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MetricCard } from '../components/ui/MetricCard';
import { useAuth } from '../context/AuthContext';
import { useHistoryStats } from '../hooks/useHistory';

export function Profile() {
  const navigate = useNavigate();
  const { user, logout, connections } = useAuth();
  const { data: stats } = useHistoryStats();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <p className="page-eyebrow mb-1.5">Account</p>
        <h1 className="page-title">Profile</h1>
      </div>

      {/* Profile Card */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shrink-0"
            style={{ background: 'var(--grad-brand)' }}
          >
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {user?.email?.split('@')[0]}
              </h2>
              <Badge variant="blue">{user?.role}</Badge>
              <Badge variant="green" icon={<CheckCircle className="w-2.5 h-2.5" />}>Active</Badge>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en', { year: 'numeric', month: 'long' }) : '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Settings className="w-3.5 h-3.5" />} onClick={() => navigate('/settings')}>
              Settings
            </Button>
            <Button variant="danger" size="sm" icon={<LogOut className="w-3.5 h-3.5" />} onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </Card>

      {/* Activity Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Queries"   value={(stats?.total_queries ?? 0).toLocaleString()} icon={<MessageSquareCode className="w-4 h-4" />} accentColor="#3b82f6" />
        <MetricCard label="Success Rate"    value={`${stats?.success_rate_percentage?.toFixed(1) ?? 0}%`} icon={<CheckCircle className="w-4 h-4" />} accentColor="#10b981" />
        <MetricCard label="Rows Fetched"    value={(stats?.total_rows_fetched ?? 0).toLocaleString()} icon={<Database className="w-4 h-4" />} accentColor="#06b6d4" />
        <MetricCard label="Connections"     value={connections.length} icon={<Database className="w-4 h-4" />} accentColor="#f59e0b" />
      </div>

      {/* Account Details */}
      <Card padding="lg">
        <h2 className="section-title mb-5">Account Details</h2>
        <div className="space-y-3">
          {[
            { label: 'User ID',       value: `#${user?.id}` },
            { label: 'Email',         value: user?.email ?? '—' },
            { label: 'Role',          value: user?.role ?? '—' },
            { label: 'Account Status', value: user?.is_active ? 'Active' : 'Inactive' },
            { label: 'Member Since',  value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—' },
          ].map(row => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2.5 border-b last:border-0"
              style={{ borderColor: 'var(--border-base)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
