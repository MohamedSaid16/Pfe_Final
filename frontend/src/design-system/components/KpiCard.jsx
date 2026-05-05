import React from 'react';
import { Tooltip } from './Tooltip';

/**
 * KpiCard — Notion/Stripe-style stat tile used on dashboards.
 * Tone selects the accent color used for the icon chip and (optional) trend.
 *
 * Usage:
 *   <KpiCard label="Active users" value={1240} hint="Across all roles"
 *            Icon={Users} tone="brand" />
 */
const TONES = {
  brand:   { chip: 'bg-brand/10 text-brand',     value: 'text-ink' },
  success: { chip: 'bg-success/10 text-success', value: 'text-ink' },
  warning: { chip: 'bg-warning/10 text-warning', value: 'text-ink' },
  danger:  { chip: 'bg-danger/10 text-danger',   value: 'text-ink' },
  ink:     { chip: 'bg-surface-200 text-ink-secondary', value: 'text-ink' },
};

export function KpiCard({ label, value, hint, Icon, tone = 'brand', tooltip, className = '' }) {
  const t = TONES[tone] || TONES.brand;
  const valueNode = (
    <p className={`mt-2 text-2xl font-bold tabular-nums leading-tight ${t.value}`}>
      {value ?? '—'}
    </p>
  );

  return (
    <div
      className={`bg-surface rounded-xl border border-edge shadow-sm p-5 transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
            {label}
          </p>
          {tooltip ? (
            <Tooltip label={tooltip}><span tabIndex={0}>{valueNode}</span></Tooltip>
          ) : (
            valueNode
          )}
          {hint && <p className="mt-1 text-xs text-ink-tertiary">{hint}</p>}
        </div>
        {Icon && (
          <span className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg ${t.chip}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
    </div>
  );
}

export default KpiCard;
