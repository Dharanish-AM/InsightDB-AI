import React, { useState } from 'react';
import { Sparkles, ShieldCheck, ShieldAlert, Code2, Table, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2, Clock, Database, ArrowUpRight, MoveHorizontal, Download } from 'lucide-react';
import { api } from '../services/api';
import { DatabaseConnection, PipelineAskResponse } from '../types';

interface QueryStudioProps {
  connection: DatabaseConnection | null;
  initialQuery?: string;
}

export const QueryStudio: React.FC<QueryStudioProps> = ({ connection, initialQuery }) => {
  const [prompt, setPrompt] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [response, setResponse] = useState<PipelineAskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connection || !prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const schema = await api.getSchema(connection.id);
      if (schema.length === 0) {
        await api.syncSchema(connection.id);
      }
      const res = await api.askPipeline(connection.id, prompt);
      setResponse(res);
      if (!res.success && res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Pipeline execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'markdown' | 'json') => {
    if (!response || !response.query_results) return;
    setExportingFormat(format);
    try {
      const cols = response.query_results.columns.map(c => c.name);
      const reportRes = await api.exportReport({
        format,
        filename: `insightdb_${connection?.name || 'export'}`,
        columns: cols,
        rows: response.query_results.rows,
        user_query: response.user_query,
        summary: response.insights?.summary
      });

      const blob = new Blob([reportRes.content], { type: reportRes.content_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reportRes.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingFormat(null);
    }
  };

  if (!connection) {
    return (
      <div className="glass-panel p-10 sm:p-14 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-10">
        <div className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-400"><Database className="w-6 h-6" /></div>
        <h3 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Start with a data source</h3>
        <p className="text-sm leading-6 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>Choose a connection from the workspace header, then ask a business question in plain language.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div><span className="eyebrow">AI query studio</span><h1 className="page-title mt-2">What would you like to know?</h1><p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Ask questions, review trusted SQL, and surface the signal in your data.</p></div>
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-base)', background: 'var(--bg-tag)' }}><span className="w-2 h-2 rounded-full bg-emerald-400" />{connection.name}<span style={{ color: 'var(--text-muted)' }}>· {connection.db_type}</span></div>
      </div>
      <div className="glass-panel p-3 sm:p-4 rounded-2xl" style={{ borderColor: 'var(--border-strong)' }}>
        <form onSubmit={handleAsk} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Ask a question about ${connection.name} (e.g., Show total order revenue by region)...`}
              className="form-control has-leading-icon py-3.5"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="btn-primary px-6 py-3.5 whitespace-nowrap"
          >
            <span>{loading ? 'Analyzing...' : 'Ask AI'}</span>
            {!loading && <ArrowUpRight className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {response && (
        <div className="space-y-6">
          {response.plan && (
            <div className="glass-panel p-5 rounded-2xl border space-y-3" style={{ borderColor: 'var(--border-base)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Planner Execution Strategy</span>
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Limit: up to {response.plan.limit ?? 1000} rows</span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{response.plan.intent_summary}</p>
              
              <div className="flex flex-wrap gap-2 text-xs">
                {response.plan.target_tables.map((t, idx) => (
                  <span key={idx} className="border px-2.5 py-1 rounded-lg font-mono" style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}>
                    Table: {t}
                  </span>
                ))}
                {response.plan.metrics.map((m, idx) => (
                  <span key={idx} className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg font-mono">
                    Metric: {m.expression} {m.alias ? `AS ${m.alias}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {response.sanitized_sql && (
            <div className="glass-panel p-5 rounded-2xl border space-y-3" style={{ borderColor: 'var(--border-base)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Code2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Generated Dialect SQL</span>
                </span>
                <div className="flex items-center space-x-2 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                  <span>AST Validated & Read-Only Guaranteed</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border overflow-x-auto" style={{ background: 'var(--bg-code)', borderColor: 'var(--border-base)' }}>
                <pre className="code-font text-xs leading-relaxed" style={{ color: 'var(--text-code)' }}>
                  {response.sanitized_sql}
                </pre>
              </div>
            </div>
          )}

          {response.query_results && response.query_results.success && (
            <div className="glass-panel p-5 rounded-2xl border space-y-4" style={{ borderColor: 'var(--border-base)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Table className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Query Results ({response.query_results.row_count} returned rows)</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center space-x-1 text-xs mr-2" style={{ color: 'var(--text-secondary)' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    <span>{response.query_results.execution_time_ms} ms</span>
                  </span>

                  <div className="flex items-center gap-1 rounded-xl p-1 text-xs border" style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)' }}>
                    <span className="text-[11px] px-2 font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <Download className="w-3.5 h-3.5 text-indigo-500" /> Export:
                    </span>
                    <button
                      onClick={() => handleExport('csv')}
                      disabled={exportingFormat !== null}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('markdown')}
                      disabled={exportingFormat !== null}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      disabled={exportingFormat !== null}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}
                    >
                      JSON
                    </button>
                  </div>
                </div>
              </div>

              {response.query_results.columns.length > 4 && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <MoveHorizontal className="w-3.5 h-3.5" /> Scroll horizontally to view all columns.
                </div>
              )}

              {response.query_results.omitted_columns?.length > 0 && (
                <div className="rounded-xl border px-3 py-2 text-xs flex items-start gap-2" role="status" style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)', color: 'var(--text-secondary)' }}>
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                  <span>Protected fields were omitted from these results: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{response.query_results.omitted_columns.join(', ')}</span>.</span>
                </div>
              )}

              {response.query_results.columns.length > 0 ? (
              <div className="query-results-scroll overflow-x-auto rounded-xl border" tabIndex={0} aria-label="Query results. Scroll horizontally to view additional columns." style={{ borderColor: 'var(--border-base)' }}>
                <table className="min-w-full w-max text-left text-xs">
                  <thead className="font-semibold border-b uppercase tracking-wider" style={{ background: 'var(--bg-table-head)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}>
                    <tr>
                      {response.query_results.columns.map((col, idx) => (
                        <th key={idx} className="px-4 py-3 font-mono whitespace-nowrap">{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ background: 'var(--bg-table-row)', borderColor: 'var(--border-base)' }}>
                    {response.query_results.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        {response.query_results!.columns.map((col, cIdx) => (
                          <td key={cIdx} className="px-4 py-2.5 font-mono max-w-[18rem]" style={{ color: 'var(--text-primary)' }}>
                            <span className="block truncate" title={String(row[col.name] ?? '')}>{String(row[col.name] ?? '')}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : (
                <div className="rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--border-base)', color: 'var(--text-secondary)', background: 'var(--bg-table-row)' }}>The query returned only protected fields, so no data can be displayed.</div>
              )}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Insights below are generated from the {response.query_results.row_count} returned row{response.query_results.row_count === 1 ? '' : 's'} displayed here.</p>
            </div>
          )}

          {response.insights && (
            <div className="glass-panel p-6 rounded-2xl border space-y-6" style={{ borderColor: 'var(--border-base)' }}>
              <div className="flex items-center space-x-2 text-indigo-500 dark:text-indigo-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AI Business Intelligence Insights</h3>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {response.insights.summary}
              </div>

              {response.insights.key_takeaways.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>Key Takeaways</span>
                  </span>
                  <ul className="space-y-1.5">
                    {response.insights.key_takeaways.map((item, idx) => (
                      <li key={idx} className="text-xs flex items-start space-x-2" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.insights.trends.length > 0 && (
                  <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--bg-table-row)', borderColor: 'var(--border-base)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 flex items-center space-x-1.5">
                      <TrendingUp className="w-4 h-4" />
                      <span>Identified Trends</span>
                    </span>
                    {response.insights.trends.map((t, idx) => (
                      <div key={idx} className="space-y-0.5 text-xs">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                        <p style={{ color: 'var(--text-secondary)' }}>{t.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {response.insights.anomalies.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Anomaly Warnings</span>
                    </span>
                    {response.insights.anomalies.map((a, idx) => (
                      <div key={idx} className="space-y-0.5 text-xs">
                        <span className="font-semibold text-amber-700 dark:text-amber-300">{a.title}</span>
                        <p style={{ color: 'var(--text-primary)' }}>{a.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {response.insights.recommendations.length > 0 && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-base)' }}>
                  <span className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 flex items-center space-x-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>Strategic Recommendations</span>
                  </span>
                  <ul className="space-y-1.5">
                    {response.insights.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs flex items-start space-x-2" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400 mt-1.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
