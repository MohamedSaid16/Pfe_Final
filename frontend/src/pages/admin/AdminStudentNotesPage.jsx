/*
  AdminStudentNotesPage — manage academic notes (moyenne) for students.

  Workflow:
    1. Pick a promo (mandatory entry point — same shape as the history page).
    2. Browse the roster: name, email, matricule, current note.
    3. Click "Edit" on a row → modal opens with the note input + save/cancel.
    4. Optionally bulk-import notes for the active promo via CSV.

  Notes are persisted to Etudiant.moyenne (Decimal). No schema change.
*/

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Upload,
  Save,
  X,
  AlertCircle,
  Loader2,
  GraduationCap,
  Pencil,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { adminPanelAPI, authAPI } from '../../services/api';
import { EmptyState, KpiCard } from '../../design-system/components';

const NOTE_PATTERN = /^\s*(\d{1,2}(?:[.,]\d{1,2})?|\.|)\s*$/;

function parseNoteInput(value) {
  if (value === null || value === undefined) return { ok: true, note: null };
  const trimmed = String(value).trim();
  if (trimmed === '') return { ok: true, note: null };
  if (!NOTE_PATTERN.test(trimmed)) return { ok: false };
  const num = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(num) || num < 0 || num > 20) return { ok: false };
  return { ok: true, note: Math.round(num * 100) / 100 };
}

function studentLabel(s) {
  const full = `${s.prenom || ''} ${s.nom || ''}`.trim();
  return full || s.email || `Student #${s.etudiantId}`;
}

