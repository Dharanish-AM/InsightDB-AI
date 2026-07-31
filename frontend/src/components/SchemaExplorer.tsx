import { useState } from 'react';
import {
  Search, RefreshCw, ChevronRight, ChevronDown,
  Key, Link, Hash, AlertCircle, Eye, Tag, Database,
  FileText, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSchema, useSyncSchema } from '../hooks/useSchema';
import { SchemaTable, SchemaColumn } from '../types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { useDebounce } from '../hooks/useDebounce';

// ── Column type badge ──────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const t = type.toLowerCase();
  const variant = t.includes('int') || t.includes('num') || t.includes('float') || t.includes('decimal') ? 'blue'
    : t.includes('char') || t.includes('text') || t.includes('uuid') ? 'cyan'
    : t.includes('bool') ? 'green'
    : t.includes('date') || t.includes('time') ? 'yellow'
    : 'gray';
  return <Badge variant={variant} size="sm">{type}</Badge>;
}

// ── Column row ─────────────────────────────────────────────────────
function ColumnRow({ col }: { col: SchemaColumn }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-tag)] transition-colors group">
      <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center" title={col.is_primary_key ? 'Primary Key' : col.is_foreign_key ? 'Foreign Key' : undefined}>
        {col.is_primary_key && <Key className="w-3 h-3" style={{ color: '#f59e0b' }} />}
        {!col.is_primary_key && col.is_foreign_key && <Link className="w-3 h-3" style={{ color: '#06b6d4' }} />}
        {!col.is_primary_key && !col.is_foreign_key && <Hash className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />}
      </span>
      <span className="text-xs font-mono flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
        {col.column_name}
      </span>
      <TypeBadge type={col.data_type} />
      {col.annotation?.semantic_type && (
        <Badge variant="yellow" size="sm"><Eye className="w-2.5 h-2.5" /> {col.annotation.semantic_type}</Badge>
      )}
      {!col.is_nullable && (
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>NOT NULL</span>
      )}
    </div>
  );
}

// ── Table row ──────────────────────────────────────────────────────
function TableRow({
  table, isOpen, onToggle, isSelected, onSelect,
}: {
  table: SchemaTable; isOpen: boolean; onToggle: () => void; isSelected: boolean; onSelect: () => void;
}) {
  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-[rgba(59,130,246,0.1)]' : 'hover:bg-[var(--bg-tag)]'}`}
        onClick={() => { onToggle(); onSelect(); }}
      >
        {isOpen
          ? <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          : <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
        }
        <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: isSelected ? 'var(--text-brand)' : 'var(--text-secondary)' }} />
        <span className="text-sm font-medium flex-1 truncate" style={{ color: isSelected ? 'var(--text-brand)' : 'var(--text-primary)' }}>
          {table.table_name}
        </span>
        <span className="text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--bg-tag)', color: 'var(--text-muted)' }}>
          {table.columns.length}
        </span>
      </div>
      {isOpen && (
        <div className="ml-5 mt-0.5 mb-1 space-y-0.5 animate-fade-in">
          {table.columns.map(col => <ColumnRow key={col.id} col={col} />)}
        </div>
      )}
    </div>
  );
}

