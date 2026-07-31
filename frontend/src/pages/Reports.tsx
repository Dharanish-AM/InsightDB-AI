import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2, Download, FileText, Table, Code, Clock,
  Calendar, CheckCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { UnderlineTabs } from '../components/ui/Tabs';
import { useHistory } from '../hooks/useHistory';
import { useExportReport } from '../hooks/usePipeline';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const exportTemplates = [
  {
    id: 'csv',
    label: 'CSV Spreadsheet',
    desc: 'Comma-separated values, compatible with Excel and Google Sheets',
    icon: <Table className="w-5 h-5" />,
    format: 'csv' as const,
    color: '#10b981',
  },
  {
    id: 'json',
    label: 'JSON Data',
    desc: 'Structured JSON format for API consumption and data pipelines',
    icon: <Code className="w-5 h-5" />,
    format: 'json' as const,
    color: '#3b82f6',
  },
  {
    id: 'markdown',
    label: 'Markdown Report',
    desc: 'Human-readable Markdown with tables for documentation',
    icon: <FileText className="w-5 h-5" />,
    format: 'markdown' as const,
    color: '#f59e0b',
  },
];

const scheduleOptions = [
  { id: 'daily',   label: 'Daily',   icon: <Clock className="w-4 h-4" />,    desc: 'Every day at 08:00 UTC' },
  { id: 'weekly',  label: 'Weekly',  icon: <Calendar className="w-4 h-4" />, desc: 'Every Monday at 08:00 UTC' },
  { id: 'monthly', label: 'Monthly', icon: <BarChart2 className="w-4 h-4" />,desc: '1st of each month at 08:00 UTC' },
];

export function Reports() {
  const navigate = useNavigate();
  const { activeConnection } = useAuth();
  const [tab, setTab] = useState('exports');
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const { data: historyData, isLoading } = useHistory(activeConnection?.id, 0, 20);
  const exportMutation = useExportReport();

  const completedQueries = historyData?.items.filter(q => q.status === 'success') ?? [];

  const handleExportTemplate = async (format: 'csv' | 'json' | 'markdown', query: typeof completedQueries[0]) => {
    if (!query.generated_sql) return;
    try {
      const result = await exportMutation.mutateAsync({
        format,
        filename: `insightdb_${query.id}_${format}`,
        columns: [],
        rows: [],
        user_query: query.user_query,
        summary: query.insights_json ? JSON.parse(query.insights_json).summary : undefined,
      });
      const blob = new Blob([result.content], { type: result.content_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = result.filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (e: any) {
      toast.error(e.message || 'Export failed');
    }
  };

  const tabs = [
    { id: 'exports', label: 'Export Templates' },
    { id: 'history', label: 'Export History', badge: completedQueries.length },
    { id: 'schedule', label: 'Scheduling' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="page-eyebrow mb-1.5">Reporting</p>
        <h1 className="page-title">Reports</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Export query results, schedule recurring reports, and download data.
        </p>
      </div>

      <UnderlineTabs tabs={tabs} activeTab={tab} onChange={setTab} />

      {/* Export Templates */}
      {tab === 'exports' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="section-title mb-1">Export Formats</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Choose a format to export from your recent successful queries.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exportTemplates.map(tpl => (
              <Card key={tpl.id} padding="lg" interactive>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${tpl.color}18`, color: tpl.color }}
                >
                  {tpl.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{tpl.label}</h3>
                <p className="text-xs leading-5 mb-4" style={{ color: 'var(--text-secondary)' }}>{tpl.desc}</p>
                {completedQueries.length > 0 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleExportTemplate(tpl.format, completedQueries[0])}
                    loading={exportMutation.isPending}
                    className="w-full justify-center"
                  >
                    Export latest
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => navigate('/query-studio')}
                  >
                    Run a query first
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Export History */}
      {tab === 'history' && (
        <div className="animate-fade-in">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : completedQueries.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No exportable queries"
              description="Run successful queries in Query Studio to enable exports"
              action={<Button variant="primary" size="sm" onClick={() => navigate('/query-studio')}>Go to Query Studio</Button>}
            />
          ) : (
            <Card padding="none">
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {completedQueries.map(q => (
                  <div key={q.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.1)' }}>
                      <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{q.user_query}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(q.created_at).toLocaleString()} · {q.row_count} rows · {q.execution_time_ms}ms
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(['csv', 'json', 'markdown'] as const).map(fmt => (
                        <Button
                          key={fmt}
                          variant="secondary"
                          size="sm"
                          className="text-[11px] px-2"
                          onClick={() => handleExportTemplate(fmt, q)}
                          loading={exportMutation.isPending}
                        >
                          {fmt.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="section-title mb-1">Report Scheduling</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Configure automatic report generation and delivery. (UI preview — backend scheduling coming soon)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scheduleOptions.map(opt => (
              <Card
                key={opt.id}
                padding="lg"
                interactive
                onClick={() => setSelectedSchedule(selectedSchedule === opt.id ? null : opt.id)}
                className={selectedSchedule === opt.id ? 'border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.06)]' : ''}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--text-brand)' }}
                  >
                    {opt.icon}
                  </div>
                  {selectedSchedule === opt.id && (
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{opt.label}</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</p>
              </Card>
            ))}
          </div>
          {selectedSchedule && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl border animate-slide-up"
              style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}
            >
              <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {scheduleOptions.find(o => o.id === selectedSchedule)?.label} schedule selected. This would be saved when backend scheduling is implemented.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