function promoLabel(p) {
  if (!p) return '—';
  const base = p.nom_ar || p.nom_en || p.nom || `Promo ${p.id}`;
  const annee = p.anneeUniversitaire ? ` · ${p.anneeUniversitaire}` : '';
  const section = p.section ? ` · ${p.section}` : '';
  return `${base}${annee}${section}`;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone = toast.type === 'error'
    ? 'border-danger/30 bg-danger/5 text-danger'
    : 'border-success/30 bg-success/5 text-success';
  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md rounded-lg border px-4 py-3 text-sm shadow-card ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-ink-tertiary hover:text-ink"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Edit modal ───────────────── */

function EditNoteModal({ student, onClose, onSaved, onError }) {
  const initial = student?.note != null ? String(student.note) : '';
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const parsed = parseNoteInput(value);
  const valid = parsed.ok;
  const dirty = value !== initial;
  const canSave = valid && dirty && !saving;

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await adminPanelAPI.updateStudentNote(student.etudiantId, parsed.note);
      const updatedNote = res?.data?.note ?? parsed.note;
      onSaved?.(student.etudiantId, updatedNote);
    } catch (err) {
      onError?.(err?.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSave}
        className="bg-surface rounded-2xl shadow-card border border-edge w-full max-w-md"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <div>
            <h2 className="text-lg font-semibold text-ink">Edit note</h2>
            <p className="text-xs text-ink-tertiary mt-0.5">{studentLabel(student)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-ink-tertiary hover:text-ink hover:bg-surface-200 rounded-lg"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-lg bg-surface-200/60 px-4 py-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-ink-tertiary">Email</span>
              <span className="font-medium text-ink-secondary">{student.email || '—'}</span>
            </div>
            {student.matricule && (
              <div className="flex justify-between">
                <span className="text-ink-tertiary">Matricule</span>
                <span className="font-mono font-medium text-ink-secondary">{student.matricule}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-tertiary">Current note</span>
              <span className="font-medium text-ink-secondary">
                {student.note != null ? Number(student.note).toFixed(2) : '—'}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="note-input" className="block text-xs font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">
              Note (0–20)
            </label>
            <input
              id="note-input"
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 14.5"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none transition focus:ring-2 ${
                valid
                  ? 'border-edge focus:border-brand focus:ring-brand/30'
                  : 'border-danger focus:border-danger focus:ring-danger/30'
              }`}
              aria-invalid={!valid}
            />
            {!valid && (
              <p className="text-xs text-danger mt-1">Note must be a number between 0 and 20.</p>
            )}
            <p className="text-xs text-ink-tertiary mt-1">
              Leave empty to clear the recorded note.
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-edge bg-surface-200/30 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-surface bg-brand rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            Save note
          </button>
        </footer>
      </form>
    </div>
  );
}

/* ─────────────────────────────── Page ─────────────────────── */

export default function AdminStudentNotesPage() {
  const [promos, setPromos] = useState([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [selectedPromoId, setSelectedPromoId] = useState('');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [editing, setEditing] = useState(null); // student row currently being edited
  const [toast, setToast] = useState(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Load promos once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPromosLoading(true);
      try {
        const res = await authAPI.adminGetAcademicOptions();
        const list = Array.isArray(res?.data?.promos) ? res.data.promos : [];
        if (!cancelled) setPromos(list);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load promos.');
      } finally {
        if (!cancelled) setPromosLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load students for the picked promo + optional search filter.
  useEffect(() => {
    if (!selectedPromoId) {
      setStudents([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const params = { promoId: selectedPromoId };
        if (debouncedSearch) params.search = debouncedSearch;
        const res = await adminPanelAPI.listStudentNotes(params);
        if (!cancelled) setStudents(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load students.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedPromoId, debouncedSearch]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const stats = useMemo(() => {
    const total = students.length;
    const withNote = students.filter((s) => s.note !== null && s.note !== undefined).length;
    const avg = withNote === 0
      ? 0
      : students.reduce((acc, s) => acc + (s.note || 0), 0) / withNote;
    return {
      total,
      withNote,
      withoutNote: total - withNote,
      average: Math.round(avg * 100) / 100,
    };
  }, [students]);

  const selectedPromo = useMemo(
    () => promos.find((p) => String(p.id) === String(selectedPromoId)) || null,
    [promos, selectedPromoId],
  );

  const handleSaved = (etudiantId, newNote) => {
    setStudents((prev) => prev.map((s) =>
      s.etudiantId === etudiantId ? { ...s, note: newNote } : s,
    ));
    const target = students.find((s) => s.etudiantId === etudiantId);
    setToast({
      type: 'success',
      message: `Note saved for ${target ? studentLabel(target) : 'student'}.`,
    });
    setEditing(null);
  };

  const onFilePicked = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setToast({ type: 'error', message: 'Please upload a .csv file.' });
      event.target.value = '';
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await adminPanelAPI.importStudentNotes(file);
      setImportResult(res?.data || null);
      const summary = res?.data
        ? `${res.data.updated} updated · ${res.data.skipped} skipped · ${res.data.errored} errored`
        : 'Import done.';
      setToast({ type: 'success', message: summary });
      // Refresh list if a promo is currently selected.
      if (selectedPromoId) {
        const params = { promoId: selectedPromoId };
        if (debouncedSearch) params.search = debouncedSearch;
        const listRes = await adminPanelAPI.listStudentNotes(params);
        setStudents(Array.isArray(listRes?.data) ? listRes.data : []);
      }
    } catch (err) {
      setToast({ type: 'error', message: err?.message || 'Import failed.' });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── Page header ──────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Academic Campaigns
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Student Notes Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
            Pick a promo to load its roster, then click <strong>Edit</strong> next to a student to
            update their note (0–20). For bulk updates, import a CSV.
          </p>
        </div>
      </header>

      {/* ── Promo picker ─────────────────────────────────── */}
      <section className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary mb-2">
          Step 1 — Select a promo
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedPromoId}
            onChange={(e) => setSelectedPromoId(e.target.value)}
            disabled={promosLoading}
            className="flex-1 min-w-[260px] rounded-lg border border-edge bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
          >
            <option value="">{promosLoading ? 'Loading promos…' : 'Choose a promo…'}</option>
            {promos.map((p) => (
              <option key={p.id} value={p.id}>
                {promoLabel(p)}
              </option>
            ))}
          </select>
          {selectedPromo && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <Users className="w-3.5 h-3.5" />
              {students.length} student{students.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </section>

      {/* ── Show empty state until a promo is picked ───── */}
      {!selectedPromoId ? (
        <EmptyState
          Icon={GraduationCap}
          title="Pick a promo to begin"
          hint="Notes are managed per promo — select one above to load its roster."
        />
      ) : (
        <>
          {/* ── KPI row ────────────────────────────────── */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total students" value={loading ? '…' : stats.total} Icon={GraduationCap} tone="brand" />
            <KpiCard label="With recorded note" value={loading ? '…' : stats.withNote} tone="success" />
            <KpiCard label="Without note" value={loading ? '…' : stats.withoutNote} tone="warning" />
            <KpiCard label="Average" value={loading ? '…' : (stats.withNote ? stats.average.toFixed(2) : '—')} tone="ink" />
          </section>

          {/* ── CSV import ─────────────────────────────── */}
          <section className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink">CSV import</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  Format: <code className="rounded bg-surface-200 px-1 py-0.5 text-xs">name,email,note</code> (header optional).
                  Existing students are matched by email; unknown emails are reported as skipped.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-surface hover:bg-brand-hover disabled:opacity-60"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importing ? 'Importing…' : 'Upload CSV'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={onFilePicked}
                />
              </div>
            </div>

            {importResult && (
              <div className="mt-4 rounded-lg border border-edge bg-surface-200/40 p-4 text-sm">
                <p className="font-medium text-ink">
                  Processed {importResult.totalRows} row(s) — {importResult.updated} updated,{' '}
                  {importResult.skipped} skipped, {importResult.errored} errored.
                </p>
                {Array.isArray(importResult.results) && importResult.results.some((r) => r.status !== 'updated') && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-ink-tertiary">Show problem rows</summary>
                    <ul className="mt-2 space-y-1 text-xs">
                      {importResult.results
                        .filter((r) => r.status !== 'updated')
                        .map((r) => (
                          <li key={`${r.rowNumber}-${r.email}`} className="flex gap-2">
                            <span className={`shrink-0 rounded px-1.5 ${
                              r.status === 'error' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                            }`}>
                              row {r.rowNumber}
                            </span>
                            <span className="text-ink-secondary">
                              {r.email || '(no email)'} — {r.reason || r.status}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </section>

          {/* ── Roster table ───────────────────────────── */}
          <section className="rounded-2xl border border-edge bg-surface shadow-sm overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-edge">
              <div>
                <h2 className="text-base font-semibold text-ink">Roster</h2>
                <p className="text-xs text-ink-tertiary">
                  {selectedPromo ? promoLabel(selectedPromo) : '—'}
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search within this promo…"
                  className="w-72 max-w-full rounded-lg border border-edge bg-surface pl-9 pr-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </header>

            {error ? (
              <div className="px-5 py-6 text-sm text-danger flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : loading ? (
              <div className="px-5 py-12 flex items-center justify-center text-ink-tertiary">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading students…</span>
              </div>
            ) : students.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  Icon={GraduationCap}
                  title={debouncedSearch ? 'No matching students' : 'This promo has no students yet'}
                  hint={debouncedSearch
                    ? 'Adjust your search to find a student.'
                    : 'Once students are assigned to this promo, they will show up here.'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-canvas/60 text-ink-tertiary text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 font-medium">Student</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Matricule</th>
                      <th className="px-5 py-3 font-medium">Note</th>
                      <th className="px-5 py-3 font-medium w-32 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge-subtle text-sm">
                    {students.map((s) => {
                      const noteDisplay = s.note != null ? Number(s.note).toFixed(2) : '—';
                      const hasNote = s.note != null;
                      return (
                        <tr key={s.etudiantId} className="hover:bg-canvas/40 transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-medium text-ink truncate">{studentLabel(s)}</div>
                          </td>
                          <td className="px-5 py-3 text-ink-secondary truncate max-w-xs">{s.email || '—'}</td>
                          <td className="px-5 py-3 font-mono text-xs text-ink-tertiary">{s.matricule || '—'}</td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                                hasNote
                                  ? 'bg-success/10 text-success'
                                  : 'bg-surface-200 text-ink-tertiary'
                              }`}
                            >
                              {hasNote && <CheckCircle2 className="w-3 h-3" />}
                              {noteDisplay}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setEditing(s)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:bg-surface-200 hover:text-ink transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {editing && (
        <EditNoteModal
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          onError={(message) => setToast({ type: 'error', message })}
        />
      )}
    </div>
  );
}
