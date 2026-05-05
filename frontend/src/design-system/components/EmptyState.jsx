import React from 'react';

/**
 * EmptyState — consistent empty-list / no-data placeholder used across
 * dashboards. Notion-style: muted icon, title, hint, optional action.
 *
 * Usage:
 *   <EmptyState
 *     Icon={Users}
 *     title="No students yet"
 *     hint="They'll show up here as soon as the admin imports the roster."
 *     action={<Button>Open import</Button>}
 *   />
 */
export function EmptyState({ Icon, title, hint, action, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-edge bg-surface px-6 py-10 text-center ${className}`}
    >
      {Icon && (
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-200 text-ink-tertiary">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      )}
      {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
      {hint && <p className="mt-1 text-sm text-ink-tertiary max-w-md mx-auto">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export default EmptyState;
