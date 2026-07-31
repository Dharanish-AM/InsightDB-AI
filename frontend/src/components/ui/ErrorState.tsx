import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center text-center py-14 px-4 animate-fade-in ${className ?? ''}`}>
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <AlertTriangle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
      </div>
      <h3 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {message && <p className="text-sm max-w-xs leading-5" style={{ color: 'var(--text-secondary)' }}>{message}</p>}
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-5"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl border p-3.5 text-sm animate-fade-in"
      style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
