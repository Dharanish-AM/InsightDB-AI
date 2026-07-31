import { clsx } from 'clsx';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'error';
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function StatusIndicator({ status, label, size = 'md', pulse }: StatusIndicatorProps) {
  const labelMap: Record<string, string> = {
    online: 'Connected',
    offline: 'Disconnected',
    warning: 'Degraded',
    error: 'Error',
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx('status-dot', status, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', pulse && status === 'online' && 'animate-pulse')} />
      {label !== undefined
        ? <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label || labelMap[status]}</span>
        : null
      }
    </span>
  );
}
