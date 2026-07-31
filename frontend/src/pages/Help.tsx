import { useState } from 'react';
import { MessageSquareCode, Keyboard, ChevronDown, ChevronRight, ExternalLink, Shield, Database, FolderTree } from 'lucide-react';
import { Card } from '../components/ui/Card';

const faqs = [
  {
    q: 'How does InsightDB AI generate SQL?',
    a: 'InsightDB uses a multi-step AI pipeline: it first analyzes your database schema, creates an execution plan, generates SQL, validates it with AST parsing for read-only safety, executes it, and then generates business insights from the results.',
  },
  {
    q: 'Are my queries safe? Can the AI modify data?',
    a: 'No — InsightDB only executes SELECT queries. All generated SQL is validated with Abstract Syntax Tree (AST) parsing before execution. Any DDL or DML statements (INSERT, UPDATE, DELETE, DROP, etc.) are blocked entirely.',
  },
  {
    q: 'Which databases are supported?',
    a: 'InsightDB currently supports PostgreSQL and MySQL. Support for more databases (including SQLite, MS SQL, BigQuery) is on the roadmap.',
  },
  {
    q: 'How do I add a database connection?',
    a: 'Navigate to Connections in the sidebar, click "Add connection", fill in your host, port, database name, username, and password. You can test the connection before saving.',
  },
  {
    q: 'What AI models are supported?',
    a: 'InsightDB supports OpenAI (GPT-4o, etc.) and any OpenAI-compatible API such as Ollama for local models (llama3.2, mistral, etc.). Configure your provider via environment variables.',
  },
  {
    q: 'How do I export query results?',
    a: 'After running a query in Query Studio, use the export buttons to download results as CSV, JSON, or Markdown. You can also access exports from the Reports page.',
  },
];

const shortcuts = [
  { keys: ['⌘', 'K'], desc: 'Open command palette' },
  { keys: ['Enter'], desc: 'Submit query' },
  { keys: ['Esc'], desc: 'Close dialog / drawer' },
];

export function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <p className="page-eyebrow mb-1.5">Documentation</p>
        <h1 className="page-title">Help & Documentation</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Everything you need to get the most out of InsightDB AI.
        </p>
      </div>

      {/* Feature overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: MessageSquareCode, title: 'Query Studio', desc: 'Ask any business question in plain English and get SQL + insights', color: '#3b82f6' },
          { icon: Database, title: 'Connections', desc: 'Connect PostgreSQL and MySQL databases securely', color: '#06b6d4' },
          { icon: FolderTree, title: 'Schema Explorer', desc: 'Browse tables, columns, keys, and metadata visually', color: '#10b981' },
          { icon: Shield, title: 'Security', desc: 'All queries are AST-validated and executed as read-only', color: '#f59e0b' },
        ].map(feature => (
          <Card key={feature.title} padding="md" className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${feature.color}18`, color: feature.color }}
            >
              <feature.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
              <p className="text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Keyboard Shortcuts */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-5">
          <Keyboard className="w-4 h-4" style={{ color: 'var(--text-brand)' }} />
          <h2 className="section-title">Keyboard Shortcuts</h2>
        </div>
        <div className="space-y-2">
          {shortcuts.map(s => (
            <div
              key={s.desc}
              className="flex items-center justify-between py-2.5 border-b last:border-0"
              style={{ borderColor: 'var(--border-base)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map(k => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ background: 'var(--bg-tag)', border: '1px solid var(--border-base)', color: 'var(--text-secondary)' }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* FAQ */}
      <Card padding="none">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-base)' }}>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {faqs.map((faq, i) => (
            <div key={i} className="px-5">
              <button
                className="w-full flex items-center justify-between py-4 text-left gap-3"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{faq.q}</span>
                {openFaq === i
                  ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                }
              </button>
              {openFaq === i && (
                <div className="pb-4 animate-fade-in">
                  <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* External Links */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'GitHub Repository', href: '#' },
          { label: 'API Documentation', href: '#' },
          { label: 'Release Notes', href: '#' },
        ].map(link => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary text-sm flex items-center gap-1.5"
          >
            {link.label}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ))}
      </div>
    </div>
  );
}
