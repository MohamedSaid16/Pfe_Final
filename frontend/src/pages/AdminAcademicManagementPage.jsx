import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Layers,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { authAPI, academicAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const inputClass =
  'w-full rounded-xl border border-edge bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';

const TYPE_OPTIONS = [
  { value: 'cours', label: 'COURS' },
  { value: 'td', label: 'TD' },
  { value: 'tp', label: 'TP' },
  { value: 'online', label: 'ONLINE' },
];

const TYPE_BADGE = {
  cours: 'bg-brand/10 text-brand border-brand/20',
  td: 'bg-success/10 text-success border-success/20',
  tp: 'bg-warning/10 text-warning border-warning/20',
  online: 'bg-info/10 text-info border-info/20',
};

function hasAdminAccess(roles) {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => String(r || '').toLowerCase() === 'admin');
}

const promoLabel = (promo) =>
  promo?.nom_ar || promo?.nom_en || promo?.nom || `Promo ${promo?.id}`;

const moduleLabel = (mod) =>
  mod?.nom_ar || mod?.nom_en || mod?.nom || `Module ${mod?.id}`;

export default function AdminAcademicManagementPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const canAccess = useMemo(() => hasAdminAccess(user?.roles), [user?.roles]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Data
  const [tree, setTree] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [legacyOptions, setLegacyOptions] = useState({ specialites: [], promos: [], modules: [] });
  const [teachers, setTeachers] = useState([]);

  // Active drill-down
  const [activeYearId, setActiveYearId] = useState(null);
  const [expandedPromos, setExpandedPromos] = useState({});

  // Forms
  const [yearForm, setYearForm] = useState({ name: '', isActive: false });
  const [specialiteForm, setSpecialiteForm] = useState({ nom: '', niveau: '', filiereId: '' });
  const [filieres, setFilieres] = useState([]);
  const [specialiteSearch, setSpecialiteSearch] = useState('');
  const [specialiteNiveauFilter, setSpecialiteNiveauFilter] = useState('');

  // ── Assignment drawer state ───────────────────────────────────────
  // When a row's "Assign" is clicked, we open a side drawer with the
  // module + promo context already locked in — no dropdown hunting.
  const [assignDrawer, setAssignDrawer] = useState(null);
  // shape: { module: {id, nom}, promo: {id, nom} } | null

  // Required teaching types per module (used to compute "Missing/Partial/Full")
  // Adjust the set if your curriculum uses different slot types.
  const REQUIRED_SLOT_TYPES = ['cours', 'td', 'tp'];

  const moduleAssignmentStatus = (mod) => {
    const types = new Set((mod?.enseignements || []).map((e) => String(e.type).toLowerCase()));
    if (types.size === 0) return 'missing';
    const fullySet = REQUIRED_SLOT_TYPES.every((t) => types.has(t));
    if (fullySet) return 'full';
    return 'partial';
  };

  const STATUS_STYLES = {
    full:    { label: 'Assigned',  className: 'bg-success/10 text-success border-success/30' },
    partial: { label: 'Partial',   className: 'bg-warning/10 text-warning border-warning/30' },
    missing: { label: 'Missing',   className: 'bg-danger/10 text-danger border-danger/30' },
  };
  const [promoForm, setPromoForm] = useState({ nom: '', section: '', specialiteId: '' });
  const [moduleForm, setModuleForm] = useState({ promoId: '', nom: '', semestre: '' });
  const [enseignementForm, setEnseignementForm] = useState({
    moduleId: '',
    promoId: '',
    enseignantId: '',
    type: 'cours',
  });

  const [saving, setSaving] = useState({
    year: false,
    specialite: false,
    promo: false,
    module: false,
    enseignement: false,
  });

  const refresh = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [hierarchyRes, yearsRes, optionsRes, assignmentsRes] = await Promise.all([
        academicAPI.hierarchy(),
        academicAPI.listYears(),
        authAPI.adminGetAcademicOptions(),
        authAPI.adminGetAcademicAssignments(),
      ]);
      const tree = Array.isArray(hierarchyRes?.data) ? hierarchyRes.data : [];
      setTree(tree);
      setAcademicYears(Array.isArray(yearsRes?.data) ? yearsRes.data : []);
      setLegacyOptions({
        specialites: Array.isArray(optionsRes?.data?.specialites) ? optionsRes.data.specialites : [],
        promos: Array.isArray(optionsRes?.data?.promos) ? optionsRes.data.promos : [],
        modules: Array.isArray(optionsRes?.data?.modules) ? optionsRes.data.modules : [],
      });
      setTeachers(Array.isArray(assignmentsRes?.data?.teachers) ? assignmentsRes.data.teachers : []);

      // Auto-select the active year (or the first one) on first load.
      setActiveYearId((prev) => {
        if (prev && tree.some((y) => y.id === prev)) return prev;
        const active = tree.find((y) => y.isActive);
        return active?.id ?? tree[0]?.id ?? null;
      });
    } catch (err) {
      setError(err.message || 'Failed to load academic structure.');
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  const togglePromo = (promoId) => {
    setExpandedPromos((prev) => ({ ...prev, [promoId]: !prev[promoId] }));
  };

  const activeYear = useMemo(
    () => tree.find((y) => y.id === activeYearId) || null,
    [tree, activeYearId]
  );

  const promosForActiveYear = activeYear?.promos || [];

  // ── Year actions ─────────────────────────────────────────────
  const createYear = async () => {
    const name = yearForm.name.trim();
    if (!name) {
      setError('Year name is required (e.g. 2025-2026).');
      return;
    }
    setSaving((prev) => ({ ...prev, year: true }));
    setError('');
    setMessage('');
    try {
      await academicAPI.createYear({ name, isActive: !!yearForm.isActive });
      setYearForm({ name: '', isActive: false });
      setMessage(`Academic year "${name}" created.`);
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to create academic year.');
    } finally {
      setSaving((prev) => ({ ...prev, year: false }));
    }
  };

  const activateYear = async (id) => {
    setError('');
    setMessage('');
    try {
      await academicAPI.activateYear(id);
      setMessage('Academic year activated.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to activate year.');
    }
  };

  const deleteYear = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this academic year?')) return;
    setError('');
    setMessage('');
    try {
      await academicAPI.deleteYear(id);
      setMessage('Academic year deleted.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to delete year.');
    }
  };

  // ── Specialite actions ───────────────────────────────────────
  // Specialité = the catalog entry every promo must reference.
  // niveau (L1..M2) is enforced server-side; filiereId is optional.
  const createSpecialite = async () => {
    const nom = specialiteForm.nom.trim();
    if (!nom) {
      setError('Specialité name is required.');
      return;
    }
    setSaving((prev) => ({ ...prev, specialite: true }));
    setError('');
    setMessage('');
    try {
      const payload = { nom };
      if (specialiteForm.niveau) payload.niveau = specialiteForm.niveau;
      if (specialiteForm.filiereId) payload.filiereId = Number(specialiteForm.filiereId);

      await authAPI.adminCreateSpecialite(payload);
      setSpecialiteForm({ nom: '', niveau: '', filiereId: '' });
      setMessage(`Specialité "${nom}" created. You can now add promos to it.`);
      await refresh(true);
    } catch (err) {
      setError(err?.data?.error?.message || err.message || 'Failed to create specialité.');
    } finally {
      setSaving((prev) => ({ ...prev, specialite: false }));
    }
  };

  // ── Promo actions ────────────────────────────────────────────
  const createPromo = async () => {
    if (!activeYear) {
      setError('Pick an academic year first.');
      return;
    }
    if (!promoForm.specialiteId) {
      setError('Select a specialite for the promo.');
      return;
    }
    setSaving((prev) => ({ ...prev, promo: true }));
    setError('');
    setMessage('');
    try {
      await authAPI.adminCreatePromo({
        nom: promoForm.nom.trim() || undefined,
        section: promoForm.section.trim() || undefined,
        anneeUniversitaire: activeYear.name,
        specialiteId: Number(promoForm.specialiteId),
      });
      setPromoForm({ nom: '', section: '', specialiteId: '' });
      setMessage('Promo created.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to create promo.');
    } finally {
      setSaving((prev) => ({ ...prev, promo: false }));
    }
  };

  // ── Module actions ───────────────────────────────────────────
  const createModule = async () => {
    if (!moduleForm.promoId) {
      setError('Select a promo to attach the module to.');
      return;
    }
    if (!moduleForm.nom.trim()) {
      setError('Module name is required.');
      return;
    }
    const promo = promosForActiveYear.find((p) => p.id === Number(moduleForm.promoId));
    if (!promo?.specialiteId) {
      setError('Selected promo has no specialite — cannot derive module scope.');
      return;
    }
    setSaving((prev) => ({ ...prev, module: true }));
    setError('');
    setMessage('');
    try {
      // Module code is auto-generated server-side for parity with the legacy
      // schema (which still requires it). We hide it from the UI per spec —
      // a slug from the promo + name keeps it unique without admin input.
      const codeSlug =
        `M${promo.id}-` +
        moduleForm.nom
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '')
          .slice(0, 8) +
        `-${Date.now().toString(36).slice(-4)}`;

      await academicAPI.createModule({
        nom_ar: moduleForm.nom.trim(),
        code: codeSlug,
        // promoId is the NEW direct parent — backend derives specialiteId
        // from this promo so the module truly "lives inside" the promo.
        // specialiteId is also passed for backward-compat with older API
        // clients; the server uses promoId when both are present.
        promoId: Number(moduleForm.promoId),
        specialiteId: promo.specialiteId,
        semestre: moduleForm.semestre ? Number(moduleForm.semestre) : undefined,
      });
      setModuleForm({ promoId: moduleForm.promoId, nom: '', semestre: '' });
      setMessage('Module created.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to create module.');
    } finally {
      setSaving((prev) => ({ ...prev, module: false }));
    }
  };

  const deleteModule = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this module?')) return;
    setError('');
    setMessage('');
    try {
      await academicAPI.deleteModule(id);
      setMessage('Module deleted.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to delete module.');
    }
  };

  // ── Enseignement (TD/TP/COURS/ONLINE assignment) ─────────────
  const createEnseignement = async () => {
    if (!activeYear) {
      setError('Pick an academic year first.');
      return;
    }
    if (!enseignementForm.moduleId || !enseignementForm.promoId || !enseignementForm.enseignantId) {
      setError('Module, promo, and teacher are required.');
      return;
    }
    setSaving((prev) => ({ ...prev, enseignement: true }));
    setError('');
    setMessage('');
    try {
      await academicAPI.createEnseignement({
        enseignantId: Number(enseignementForm.enseignantId),
        moduleId: Number(enseignementForm.moduleId),
        promoId: Number(enseignementForm.promoId),
        type: enseignementForm.type,
        academicYearId: activeYear.id,
      });
      setEnseignementForm({ moduleId: '', promoId: '', enseignantId: '', type: 'cours' });
      setMessage('Teaching assignment added.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to create enseignement.');
    } finally {
      setSaving((prev) => ({ ...prev, enseignement: false }));
    }
  };

  const deleteEnseignement = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Remove this teaching assignment?')) return;
    setError('');
    setMessage('');
    try {
      await academicAPI.deleteEnseignement(id);
      setMessage('Teaching assignment removed.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to remove assignment.');
    }
  };

  if (authLoading || loading) {
    return <div className="rounded-2xl border border-edge bg-surface p-6">Loading academic structure…</div>;
  }

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-edge-strong bg-danger/10 p-6 text-danger">
        Restricted area.
      </div>
    );
  }

  // ── KPI roll-up (cheap — derived from already-loaded data) ──────────
  const kpis = (() => {
    const totalSpecialites = legacyOptions.specialites.length;
    const totalPromos = legacyOptions.promos.length;
    const totalModules = legacyOptions.modules.length;
    const totalEnrollments = tree.reduce((sum, year) => {
      return sum + (year.promos || []).reduce((s, p) => s + (p.studentCount || p.etudiants?.length || 0), 0);
    }, 0);
    const activeYearName = tree.find((y) => y.isActive)?.name || '—';
    return { totalSpecialites, totalPromos, totalModules, totalEnrollments, activeYearName };
  })();

  return (
    <div className="space-y-4 max-w-[1600px] min-w-0">
      {/* ── Compact ERP Header (replaces giant hero) ─────────────────────
          Title + breadcrumb left, quick actions right. One row. */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-edge-subtle pb-3">
        <div className="min-w-0">
          <nav className="flex items-center gap-1.5 text-xs text-ink-tertiary">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="hover:text-brand transition-colors"
            >
              Admin
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-ink-secondary">Academic Structure</span>
          </nav>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-ink">
            Academic Structure
            <span className="ml-2 inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand">
              {kpis.activeYearName}
            </span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate('/dashboard/admin/academic/assignments')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary hover:border-brand/40 hover:bg-brand/5 hover:text-brand transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            Assignments
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/admin/users')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary hover:border-brand/40 hover:bg-brand/5 hover:text-brand transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Users
          </button>
        </div>
      </header>

      {/* ── KPI Strip (4 compact stats, modern dashboard style) ───────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Specialités', value: kpis.totalSpecialites, Icon: GraduationCap, accent: 'text-brand bg-brand/10' },
          { label: 'Promos',      value: kpis.totalPromos,      Icon: Layers,        accent: 'text-success bg-success/10' },
          { label: 'Modules',     value: kpis.totalModules,     Icon: BookOpen,      accent: 'text-warning bg-warning/10' },
          { label: 'Enrolled',    value: kpis.totalEnrollments, Icon: Users,         accent: 'text-info bg-info/10' },
        ].map((k) => (
          <div
            key={k.label}
            className="group flex items-center gap-3 rounded-xl border border-edge bg-surface px-3 py-2.5 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${k.accent}`}>
              <k.Icon className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                {k.label}
              </p>
              <p className="text-lg font-bold leading-tight text-ink">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {message ? (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-edge-strong bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      {/* ── Step 1: Academic Year ────────────────────────────── */}
      <section className="rounded-xl border border-edge bg-surface p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <CalendarRange className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink">Step 1 · Academic Year</h2>
              <p className="text-sm text-ink-secondary">Select a year to drill into. Only one year can be active at a time.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <input
              className={`${inputClass} max-w-[14rem]`}
              placeholder="2025-2026"
              value={yearForm.name}
              onChange={(e) => setYearForm((p) => ({ ...p, name: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={yearForm.isActive}
                onChange={(e) => setYearForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Set active
            </label>
            <button
              type="button"
              onClick={createYear}
              disabled={saving.year}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> {saving.year ? 'Saving…' : 'Create year'}
            </button>
          </div>
        </div>

        {tree.length === 0 ? (
          <p className="text-sm text-ink-secondary">No academic years yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tree.map((year) => {
              const isSelected = year.id === activeYearId;
              return (
                <div
                  key={`year-pill-${year.id}`}
                  className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                    isSelected
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-edge bg-canvas text-ink-secondary hover:border-brand/40 hover:text-brand'
                  }`}
                >
                  <button type="button" onClick={() => setActiveYearId(year.id)} className="flex items-center gap-2">
                    <span className="font-semibold">{year.name}</span>
                    {year.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : null}
                    <span className="text-xs text-ink-tertiary">{year.promos?.length || 0} promos</span>
                  </button>
                  {!year.isActive ? (
                    <button
                      type="button"
                      onClick={() => activateYear(year.id)}
                      className="rounded-md border border-edge px-2 py-0.5 text-xs text-ink-secondary opacity-0 transition group-hover:opacity-100 hover:border-brand/40 hover:text-brand"
                    >
                      Activate
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => deleteYear(year.id)}
                    className="rounded-md p-1 text-ink-tertiary opacity-0 transition group-hover:opacity-100 hover:text-danger"
                    aria-label="Delete year"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Step 1.5: Specialités catalog ─────────────────────
          A specialité is the catalog entry every promo references. Without
          at least one, the promo dropdown stays empty and you can't move
          forward. We surface count + create form together so the admin
          sees the gap immediately. */}
      <section className="rounded-xl border border-edge bg-surface p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <GraduationCap className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink">
                Step 1.5 · Specialités
              </h2>
              <p className="text-sm text-ink-secondary">
                {legacyOptions.specialites.length} specialité
                {legacyOptions.specialites.length !== 1 ? 's' : ''} in the catalog ·
                used as the parent of every promo.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <input
              className={`${inputClass} max-w-[14rem]`}
              placeholder="Specialité name (e.g. Génie Logiciel)"
              value={specialiteForm.nom}
              onChange={(e) => setSpecialiteForm((p) => ({ ...p, nom: e.target.value }))}
            />
            <select
              className={`${inputClass} max-w-[8rem]`}
              value={specialiteForm.niveau}
              onChange={(e) => setSpecialiteForm((p) => ({ ...p, niveau: e.target.value }))}
            >
              <option value="">Level (optional)</option>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
              <option value="M1">M1</option>
              <option value="M2">M2</option>
            </select>
            <input
              className={`${inputClass} max-w-[8rem]`}
              placeholder="Filière ID"
              value={specialiteForm.filiereId}
              onChange={(e) => setSpecialiteForm((p) => ({ ...p, filiereId: e.target.value }))}
              type="number"
              min="1"
            />
            <button
              type="button"
              onClick={createSpecialite}
              disabled={saving.specialite}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> {saving.specialite ? 'Saving…' : 'Add specialité'}
            </button>
          </div>
        </div>

        {legacyOptions.specialites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-edge bg-canvas/40 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-ink">No specialités yet</p>
            <p className="mt-1 text-xs text-ink-tertiary">
              Create your first specialité above — promos cannot be created without one.
            </p>
          </div>
        ) : (
          <>
            {/* Compact search + level filter — keeps the list scannable even
                when there are dozens of specialités. */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={specialiteSearch}
                onChange={(e) => setSpecialiteSearch(e.target.value)}
                placeholder="Search specialités…"
                className={`${inputClass} flex-1 min-w-[200px] max-w-xs`}
              />
              <select
                value={specialiteNiveauFilter}
                onChange={(e) => setSpecialiteNiveauFilter(e.target.value)}
                className={`${inputClass} max-w-[8rem]`}
              >
                <option value="">All levels</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
              </select>
              {(specialiteSearch || specialiteNiveauFilter) && (
                <button
                  type="button"
                  onClick={() => { setSpecialiteSearch(''); setSpecialiteNiveauFilter(''); }}
                  className="text-xs font-medium text-ink-tertiary hover:text-brand"
                >
                  Clear
                </button>
              )}
            </div>

            {(() => {
              const q = specialiteSearch.trim().toLowerCase();
              const filtered = legacyOptions.specialites.filter((s) => {
                if (specialiteNiveauFilter && s.niveau !== specialiteNiveauFilter) return false;
                if (!q) return true;
                const name = String(s.nom || '').toLowerCase();
                const nameEn = String(s.nom_en || '').toLowerCase();
                return name.includes(q) || nameEn.includes(q);
              });

              if (filtered.length === 0) {
                return (
                  <p className="text-xs text-ink-tertiary">
                    No specialités match your filter.
                  </p>
                );
              }

              return (
                <>
                  {/* Scrollable container — caps height so the page stays usable
                      even with 50+ specialités. Pills wrap naturally inside. */}
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-edge-subtle bg-canvas/30 p-2">
                    <div className="flex flex-wrap gap-1.5">
                      {filtered.map((s) => {
                        const promoCount = legacyOptions.promos.filter(
                          (p) => p.specialiteId === s.id
                        ).length;
                        const moduleCount = legacyOptions.modules.filter(
                          (m) => m.specialiteId === s.id
                        ).length;
                        return (
                          <div
                            key={`spec-pill-${s.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-2 py-1 text-xs text-ink-secondary"
                            title={`${promoCount} promos · ${moduleCount} modules`}
                          >
                            <span className="font-semibold text-ink">{s.nom}</span>
                            {s.niveau ? (
                              <span className="inline-flex items-center rounded bg-brand/10 px-1 py-0 text-[9px] font-bold text-brand">
                                {s.niveau}
                              </span>
                            ) : null}
                            <span className="text-[10px] text-ink-tertiary">
                              {promoCount}p · {moduleCount}m
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-tertiary">
                    Showing {filtered.length} of {legacyOptions.specialites.length}
                  </p>
                </>
              );
            })()}
          </>
        )}
      </section>

      {/* ── Step 2 & 3: Promos and Modules tree ──────────────── */}
      {activeYear ? (
        <>
          <section className="rounded-xl border border-edge bg-surface p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Layers className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-ink">
                    Step 2 · Promos in {activeYear.name}
                  </h2>
                  <p className="text-sm text-ink-secondary">
                    Each promo holds modules and student enrollments.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <select
                  className={`${inputClass} max-w-[12rem]`}
                  value={promoForm.specialiteId}
                  onChange={(e) => setPromoForm((p) => ({ ...p, specialiteId: e.target.value }))}
                >
                  <option value="">Specialite (internal)</option>
                  {legacyOptions.specialites.map((s) => (
                    <option key={`promo-spec-${s.id}`} value={s.id}>
                      {s.nom} {s.niveau ? `· ${s.niveau}` : ''}
                    </option>
                  ))}
                </select>
                <input
                  className={`${inputClass} max-w-[12rem]`}
                  placeholder="Promo name"
                  value={promoForm.nom}
                  onChange={(e) => setPromoForm((p) => ({ ...p, nom: e.target.value }))}
                />
                <input
                  className={`${inputClass} max-w-[8rem]`}
                  placeholder="Section"
                  value={promoForm.section}
                  onChange={(e) => setPromoForm((p) => ({ ...p, section: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={createPromo}
                  disabled={saving.promo}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" /> {saving.promo ? 'Saving…' : 'Add promo'}
                </button>
              </div>
            </div>

            {promosForActiveYear.length === 0 ? (
              <p className="text-sm text-ink-secondary">
                No promos in this academic year. Add one above.
              </p>
            ) : (
              <ul className="space-y-3">
                {promosForActiveYear.map((promo) => {
                  const open = !!expandedPromos[promo.id];
                  return (
                    <li
                      key={`promo-${promo.id}`}
                      className="overflow-hidden rounded-xl border border-edge bg-canvas/50 transition hover:border-brand/30"
                    >
                      <button
                        type="button"
                        onClick={() => togglePromo(promo.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        {open ? (
                          <ChevronDown className="h-4 w-4 text-ink-tertiary" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-ink-tertiary" />
                        )}
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <GraduationCap className="h-4 w-4" />
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-ink">{promoLabel(promo)}</p>
                          <p className="text-xs text-ink-tertiary">
                            {promo.section ? `Section ${promo.section} · ` : ''}
                            {promo.niveau ? `${promo.niveau} · ` : ''}
                            {promo.modules?.length || 0} module(s) · {promo.studentCount || 0} student(s)
                            {(() => {
                              const mods = promo.modules || [];
                              if (mods.length === 0) return null;
                              const full = mods.filter((m) => moduleAssignmentStatus(m) === 'full').length;
                              const missing = mods.filter((m) => moduleAssignmentStatus(m) === 'missing').length;
                              return (
                                <span className="ml-2 inline-flex items-center gap-1">
                                  <span className="text-success font-semibold">{full}✓</span>
                                  {missing > 0 && (
                                    <span className="text-danger font-semibold">{missing}✗</span>
                                  )}
                                </span>
                              );
                            })()}
                          </p>
                        </div>
                      </button>

                      {open ? (
                        <div className="border-t border-edge bg-surface px-5 pb-5 pt-4 space-y-4">
                          {/* Modules under promo */}
                          {promo.modules.length === 0 ? (
                            <p className="text-sm text-ink-secondary">No modules attached yet.</p>
                          ) : (
                            <div className="overflow-hidden rounded-lg border border-edge">
                              <table className="min-w-full divide-y divide-edge text-sm">
                                <thead className="bg-canvas/60 text-xs uppercase tracking-wide text-ink-tertiary sticky top-0">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Module</th>
                                    <th className="px-3 py-2 text-left">Sem.</th>
                                    <th className="px-3 py-2 text-left">Status</th>
                                    <th className="px-3 py-2 text-left">Teaching slots</th>
                                    <th className="px-3 py-2 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-edge">
                                  {promo.modules.map((mod) => {
                                    const statusKey = moduleAssignmentStatus(mod);
                                    const statusStyle = STATUS_STYLES[statusKey];
                                    return (
                                    <tr key={`mod-${promo.id}-${mod.id}`} className="bg-surface hover:bg-canvas/40 transition-colors">
                                      <td className="px-3 py-2 font-medium text-ink">
                                        <div className="flex items-center gap-2">
                                          <BookOpen className="h-4 w-4 text-brand" />
                                          {moduleLabel(mod)}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-ink-secondary">{mod.semestre ?? '—'}</td>
                                      <td className="px-3 py-2">
                                        <span
                                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyle.className}`}
                                        >
                                          {statusStyle.label}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2">
                                        {mod.enseignements.length === 0 ? (
                                          <span className="text-xs text-ink-tertiary italic">— None</span>
                                        ) : (
                                          <div className="flex flex-wrap gap-1.5">
                                            {mod.enseignements.map((slot) => (
                                              <span
                                                key={`slot-${slot.id}`}
                                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                                                  TYPE_BADGE[slot.type] || 'bg-canvas text-ink-secondary border-edge'
                                                }`}
                                              >
                                                <span className="font-semibold uppercase">{slot.type}</span>
                                                {slot.teacher ? (
                                                  <span>
                                                    {slot.teacher.prenom} {slot.teacher.nom}
                                                  </span>
                                                ) : null}
                                                <button
                                                  type="button"
                                                  onClick={() => deleteEnseignement(slot.id)}
                                                  className="ml-1 text-ink-tertiary hover:text-danger"
                                                  aria-label="Remove assignment"
                                                >
                                                  ×
                                                </button>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <div className="inline-flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => setAssignDrawer({ module: mod, promo })}
                                            className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-surface hover:bg-brand-hover"
                                            title="Assign a teacher to this module"
                                          >
                                            <Plus className="h-3 w-3" /> Assign
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => deleteModule(mod.id)}
                                            className="inline-flex items-center gap-1 rounded-md border border-edge bg-surface px-2 py-1 text-xs text-danger hover:bg-danger/10"
                                            title="Delete module"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );})}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Add module form (Step 3) */}
                          <div className="rounded-lg border border-dashed border-edge bg-canvas/40 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                              Add a module to this promo
                            </p>
                            <div className="flex flex-wrap items-end gap-2">
                              <input
                                className={`${inputClass} max-w-[16rem]`}
                                placeholder="Module name"
                                value={moduleForm.promoId === String(promo.id) ? moduleForm.nom : ''}
                                onChange={(e) =>
                                  setModuleForm({
                                    promoId: String(promo.id),
                                    nom: e.target.value,
                                    semestre:
                                      moduleForm.promoId === String(promo.id) ? moduleForm.semestre : '',
                                  })
                                }
                              />
                              <input
                                className={`${inputClass} max-w-[6rem]`}
                                type="number"
                                min={1}
                                max={12}
                                placeholder="Sem."
                                value={moduleForm.promoId === String(promo.id) ? moduleForm.semestre : ''}
                                onChange={(e) =>
                                  setModuleForm({
                                    promoId: String(promo.id),
                                    nom: moduleForm.promoId === String(promo.id) ? moduleForm.nom : '',
                                    semestre: e.target.value,
                                  })
                                }
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setModuleForm((prev) => ({ ...prev, promoId: String(promo.id) }));
                                  createModule();
                                }}
                                disabled={saving.module}
                                className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-surface hover:bg-brand-hover disabled:opacity-60"
                              >
                                <Plus className="h-3 w-3" /> {saving.module ? 'Saving…' : 'Add module'}
                              </button>
                            </div>
                          </div>

                          {/* Step 4: assign teaching type */}
                          {promo.modules.length > 0 ? (
                            <div className="rounded-lg border border-dashed border-edge bg-canvas/40 p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                                Step 4 · Assign teaching slot (TD / TP / COURS / ONLINE)
                              </p>
                              <div className="flex flex-wrap items-end gap-2">
                                <select
                                  className={`${inputClass} max-w-[14rem]`}
                                  value={
                                    enseignementForm.promoId === String(promo.id) ? enseignementForm.moduleId : ''
                                  }
                                  onChange={(e) =>
                                    setEnseignementForm({
                                      ...enseignementForm,
                                      promoId: String(promo.id),
                                      moduleId: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select module</option>
                                  {promo.modules.map((m) => (
                                    <option key={`as-mod-${m.id}`} value={m.id}>
                                      {moduleLabel(m)}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className={`${inputClass} max-w-[14rem]`}
                                  value={
                                    enseignementForm.promoId === String(promo.id)
                                      ? enseignementForm.enseignantId
                                      : ''
                                  }
                                  onChange={(e) =>
                                    setEnseignementForm({
                                      ...enseignementForm,
                                      promoId: String(promo.id),
                                      enseignantId: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select teacher</option>
                                  {teachers.map((t) => (
                                    <option key={`as-tch-${t.id}`} value={t.id}>
                                      {t.prenom} {t.nom}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className={`${inputClass} max-w-[8rem]`}
                                  value={enseignementForm.type}
                                  onChange={(e) =>
                                    setEnseignementForm({
                                      ...enseignementForm,
                                      promoId: String(promo.id),
                                      type: e.target.value,
                                    })
                                  }
                                >
                                  {TYPE_OPTIONS.map((opt) => (
                                    <option key={`as-type-${opt.value}`} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEnseignementForm((prev) => ({ ...prev, promoId: String(promo.id) }));
                                    createEnseignement();
                                  }}
                                  disabled={saving.enseignement}
                                  className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-surface hover:bg-brand-hover disabled:opacity-60"
                                >
                                  <Users className="h-3 w-3" /> {saving.enseignement ? 'Saving…' : 'Assign'}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="text-xs text-ink-tertiary">
            {refreshing ? 'Refreshing data…' : 'Tree mirrors the active database state.'}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-edge bg-surface p-6 text-sm text-ink-secondary">
          Create or pick an academic year to manage its promos and modules.
        </div>
      )}

      {/* ── Assignment side drawer ─────────────────────────────────────
          Module + promo context is locked in (no hunting through dropdowns).
          Admin only picks teacher + type. */}
      {assignDrawer && (
        <AssignmentDrawer
          module={assignDrawer.module}
          promo={assignDrawer.promo}
          academicYearId={activeYear?.id}
          teachers={teachers}
          onClose={() => setAssignDrawer(null)}
          onSaved={async () => {
            await refresh(true);
            setAssignDrawer(null);
          }}
        />
      )}
    </div>
  );
}

/* ── Side drawer for assigning a teacher to a specific module ──────────
   Modern slide-in panel, sticky footer, workload preview built inline. */
function AssignmentDrawer({ module, promo, academicYearId, teachers, onClose, onSaved }) {
  const [teacherId, setTeacherId] = useState('');
  const [type, setType] = useState('cours');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const fn = `${t.prenom || ''} ${t.nom || ''} ${t.email || ''}`.toLowerCase();
      return fn.includes(q);
    });
  }, [teachers, search]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => String(t.id) === String(teacherId)) || null,
    [teachers, teacherId]
  );

  // Workload of the selected teacher across all promos (counted from current
  // tree). Cheap and good enough for an "is this person overloaded?" hint.
  const teacherWorkload = useMemo(() => {
    if (!selectedTeacher) return null;
    const count = (selectedTeacher.enseignements || []).length;
    const distinctPromos = new Set((selectedTeacher.enseignements || []).map((e) => e.promoId)).size;
    return { slots: count, promos: distinctPromos };
  }, [selectedTeacher]);

  const handleSave = async () => {
    if (!teacherId) {
      setErr('Pick a teacher first.');
      return;
    }
    if (!academicYearId) {
      setErr('No active academic year.');
      return;
    }
    setErr('');
    setSaving(true);
    try {
      await academicAPI.createEnseignement({
        enseignantId: Number(teacherId),
        moduleId: Number(module.id),
        promoId: Number(promo.id),
        type,
        academicYearId,
      });
      if (onSaved) await onSaved();
    } catch (e) {
      setErr(e?.message || 'Failed to assign teacher.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md bg-surface shadow-2xl border-l border-edge flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-edge-subtle">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand">Assign Teacher</p>
            <h2 className="mt-1 text-base font-bold text-ink truncate">
              {moduleLabel(module)}
            </h2>
            <p className="text-xs text-ink-tertiary truncate">
              {promoLabel(promo)} {promo.niveau ? `· ${promo.niveau}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-tertiary hover:bg-canvas hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {err && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {err}
            </div>
          )}

          {/* Teacher search + select */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
              Teacher
            </label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teacher by name or email…"
              className={inputClass}
            />
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-edge-subtle divide-y divide-edge-subtle">
              {filteredTeachers.length === 0 ? (
                <p className="px-3 py-3 text-xs text-ink-tertiary text-center">No teachers match.</p>
              ) : (
                filteredTeachers.map((t) => {
                  const active = String(t.id) === String(teacherId);
                  return (
                    <button
                      key={`drawer-t-${t.id}`}
                      type="button"
                      onClick={() => setTeacherId(String(t.id))}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        active ? 'bg-brand/10 text-brand' : 'bg-surface text-ink hover:bg-canvas'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate font-medium">
                        {t.prenom} {t.nom}
                      </span>
                      <span className="ml-auto text-[11px] text-ink-tertiary truncate max-w-[8rem]">
                        {t.email}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Type chips */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
              Slot type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_OPTIONS.map((opt) => {
                const active = type === opt.value;
                return (
                  <button
                    key={`drawer-type-${opt.value}`}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all ${
                      active
                        ? (TYPE_BADGE[opt.value] || 'bg-brand/10 text-brand border-brand/30') + ' ring-2 ring-brand/30'
                        : 'bg-canvas text-ink-secondary border-edge hover:border-brand/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workload preview (when a teacher is selected) */}
          {selectedTeacher && teacherWorkload && (
            <div className="rounded-lg border border-edge bg-canvas/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary mb-1.5">
                Workload preview
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="font-bold text-ink">{teacherWorkload.slots}</p>
                  <p className="text-[10px] text-ink-tertiary uppercase">Active slots</p>
                </div>
                <div>
                  <p className="font-bold text-ink">{teacherWorkload.promos}</p>
                  <p className="text-[10px] text-ink-tertiary uppercase">Promos</p>
                </div>
              </div>
              {teacherWorkload.slots >= 8 && (
                <p className="mt-2 text-[11px] text-warning flex items-center gap-1">
                  <AlertCircleIcon /> Possible overload — already {teacherWorkload.slots} slots.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-5 py-3 border-t border-edge-subtle bg-surface-200/30 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-edge bg-surface text-ink hover:bg-surface-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !teacherId}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-brand text-surface hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Tiny inline warning icon (avoid pulling another lucide import just for this).
function AlertCircleIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
