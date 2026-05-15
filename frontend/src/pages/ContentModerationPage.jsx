/*
  Content Moderation Page — Toxicity analysis of student requests.
  Fetches the admin inbox (/api/v1/requests/admin/inbox) and lets
  the admin run AI toxicity analysis on any request's description text.
  Design: matches the AdminRequestsPage design system.
*/

import React, { useState, useEffect } from 'react';
import request from '../services/api';
import aiAPI from '../services/ai';

/* ── Helpers ──────────────────────────────────────────────── */

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toxicityMeta(score) {
  if (score >= 0.75) return { label: 'High Risk',  color: 'text-danger',  bg: 'bg-danger/5',   border: 'border-danger/20',  dot: 'bg-danger'  };
  if (score >= 0.4)  return { label: 'Moderate',   color: 'text-warning', bg: 'bg-warning/5',  border: 'border-warning/20', dot: 'bg-warning' };
  return               { label: 'Safe',       color: 'text-success', bg: 'bg-success/5', border: 'border-success/20', dot: 'bg-success' };
}

const STATUS_CFG = {
  submitted:        { label: 'New',            bg: 'bg-brand/5',     text: 'text-brand',        dot: 'bg-brand'         },
  'under-review':   { label: 'Under Review',   bg: 'bg-warning/5',   text: 'text-warning',      dot: 'bg-warning'       },
  'info-requested': { label: 'Info Requested', bg: 'bg-surface-200', text: 'text-ink-secondary',dot: 'bg-ink-tertiary'  },
  resolved:         { label: 'Approved',       bg: 'bg-success/5',   text: 'text-success',      dot: 'bg-success'       },
  rejected:         { label: 'Rejected',       bg: 'bg-danger/5',    text: 'text-danger',       dot: 'bg-danger'        },
};

/* ── Sub-components ───────────────────────────────────────── */

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, accent }) {
  const accents = {
    brand:   'bg-brand/10 text-brand',
    success: 'bg-success/10 text-success',
    danger:  'bg-danger/10 text-danger',
    muted:   'bg-surface-200 text-ink-secondary',
  };
  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card p-5">
      <p className={`text-2xl font-bold tracking-tight ${accents[accent].split(' ')[1]}`}>{value}</p>
      <p className="text-xs text-ink-tertiary mt-0.5">{label}</p>
    </div>
  );
}

/* ── Score bar shown inline ───────────────────────────────── */

