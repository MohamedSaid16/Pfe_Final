import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';

/**
 * Walkthrough — slide-based modal tour. Each step is shown one at a time
 * with prev/next/skip controls and a dot indicator. The component itself
 * is purely visual — orchestration (when to open, when to mark seen) is
 * handled by the caller, usually via the `useFirstTimeTour` hook below.
 *
 * Props:
 *   open      — whether the modal is mounted
 *   steps     — Array<{ title, body, Icon? }>
 *   onClose   — called when the user dismisses (skip OR finish)
 *   onFinish  — called when the user clicks the final "Got it" button
 *               (in addition to onClose). Use this to mark the tour seen.
 *   title?    — optional tour name shown above the step heading
 */
export function Walkthrough({ open, steps = [], title, onClose, onFinish }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Esc closes the modal — same shortcut as every other dialog in the app.
  useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || steps.length === 0) return null;

  const total = steps.length;
  const step = steps[index] || steps[0];
  const isLast = index === total - 1;
  const isFirst = index === 0;
  const StepIcon = step?.Icon;

  const handleFinish = () => {
    onFinish?.();
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
    >
      <div className="relative bg-surface rounded-2xl shadow-card border border-edge w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="relative h-24 bg-gradient-to-br from-brand to-brand-hover">
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 96">
              <circle cx="350" cy="20" r="80" fill="white" opacity="0.18" />
              <circle cx="50" cy="80" r="60" fill="white" opacity="0.10" />
            </svg>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>
          {StepIcon && (
            <div className="absolute -bottom-6 left-6 w-12 h-12 rounded-xl bg-surface shadow-card border border-edge flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-brand" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 pt-9 pb-5">
          {title && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-tertiary">
              {title}
            </p>
          )}
          <h2 id="walkthrough-title" className="mt-1 text-lg font-bold text-ink tracking-tight">
            {step.title}
          </h2>
          <div className="mt-2 text-sm text-ink-secondary leading-relaxed">
            {typeof step.body === 'string' ? <p>{step.body}</p> : step.body}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-edge bg-surface-200/30">
          {/* Dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-brand' : 'w-1.5 bg-edge-strong'
                }`}
              />
            ))}
          </div>

          {/* Step counter for screen-readers + visual */}
          <span className="text-xs text-ink-tertiary tabular-nums">
            {index + 1} / {total}
          </span>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink hover:bg-surface-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-surface bg-brand rounded-lg hover:bg-brand-hover transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Got it
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-surface bg-brand rounded-lg hover:bg-brand-hover transition-colors"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Walkthrough;
