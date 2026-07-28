import React, { useState } from 'react';
import { Sparkles, Send, ShieldCheck, ShieldAlert, Code2, Table, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';
import { DatabaseConnection, PipelineAskResponse } from '../types';

interface QueryStudioProps {
  connection: DatabaseConnection | null;
}

export const QueryStudio: React.FC<QueryStudioProps> = ({ connection }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<PipelineAskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connection || !prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
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

  if (!connection) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-3 max-w-xl mx-auto my-12">
        <Sparkles className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mx-auto" />
        <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Select a Database Connection</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Choose an active database connection to start asking natural language business questions and generating verified SQL.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="glass-panel p-4 rounded-2xl border shadow-xl" style={{ borderColor: 'var(--border-base)' }}>
        <form onSubmit={handleAsk} className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Ask a question about ${connection.name} (e.g., Show total order revenue by region)...`}
              className="w-full border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Analyzing...' : 'Ask AI'}</span>
            {!loading && <Send className="w-4 h-4" />}
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
                <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Limit: {response.plan.limit} rows</span>
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Table className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Query Results ({response.query_results.row_count} rows)</span>
                </span>
                <div className="flex items-center space-x-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    <span>{response.query_results.execution_time_ms} ms</span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-base)' }}>
                <table className="w-full text-left text-xs">
                  <thead className="font-semibold border-b uppercase tracking-wider" style={{ background: 'var(--bg-table-head)', borderColor: 'var(--border-base)', color: 'var(--text-primary)' }}>
                    <tr>
                      {response.query_results.columns.map((col, idx) => (
                        <th key={idx} className="px-4 py-3 font-mono">{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ background: 'var(--bg-table-row)', borderColor: 'var(--border-base)' }}>
                    {response.query_results.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        {response.query_results!.columns.map((col, cIdx) => (
                          <td key={cIdx} className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-primary)' }}>
                            {String(row[col.name] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