// ── Metadata Panel ─────────────────────────────────────────────────
function MetadataPanel({ table }: { table: SchemaTable | null }) {
  if (!table) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <Info className="w-8 h-8 mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a table to view its metadata</p>
      </div>
    );
  }

  const pkCols = table.columns.filter(c => c.is_primary_key);
  const fkCols = table.columns.filter(c => c.is_foreign_key);
  const sensitiveFields = table.columns.filter(c => c.annotation?.semantic_type);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4" style={{ color: 'var(--text-brand)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{table.table_name}</h3>
        </div>
        {table.annotation?.business_name && (
          <p className="text-xs font-semibold" style={{ color: 'var(--text-brand)' }}>{table.annotation.business_name}</p>
        )}
        {table.annotation?.description && (
          <p className="text-xs leading-5 mt-1" style={{ color: 'var(--text-secondary)' }}>{table.annotation.description}</p>
        )}
        {table.annotation?.aliases?.length && (
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Aliases:</span>
            {table.annotation.aliases.map(a => <Badge key={a} variant="gray" size="sm"><Tag className="w-2.5 h-2.5" /> {a}</Badge>)}
          </div>
        )}
      </div>

      <div className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--border-base)' }}>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Total Columns</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{table.columns.length}</span>
        </div>
        {pkCols.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Primary Keys</p>
            <div className="flex flex-wrap gap-1">
              {pkCols.map(c => <Badge key={c.id} variant="yellow" size="sm"><Key className="w-2.5 h-2.5" /> {c.column_name}</Badge>)}
            </div>
          </div>
        )}
        {fkCols.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Foreign Keys</p>
            <div className="flex flex-wrap gap-1">
              {fkCols.map(c => (
                <div key={c.id} className="space-y-0.5">
                  <Badge variant="cyan" size="sm"><Link className="w-2.5 h-2.5" /> {c.column_name}</Badge>
                  {c.foreign_key_target && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>→ {c.foreign_key_target}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        {sensitiveFields.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--warning)' }}>Sensitive Fields</p>
            <div className="flex flex-wrap gap-1">
              {sensitiveFields.map(c => <Badge key={c.id} variant="yellow" size="sm"><AlertCircle className="w-2.5 h-2.5" /> {c.column_name}</Badge>)}
            </div>
          </div>
        )}
      </div>

      {/* Column list */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--border-base)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>All Columns</p>
        <div className="space-y-1">
          {table.columns.map(col => (
            <div key={col.id} className="flex items-center justify-between py-1 text-xs">
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{col.column_name}</span>
              <TypeBadge type={col.data_type} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main SchemaExplorer ────────────────────────────────────────────
export function SchemaExplorer() {
  const { activeConnection } = useAuth();
  const { data: tables, isLoading, error } = useSchema(activeConnection?.id ?? null);
  const syncMutation = useSyncSchema(activeConnection?.id ?? null);

  const [search, setSearch] = useState('');
  const [openTables, setOpenTables] = useState<Set<number>>(new Set());
  const [selectedTable, setSelectedTable] = useState<SchemaTable | null>(null);
  const debouncedSearch = useDebounce(search, 200);

  const filtered = (tables ?? []).filter(t =>
    t.table_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    t.columns.some(c => c.column_name.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  const toggleTable = (id: number) => setOpenTables(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (!activeConnection) {
    return (
      <EmptyState
        icon={Database}
        title="No connection selected"
        description="Choose a database connection to explore its schema."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="page-eyebrow mb-1.5">Data Catalog</p>
          <h1 className="page-title">Schema Explorer</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Browse {activeConnection.name}'s tables, columns, keys, and metadata.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />}
          onClick={() => syncMutation.mutate()}
          loading={syncMutation.isPending}
        >
          Sync Schema
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Tree panel */}
        <Card padding="none" className="lg:sticky lg:top-[76px]">
          {/* Search */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-base)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tables & columns…"
                className="form-input with-icon text-xs py-2"
              />
            </div>
          </div>
          <div className="p-2 max-h-[calc(100vh-260px)] overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-8 rounded-lg" />)}
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--danger)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Failed to load schema</p>
                <Button variant="ghost" size="sm" onClick={() => syncMutation.mutate()} className="mt-2">Sync now</Button>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                {search ? 'No matches found' : 'No tables found. Sync the schema.'}
              </p>
            ) : (
              <div className="space-y-0.5">
                {filtered.map(table => (
                  <TableRow
                    key={table.id}
                    table={table}
                    isOpen={openTables.has(table.id)}
                    isSelected={selectedTable?.id === table.id}
                    onToggle={() => toggleTable(table.id)}
                    onSelect={() => setSelectedTable(table)}
                  />
                ))}
              </div>
            )}
          </div>
          {tables && (
            <div className="px-4 py-2.5 border-t text-xs" style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}>
              {filtered.length} of {tables.length} tables
            </div>
          )}
        </Card>

        {/* Metadata panel */}
        <Card padding="lg" className="min-h-[400px]">
          <MetadataPanel table={selectedTable} />
        </Card>
      </div>
    </div>
  );
}
