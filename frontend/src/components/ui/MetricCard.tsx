import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: number; // positive = up, negative = down
  icon?: React.ReactNode;
  accentColor?: string;
  loading?: boolean;
}

export function MetricCard({ label, value, subtext, trend, icon, accentColor = '#3b82f6', loading }: MetricCardProps) {
  if (loading) {
    return (
      <div className="metric-card space-y-3">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-8 w-32 rounded-lg" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  const trendIcon = trend === undefined ? null :
    trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> :
    trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
    <Minus className="w-3.5 h-3.5" />;

  const trendColor = trend === undefined ? undefined :
    trend > 0 ? '#34d399' : trend < 0 ? '#f87171' : 'var(--text-muted)';

  return (
    <div className="metric-card flex flex-col gap-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor}18`, color: accentColor }}
          >
            {icon}
          </div>
        )}
      </div>
      <p
        className="text-3xl font-bold tracking-tight"
        style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      {(subtext || trend !== undefined) && (
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: trendColor }}>
              {trendIcon}{Math.abs(trend)}%
            </span>
          )}
          {subtext && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtext}</span>
          )}
        </div>
      )}
    </div>
  );
}