function ScoreBar({ score }) {
  const meta = toxicityMeta(score);
  const pct = Math.round(score * 100);
  const barColor = score >= 0.75 ? 'bg-danger' : score >= 0.4 ? 'bg-warning' : 'bg-success';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-surface-300 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${meta.color}`}>{pct}%</span>
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>{meta.label}</span>
    </div>
  );
}

/* ── Inline analysis result ───────────────────────────────── */

function AnalysisResult({ result, error }) {
  if (error) {
    return (
      <div className="mt-3 rounded-md border border-edge bg-surface-200 px-3 py-2">
        <p className="text-xs text-danger">{error}</p>
      </div>
    );
  }
  if (!result) return null;

  const analysis = result?.data?.analysis || result?.analysis || result?.data || result;
  const score    = analysis?.toxicity_score ?? 0;
  const isToxic  = analysis?.is_toxic ?? false;
  const words    = analysis?.detected_words || [];
  const lang     = analysis?.language || '';
  const meta     = toxicityMeta(score);

  return (
    <div className={`mt-3 rounded-lg border ${meta.border} ${meta.bg} p-4 space-y-3`}>
      {/* Verdict row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <span className={`text-xs font-semibold ${meta.color}`}>
            {isToxic ? 'Toxic content detected' : 'Content is safe'}
          </span>
          {lang && (
            <span className="text-[10px] text-ink-muted bg-surface-200 px-1.5 py-0.5 rounded uppercase">
              {lang}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.border} ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      {/* Score bar */}
      <ScoreBar score={score} />

      {/* Flagged words */}
      {words.length > 0 && (
        <div>
          <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-1.5">
            Detected words ({words.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {words.map((w, i) => (
              <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/15">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Request card ─────────────────────────────────────────── */

function RequestCard({ req, onAnalyze, isAnalyzing, result, error }) {
  const text   = req.description || req.title || '';
  const hasText = text.trim().length > 0;
  const key    = `${req.category}-${req.requestId || req.id}`;

  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card">
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge status={req.status} />
              <span className="text-[10px] text-ink-muted capitalize bg-surface-200 px-2 py-0.5 rounded">
                {req.category || req.type || 'Request'}
              </span>
              {req.priority === 'high' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-danger bg-danger/5 border border-edge-strong rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                  High Priority
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-ink truncate">{req.title || 'Untitled Request'}</p>
            <p className="text-xs text-ink-tertiary mt-0.5">
              {req.studentName}
              {req.studentId ? ` (${req.studentId})` : ''}
              {req.department ? ` · ${req.department}` : ''}
              {req.dateSubmitted ? ` · ${formatDate(req.dateSubmitted)}` : ''}
            </p>
          </div>

          <button
            onClick={() => onAnalyze(req)}
            disabled={!hasText || isAnalyzing}
            title={!hasText ? 'No text content to analyze' : 'Run toxicity analysis'}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors duration-150 ${
              !hasText
                ? 'bg-surface-200 border-edge text-ink-muted cursor-not-allowed'
                : isAnalyzing
                  ? 'bg-brand/10 border-edge text-brand cursor-wait'
                  : result
                    ? 'bg-surface border-edge text-ink-secondary hover:bg-surface-200'
                    : 'bg-brand border-transparent text-white hover:opacity-90'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-3 h-3 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                {result ? 'Re-analyze' : 'Analyze'}
              </>
            )}
          </button>
        </div>

        {/* Description preview */}
        {hasText ? (
          <p className="mt-3 text-xs text-ink-secondary bg-surface-200 rounded-md px-3 py-2 leading-relaxed line-clamp-2">
            {text}
          </p>
        ) : (
          <p className="mt-3 text-xs text-ink-muted italic">No text content available for analysis.</p>
        )}

        {/* Analysis result */}
        <AnalysisResult result={result} error={error} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ██  MAIN PAGE
   ═══════════════════════════════════════════════════════════ */

const FILTER_TABS = [
  { id: 'all',        label: 'All'           },
  { id: 'unanalyzed', label: 'Not Analyzed'  },
  { id: 'flagged',    label: 'Flagged'       },
  { id: 'safe',       label: 'Safe'          },
];

export default function ContentModerationPage() {
  const [inbox, setInbox]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');
  const [results, setResults]       = useState({});
  const [analyzing, setAnalyzing]   = useState({});
  const [errors, setErrors]         = useState({});
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [analyzingAll, setAnalyzingAll] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await request('/api/v1/requests/admin/inbox');
        setInbox(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setLoadError(err?.message || 'Failed to load requests.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getKey  = (req) => `${req.category}-${req.requestId || req.id}`;
  const getText = (req) => req.description || req.title || '';

  const analyzeOne = async (req) => {
    const text = getText(req);
    if (!text.trim()) return;
    const key = getKey(req);
    setAnalyzing(p => ({ ...p, [key]: true }));
    setErrors(p => ({ ...p, [key]: null }));
    try {
      const res = await aiAPI.analyzeText(text);
      setResults(p => ({ ...p, [key]: res }));
    } catch (err) {
      setErrors(p => ({ ...p, [key]: err?.message || 'AI service unavailable. Make sure the AI service is running.' }));
    } finally {
      setAnalyzing(p => ({ ...p, [key]: false }));
    }
  };

  const analyzeAll = async () => {
    const eligible = inbox.filter(r => getText(r).trim().length > 0);
    if (!eligible.length) return;
    setAnalyzingAll(true);
    for (const req of eligible) {
      await analyzeOne(req);
    }
    setAnalyzingAll(false);
  };

  /* Derived counts */
  const analyzedKeys = Object.keys(results);
  const flaggedCount = analyzedKeys.filter(k => {
    const a = results[k]?.data?.analysis || results[k]?.analysis || results[k]?.data || results[k];
    return a?.is_toxic;
  }).length;
  const safeCount = analyzedKeys.length - flaggedCount;

  const isFlagged = (req) => {
    const a = results[getKey(req)]?.data?.analysis || results[getKey(req)]?.analysis || results[getKey(req)]?.data || results[getKey(req)];
    return a?.is_toxic;
  };

  /* Filter + search */
  const visible = inbox.filter(req => {
    const key      = getKey(req);
    const hasResult = Boolean(results[key]);
    const flagged  = hasResult && isFlagged(req);
    const matchesSearch = !search || (req.title + req.description + req.studentName).toLowerCase()
      .includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'unanalyzed') return !hasResult;
    if (filter === 'flagged')    return hasResult && flagged;
    if (filter === 'safe')       return hasResult && !flagged;
    return true;
  });

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-edge-strong border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Error ── */
  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center rounded-md border border-edge px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-200"
        >
          Reload
        </button>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Content Moderation</h1>
          <p className="mt-1 text-sm text-ink-tertiary">
            AI-powered toxicity analysis of student requests and reclamations.
          </p>
        </div>

        <button
          onClick={analyzeAll}
          disabled={analyzingAll || inbox.length === 0}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors duration-150 ${
            analyzingAll || inbox.length === 0
              ? 'bg-surface-200 border-edge text-ink-muted cursor-not-allowed'
              : 'bg-brand border-transparent text-white hover:opacity-90'
          }`}
        >
          {analyzingAll ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing all requests…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Analyze All
            </>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests"  value={inbox.length}        accent="brand"   />
        <StatCard label="Analyzed"        value={analyzedKeys.length} accent="muted"   />
        <StatCard label="Safe"            value={safeCount}           accent="success" />
        <StatCard label="Flagged"         value={flaggedCount}        accent="danger"  />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by student, title, or content…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-control-border bg-control-bg text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors duration-150"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-surface-200 rounded-md p-1 shrink-0">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors duration-150 ${
                filter === tab.id
                  ? 'bg-surface shadow-soft text-ink'
                  : 'text-ink-tertiary hover:text-ink-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-ink-muted">
            {inbox.length === 0 ? 'No requests in the inbox.' : 'No requests match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            Showing {visible.length} of {inbox.length} request{inbox.length !== 1 ? 's' : ''}
          </p>
          {visible.map(req => {
            const key = getKey(req);
            return (
              <RequestCard
                key={key}
                req={req}
                onAnalyze={analyzeOne}
                isAnalyzing={analyzing[key] || false}
                result={results[key] || null}
                error={errors[key] || null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
