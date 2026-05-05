import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, MapPin, Users, Gavel, Loader2, AlertTriangle } from 'lucide-react';
import { pfeAdminAPI } from '../../services/pfe';

const ROLE_TONE = {
  president: 'bg-brand/10 text-brand ring-1 ring-brand/20',
  examinateur: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  rapporteur: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
};

const ROLE_LABEL = {
  president: 'President',
  examinateur: 'Member',
  rapporteur: 'Reporter',
};

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function subjectTitle(s) {
  return s?.titre_ar || s?.titre_en || (s?.id ? `Subject #${s.id}` : '—');
}

function groupName(g) {
  return g?.nom_ar || g?.nom_en || (g?.id ? `Group #${g.id}` : '—');
}

export function TeacherJurySection() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await pfeAdminAPI.myJuryAssignments();
        if (cancelled) return;
        setRows(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load jury assignments.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const presidencies = rows.filter((r) => r.role === 'president').length;
    const upcoming = rows.filter((r) => {
      const d = r.group?.dateSoutenance;
      return d && new Date(d).getTime() >= Date.now();
    }).length;
    return { total, presidencies, upcoming };
  }, [rows]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-edge bg-surface p-8 shadow-card flex items-center justify-center gap-3 text-ink-tertiary">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading your jury assignments…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Assignments" value={stats.total} accent="brand" />
        <StatCard label="Presidencies" value={stats.presidencies} accent="warning" />
        <StatCard label="Upcoming Defenses" value={stats.upcoming} accent="success" />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-edge bg-surface p-10 text-center">
          <Gavel className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-ink">No jury assignments yet</h3>
          <p className="mt-1 text-sm text-ink-tertiary">
            When the administration assigns you to a defense panel, it will appear here.
            Group selection is admin-controlled — you cannot pick groups yourself.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-edge bg-surface shadow-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-canvas/60 text-ink-tertiary text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">Group</th>
                <th className="px-5 py-3 font-medium">Project Title</th>
                <th className="px-5 py-3 font-medium">My Role</th>
                <th className="px-5 py-3 font-medium">Defense Date</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-subtle text-sm">
              {rows.map((row) => {
                const role = String(row.role || '').toLowerCase();
                const tone = ROLE_TONE[role] || 'bg-surface-200 text-ink-secondary';
                const date = formatDate(row.group?.dateSoutenance);
                const members = row.group?.groupMembers || [];
                return (
                  <tr key={row.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-5 py-4 font-medium text-ink">
                      {groupName(row.group)}
                    </td>
                    <td className="px-5 py-4 text-ink">
                      <span className="line-clamp-2">{subjectTitle(row.group?.sujetFinal)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
                        {ROLE_LABEL[role] || role || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-secondary">
                      {date ? (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-ink-tertiary" />
                          {date}
                        </span>
                      ) : (
                        <span className="text-ink-muted italic">TBD</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-ink-secondary">
                      {row.group?.salleSoutenance ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-ink-tertiary" />
                          {row.group.salleSoutenance}
                        </span>
                      ) : (
                        <span className="text-ink-muted italic">TBD</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-ink-secondary">
                      {members.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-ink-tertiary" />
                          <span>{members.length}</span>
                        </div>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent = 'brand' }) {
  const tones = {
    brand:   'bg-brand/10 text-brand',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  };
  return (
    <div className={`${tones[accent] || tones.brand} rounded-2xl border border-edge p-5`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default function TeacherJuryPage() {
  return (
    <div className="space-y-6 pb-12 max-w-7xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">PFE</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">My Jury Assignments</h1>
        <p className="mt-2 text-sm text-ink-secondary max-w-2xl">
          Defense panels you've been assigned to, including your role, the defense date,
          and location. Assignments are made by the administration — you cannot select groups yourself.
        </p>
      </div>
      <TeacherJurySection />
    </div>
  );
}
