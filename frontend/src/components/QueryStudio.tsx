import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, ShieldCheck, Code2, Table, TrendingUp,
  AlertTriangle, Lightbulb, CheckCircle2, Clock, Database, ArrowUpRight,
  Download, Copy, ChevronDown, ChevronRight, Loader2,
  CheckCircle, XCircle, Circle, Activity, BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { PipelineAskResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { InlineError } from './ui/ErrorState';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

// ── Pipeline step types ──────────────────────────────────────────
type StepStatus = 'idle' | 'active' | 'done' | 'failed';
interface PipelineStepState { label: string; sublabel: string; status: StepStatus; ms?: number; }

const STEP_LABELS = [
  { label: 'Planner', sublabel: 'Analyzing intent & schema' },
  { label: 'SQL Generator', sublabel: 'Writing optimized query' },
  { label: 'Validator', sublabel: 'AST safety check' },
  { label: 'Executor', sublabel: 'Running on database' },
  { label: 'Insight Engine', sublabel: 'Generating AI analysis' },
];

function buildInitialSteps(): PipelineStepState[] {
  return STEP_LABELS.map(s => ({ ...s, status: 'idle' }));
}

// ── Pipeline Visualization ────────────────────────────────────────
function PipelineViz({ steps }: { steps: PipelineStepState[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className={clsx('pipeline-step', step.status)}>
          <div className="shrink-0 mt-0.5">
            {step.status === 'idle'   && <Circle className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            {step.status === 'active' && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-brand)' }} />}
            {step.status === 'done'   && <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />}
            {step.status === 'failed' && <XCircle className="w-4 h-4" style={{ color: 'var(--danger)' }} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold" style={{ color: step.status === 'idle' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {step.label}
              </span>
              {step.ms !== undefined && (
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{step.ms}ms</span>
              )}
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Thinking Animation ────────────────────────────────────────────
function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
    </span>
  );
}

// ── SQL Code Block ────────────────────────────────────────────────
function SqlBlock({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="code-block pr-12 max-h-[280px] overflow-y-auto">
        <pre className="whitespace-pre-wrap break-words">{sql}</pre>
      </div>
      <button
        onClick={copy}
        className="absolute top-3 right-3 btn btn-secondary p-1.5"
        title="Copy SQL"
      >
        {copied ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ── Results Table ─────────────────────────────────────────────────
function ResultsTable({ columns, rows }: { columns: { name: string; data_type: string }[]; rows: Record<string, any>[] }) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const pageSize = 25;

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sortedRows = sortCol
    ? [...rows].sort((a, b) => {
        const av = a[sortCol] ?? ''; const bv = b[sortCol] ?? '';
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      })
    : rows;

  const visibleCols = columns.filter(c => !hiddenCols.has(c.name));
  const pageRows = sortedRows.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(rows.length / pageSize);

  return (
    <div>
      {/* Column controls */}
      {columns.length > 3 && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Columns:</span>
          {columns.map(c => (
            <button
              key={c.name}
              onClick={() => setHiddenCols(prev => {
                const next = new Set(prev);
                next.has(c.name) ? next.delete(c.name) : next.add(c.name);
                return next;
              })}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors"
              style={{
                background: hiddenCols.has(c.name) ? 'transparent' : 'rgba(59,130,246,0.1)',
                borderColor: hiddenCols.has(c.name) ? 'var(--border-base)' : 'rgba(59,130,246,0.3)',
                color: hiddenCols.has(c.name) ? 'var(--text-muted)' : 'var(--text-brand)',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border-base)' }}>
        <table className="data-table min-w-full">
          <thead>
            <tr>
              {visibleCols.map(col => (
                <th key={col.name} onClick={() => toggleSort(col.name)} className="cursor-pointer select-none">
                  <span className="flex items-center gap-1">
                    {col.name}
                    {sortCol === col.name && (
                      <span style={{ color: 'var(--text-brand)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr key={ri}>
                {visibleCols.map(col => (
                  <td key={col.name}>
                    <span className="block truncate max-w-[200px]" title={String(row[col.name] ?? '')}>
                      {row[col.name] === null ? <span style={{ color: 'var(--text-muted)' }}>NULL</span> : String(row[col.name])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</Button>
            <span className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>{page + 1} / {totalPages}</span>
            <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next →</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Auto-Detect Chart Data ────────────────────────────────────────
function SmartChart({ columns, rows }: { columns: { name: string; data_type: string }[]; rows: Record<string, any>[] }) {
  const numericCols = columns.filter(c =>
    ['integer', 'bigint', 'numeric', 'float', 'double', 'decimal', 'real', 'number'].some(t => c.data_type.toLowerCase().includes(t))
  );
  const labelCol = columns.find(c => !numericCols.includes(c));

  if (numericCols.length === 0 || !labelCol || rows.length < 2) return null;

  const chartData = rows.slice(0, 20).map(r => ({
    name: String(r[labelCol.name] ?? '').slice(0, 16),
    ...Object.fromEntries(numericCols.map(c => [c.name, Number(r[c.name] ?? 0)])),
  }));

  const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4" style={{ color: 'var(--text-brand)' }} />
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Auto-Chart</h3>
        <Badge variant="blue" size="sm">Smart</Badge>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} angle={-35} textAnchor="end" tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-base)', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          {numericCols.slice(0, 3).map((col, i) => (
            <Bar key={col.name} dataKey={col.name} fill={colors[i]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── AI Insights Panel ─────────────────────────────────────────────
function InsightsPanel({ insights }: { insights: PipelineAskResponse['insights'] }) {
  if (!insights) return null;
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary */}
      <div className="p-4 rounded-xl border" style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
        <p className="text-sm leading-6" style={{ color: 'var(--text-primary)' }}>{insights.summary}</p>
      </div>

      {/* Key Takeaways */}
      {insights.key_takeaways.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Key Takeaways</span>
          </div>
          <ul className="space-y-1.5">
            {insights.key_takeaways.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--success)' }} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Trends */}
        {insights.trends.length > 0 && (
          <div className="p-3 rounded-xl border space-y-2" style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)' }}>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--text-brand)' }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-brand)' }}>Trends</span>
            </div>
            {insights.trends.map((t, i) => (
              <div key={i} className="text-xs">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{t.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Anomalies */}
        {insights.anomalies.length > 0 && (
          <div className="p-3 rounded-xl border space-y-2" style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>Anomalies</span>
            </div>
            {insights.anomalies.map((a, i) => (
              <div key={i} className="text-xs">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{a.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8b5cf6' }}>Recommendations</span>
          </div>
          <ul className="space-y-1.5">
            {insights.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#8b5cf6' }} />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Suggested Questions ───────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  'Show total revenue by month for the last quarter',
  'Which customers have the highest lifetime value?',
  'What are the top 10 products by order volume?',
  'Show user registration trends over the past 6 months',
  'Which queries have the slowest average execution time?',
  'Summarize all failed transactions in the last 30 days',
];

// ── Main QueryStudio Component ────────────────────────────────────
export function QueryStudio() {
  const { activeConnection } = useAuth();
  const connection = activeConnection;

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<PipelineAskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<PipelineStepState[]>(buildInitialSteps());
  const [showPipeline, setShowPipeline] = useState(true);
  const [activeResultTab, setActiveResultTab] = useState<'table' | 'chart' | 'sql' | 'plan'>('table');
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Read URL search params for quick queries or history reuse
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const textParam = params.get('text');
    if (textParam) {
      setPrompt(decodeURIComponent(textParam));
      // Trigger auto-resize after state update renders
      setTimeout(autoResize, 50);
    }
  }, []);

  // Auto-resize textarea
  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const simulateSteps = async () => {
    for (let i = 0; i < STEP_LABELS.length; i++) {
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx < i ? 'done' : idx === i ? 'active' : 'idle',
        ms: idx < i ? prev[idx].ms ?? Math.floor(Math.random() * 300 + 100) : undefined,
      })));
      await new Promise(r => setTimeout(r, 600 + Math.random() * 600));
    }
  };

  const handleAsk = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!connection || !prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setSteps(buildInitialSteps());
    const startTime = Date.now();

    simulateSteps();

    try {
      const schema = await api.getSchema(connection.id);
      if (schema.length === 0) await api.syncSchema(connection.id);
      const res = await api.askPipeline(connection.id, prompt);
      const totalMs = Date.now() - startTime;

      setSteps(prev => prev.map((s, i) => ({
        ...s,
        status: res.success ? 'done' : i === prev.length - 1 ? 'failed' : 'done',
        ms: Math.floor(totalMs / prev.length + Math.random() * 50),
      })));

      setResponse(res);
      if (!res.success && res.error) setError(res.error);
      else setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      setSteps(prev => prev.map(s => ({ ...s, status: 'failed' as const })));
      setError(err.message || 'Pipeline execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'markdown' | 'json') => {
    if (!response?.query_results) return;
    setExportingFormat(format);
    try {
      const cols = response.query_results.columns.map(c => c.name);
      const result = await api.exportReport({
        format, columns: cols, rows: response.query_results.rows,
        filename: `insightdb_${connection?.name || 'export'}`,
        user_query: response.user_query, summary: response.insights?.summary,
      });
      const blob = new Blob([result.content], { type: result.content_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = result.filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingFormat(null);
    }
  };

  if (!connection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <EmptyState
          icon={Database}
          title="No database connected"
          description="Select or add a database connection to start asking AI-powered questions."
          action={
            <div className="flex items-center gap-2">
              <Button variant="primary" size="md" onClick={() => window.location.href = '/connections'}>
                Add Connection
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const hasResults = response?.query_results?.success && response.query_results.columns.length > 0;
  const hasChart = hasResults && (response?.query_results?.rows?.length ?? 0) > 1;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="page-eyebrow mb-1.5">AI Query Studio</p>
          <h1 className="page-title">What would you like to know?</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ask in plain English — InsightDB writes the SQL, validates it, and surfaces the signal in your data.
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-1.5 shrink-0"
          style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}
        >
          <span className="status-dot online" />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-brand)' }}>{connection.name}</span>
          <span className="text-[11px] uppercase" style={{ color: 'var(--text-muted)' }}>{connection.db_type}</span>
        </div>
      </div>

      {/* Query Input */}
      <Card padding="md" className="border-[var(--border-brand)]">
        <form onSubmit={handleAsk} className="space-y-3">
          <div className="relative">
            <Sparkles
              className="absolute left-3.5 top-3.5 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-brand)' }}
            />
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => { setPrompt(e.target.value); autoResize(); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
              placeholder={`Ask about ${connection.name}… (e.g., "Show total revenue by region for Q4")`}
              className="form-input with-icon resize-none pr-28 min-h-[52px]"
              rows={1}
              disabled={loading}
              style={{ paddingTop: 14, paddingBottom: 14 }}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              disabled={!prompt.trim()}
              className="absolute right-2 top-2"
              iconRight={!loading ? <ArrowUpRight className="w-3.5 h-3.5" /> : undefined}
            >
              {loading ? 'Running' : 'Ask AI'}
            </Button>
          </div>

          {/* Suggested questions */}
          {!response && !loading && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Try:</span>
              {SUGGESTED_QUESTIONS.slice(0, 4).map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { setPrompt(q); textareaRef.current?.focus(); autoResize(); }}
                  className="text-[11px] px-2.5 py-1 rounded-lg border transition-colors"
                  style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)', color: 'var(--text-secondary)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </form>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card padding="lg" className="animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.1)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--text-brand)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                AI is analyzing your question <ThinkingDots />
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Running the intelligence pipeline…</p>
            </div>
          </div>
          <PipelineViz steps={steps} />
        </Card>
      )}

      {error && <InlineError message={error} />}

      {/* Results */}
      {response && !loading && (
        <div ref={resultsRef} className="space-y-5 animate-slide-up">
          {/* Pipeline summary (collapsed) */}
          <Card padding="none">
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm"
              onClick={() => setShowPipeline(v => !v)}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: 'var(--text-brand)' }} />
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Execution Pipeline</span>
                <Badge variant={response.success ? 'green' : 'red'}>{response.success ? 'Completed' : 'Failed'}</Badge>
                {response.query_results && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    · {response.query_results.execution_time_ms}ms · {response.query_results.row_count} rows
                  </span>
                )}
              </div>
              {showPipeline ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            </button>
            {showPipeline && (
              <div className="px-5 pb-5 border-t animate-fade-in" style={{ borderColor: 'var(--border-base)' }}>
                <div className="pt-4">
                  <PipelineViz steps={steps} />
                </div>
                {response.plan && (
                  <div className="mt-4 p-3 rounded-xl border" style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Planner Output</p>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{response.plan.intent_summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {response.plan.target_tables.map(t => (
                        <Badge key={t} variant="blue" size="sm">Table: {t}</Badge>
                      ))}
                      {response.plan.metrics.map((m, i) => (
                        <Badge key={i} variant="cyan" size="sm">Metric: {m.expression}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Results area */}
          {hasResults && (
            <Card padding="none">
              {/* Tabs + export */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b gap-3 flex-wrap" style={{ borderColor: 'var(--border-base)' }}>
                <div className="flex items-center gap-1">
                  {([
                    { id: 'table', label: 'Table', icon: <Table className="w-3.5 h-3.5" /> },
                    hasChart ? { id: 'chart', label: 'Chart', icon: <BarChart2 className="w-3.5 h-3.5" /> } : null,
                    { id: 'sql', label: 'SQL', icon: <Code2 className="w-3.5 h-3.5" /> },
                    response.plan ? { id: 'plan', label: 'Plan', icon: <Sparkles className="w-3.5 h-3.5" /> } : null,
                  ].filter(Boolean) as any[]).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveResultTab(tab.id)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        activeResultTab === tab.id ? 'shadow-sm' : ''
                      )}
                      style={activeResultTab === tab.id
                        ? { background: 'var(--bg-card)', color: 'var(--text-primary)' }
                        : { color: 'var(--text-secondary)' }
                      }
                    >
                      {tab.icon}{tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-3 h-3 inline mr-1" />{response.query_results!.execution_time_ms}ms
                  </span>
                  {(['csv', 'json', 'markdown'] as const).map(fmt => (
                    <Button
                      key={fmt}
                      variant="secondary"
                      size="sm"
                      className="text-[11px] px-2"
                      loading={exportingFormat === fmt}
                      onClick={() => handleExport(fmt)}
                      icon={<Download className="w-3 h-3" />}
                    >
                      {fmt.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-5">
                {activeResultTab === 'table' && (
                  <ResultsTable
                    columns={response.query_results!.columns}
                    rows={response.query_results!.rows}
                  />
                )}
                {activeResultTab === 'chart' && hasChart && (
                  <SmartChart
                    columns={response.query_results!.columns}
                    rows={response.query_results!.rows}
                  />
                )}
                {activeResultTab === 'sql' && response.sanitized_sql && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" style={{ color: 'var(--success)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>AST Validated · Read-Only Guaranteed</span>
                    </div>
                    <SqlBlock sql={response.sanitized_sql} />
                  </div>
                )}
                {activeResultTab === 'plan' && response.plan && (
                  <div className="space-y-3 text-sm">
                    <p style={{ color: 'var(--text-primary)' }}><strong>Intent:</strong> {response.plan.intent_summary}</p>
                    {response.plan.filter_conditions.length > 0 && (
                      <p style={{ color: 'var(--text-secondary)' }}><strong>Filters:</strong> {response.plan.filter_conditions.join(', ')}</p>
                    )}
                    {response.plan.group_by_columns.length > 0 && (
                      <p style={{ color: 'var(--text-secondary)' }}><strong>Group by:</strong> {response.plan.group_by_columns.join(', ')}</p>
                    )}
                    <p style={{ color: 'var(--text-secondary)' }}><strong>Limit:</strong> {response.plan.limit} rows</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* AI Insights */}
          {response.insights && (
            <Card padding="none">
              <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-base)' }}>
                <Sparkles className="w-4 h-4" style={{ color: 'var(--text-brand)' }} />
                <h2 className="section-title">AI Business Insights</h2>
                <Badge variant="blue" size="sm">Gemini</Badge>
              </div>
              <div className="p-5">
                <InsightsPanel insights={response.insights} />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
