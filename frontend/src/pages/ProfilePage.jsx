/*
  Profile page — modern card-based layout (Notion/Stripe style).
  Identity card + Editable info card + Read-only contact card.
  Editing is limited to phone number and avatar; everything else is admin-managed.
*/

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Pencil,
  Phone,
  Mail,
  Building2,
  GraduationCap,
  Shield,
  Calendar,
  CheckCircle2,
  Camera,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import request, { authAPI, resolveMediaUrl } from '../services/api';

/* ── Helpers ────────────────────────────────────────────────── */

const PHONE_PATTERN = /^\+?[\d\s().-]{6,20}$/;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isStudentRole(roles) {
  if (!roles) return true;
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr.some((r) => ['STUDENT', 'etudiant'].includes(r.toUpperCase ? r.toUpperCase() : r));
}

/* ── Page ──────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, fetchUser } = useAuth();
  const location = useLocation();
  const selectedStudentProfile = location.state?.selectedStudentProfile;
  const selectedStudentEtudiantId = Number(
    selectedStudentProfile?.studentEtudiantId || selectedStudentProfile?.etudiantId || 0
  );

  const [selectedStudentData, setSelectedStudentData] = useState(null);
  const [selectedStudentLoading, setSelectedStudentLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const etudiantId = selectedStudentEtudiantId;
    if (!etudiantId || !Number.isInteger(etudiantId) || etudiantId <= 0) {
      setSelectedStudentData(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setSelectedStudentLoading(true);
        const res = await request(`/api/v1/disciplinary/students/${etudiantId}/profile`);
        if (!cancelled) setSelectedStudentData(res?.data || null);
      } catch {
        if (!cancelled) setSelectedStudentData(null);
      } finally {
        if (!cancelled) setSelectedStudentLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedStudentEtudiantId]);

  if (!user) return null;

  const student = isStudentRole(user.roles);
  const rolePretty = (user.roles?.[0] || 'etudiant').replace(/_/g, ' ');

  const dept = user.etudiant?.promo?.specialite?.filiere?.departement?.nom || '—';
  const spec = user.etudiant?.promo?.specialite?.nom || '—';
  const selectedUser = selectedStudentData?.user || null;
  const selectedDepartment =
    selectedStudentData?.promo?.specialite?.filiere?.departement?.nom ||
    selectedStudentProfile?.department ||
    '—';
  const selectedSpeciality = selectedStudentData?.promo?.specialite?.nom || '—';
  const isViewingSelectedStudent = Boolean(selectedStudentProfile);

  const pageUser = isViewingSelectedStudent && selectedUser ? selectedUser : user;
  const pageInitials = `${(pageUser?.prenom || '?')[0]}${(pageUser?.nom || '?')[0]}`.toUpperCase();
  const pagePhotoUrl = resolveMediaUrl(pageUser?.photo);
  const pageRolePretty = isViewingSelectedStudent ? 'etudiant' : rolePretty;
  const pageDepartment = isViewingSelectedStudent ? selectedDepartment : dept;
  const pageSpeciality = isViewingSelectedStudent ? selectedSpeciality : spec;

  const canEdit = !isViewingSelectedStudent;

  return (
    <div className="space-y-6 max-w-4xl min-w-0 mx-auto">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-ink-tertiary">
            {isViewingSelectedStudent
              ? 'Student academic identity and personal information.'
              : 'Your academic identity and personal information.'}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink-secondary shadow-sm hover:bg-surface-200 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit profile
          </button>
        )}
      </div>

      {selectedStudentProfile && (
        <div className="rounded-xl border border-edge-strong bg-brand/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Selected Student</p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {selectedUser
              ? `${selectedUser.prenom || ''} ${selectedUser.nom || ''}`.trim()
              : selectedStudentProfile.name || 'Unknown student'}
          </p>
          <p className="text-xs text-ink-tertiary">
            {selectedStudentProfile.studentId || 'N/A'} · {selectedStudentProfile.department || 'N/A'}
          </p>
          {selectedStudentLoading && (
            <p className="mt-2 text-xs text-ink-muted">Loading full student profile…</p>
          )}
        </div>
      )}

      {/* ── Identity Header Card ────────────────────────────── */}
      <section className="relative bg-surface rounded-2xl border border-edge shadow-card overflow-hidden">
        <div className="px-6 pt-6 pb-6">
          <div className="relative z-10 flex items-end gap-4">
            {pagePhotoUrl ? (
              <img
                src={pagePhotoUrl}
                alt={`${pageUser?.prenom || ''} ${pageUser?.nom || ''}`.trim() || 'Profile'}
                className="w-24 h-24 rounded-full object-cover border-4 border-surface shadow-card bg-surface"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/Logo.png';
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-light border-4 border-surface flex items-center justify-center shadow-card">
                <span className="text-2xl font-bold text-brand">{pageInitials}</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-bold text-ink tracking-tight">
              {pageUser?.prenom} {pageUser?.nom}
            </h2>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand capitalize">
                <Shield className="w-3 h-3" />
                {pageRolePretty}
              </span>
              {pageDepartment && pageDepartment !== '—' && (
                <span className="text-sm text-ink-secondary">{pageDepartment}</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Active
              </span>
              <span className="text-xs text-ink-muted">
                Member since {formatDate(pageUser?.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two-column info ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard title="Academic Information" Icon={GraduationCap}>
          <InfoRow Icon={Shield} label="Role" value={pageRolePretty} />
          <InfoRow Icon={Building2} label="Department" value={pageDepartment} />
          {(student || isViewingSelectedStudent) && (
            <InfoRow Icon={GraduationCap} label="Speciality" value={pageSpeciality} />
          )}
          <InfoRow
            Icon={CheckCircle2}
            label="Email Verified"
            value={pageUser?.emailVerified ? 'Yes' : 'Not yet'}
          />
          <InfoRow Icon={Calendar} label="Last Login" value={formatDate(pageUser?.lastLogin)} />
        </InfoCard>

        <InfoCard title="Contact" Icon={Mail}>
          <InfoRow Icon={Mail} label="Email" value={pageUser?.email} hint="Read-only — managed by admin" />
          <InfoRow
            Icon={Phone}
            label="Phone"
            value={pageUser?.telephone || '—'}
            hint={canEdit ? 'You can update your phone number.' : null}
          />
          <InfoRow
            Icon={Calendar}
            label="Account Created"
            value={formatDate(pageUser?.createdAt)}
          />
        </InfoCard>
      </div>

      {/* ── Edit modal ──────────────────────────────────────── */}
      {editOpen && canEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={async () => {
            await fetchUser();
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Info bits ─────────────────────────────────────────────── */
function InfoCard({ title, Icon, children }) {
  return (
    <section className="bg-surface rounded-2xl border border-edge shadow-card">
      <header className="px-6 py-4 border-b border-edge-subtle flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-ink-tertiary" />}
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      </header>
      <div className="px-6 py-2 divide-y divide-edge-subtle">{children}</div>
    </section>
  );
}

function InfoRow({ Icon, label, value, hint }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {Icon && <Icon className="w-4 h-4 text-ink-tertiary shrink-0 mt-0.5" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-sm font-medium text-ink mt-0.5 break-words">{value || '—'}</p>
        {hint && <p className="text-xs text-ink-tertiary mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

/* ── Edit modal ────────────────────────────────────────────── */
function EditProfileModal({ user, onClose, onSaved }) {
  const initialPhone = user?.telephone || '';
  const [phone, setPhone] = useState(initialPhone);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const fileInputRef = useRef(null);

  const phoneTrimmed = phone.trim();
  const phoneChanged = phoneTrimmed !== (initialPhone || '').trim();
  const phoneValid = phoneTrimmed === '' || PHONE_PATTERN.test(phoneTrimmed);
  const hasPendingChanges = phoneChanged || Boolean(photoFile);
  const saving = savingPhone || savingPhoto;
  const canSave = hasPendingChanges && phoneValid && !saving;

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const onPickPhoto = (event) => {
    setError('');
    const file = event.target?.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      setError('Only JPG, PNG or WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image cannot exceed 5 MB.');
      return;
    }
    setPhotoFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSave) return;

    setError('');
    setSuccess('');
    setPhoneError('');

    if (!phoneValid) {
      setPhoneError('Phone format looks invalid.');
      return;
    }

    try {
      if (photoFile) {
        setSavingPhoto(true);
        await authAPI.uploadProfilePhoto(photoFile);
        setSavingPhoto(false);
      }
      if (phoneChanged) {
        setSavingPhone(true);
        await authAPI.updateMyProfile({ telephone: phoneTrimmed || null });
        setSavingPhone(false);
      }
      setSuccess('Profile updated successfully');
      await onSaved();
    } catch (err) {
      setSavingPhone(false);
      setSavingPhoto(false);
      setError(err?.message || 'Failed to update profile.');
    }
  };

  const initial = `${(user?.prenom || '?')[0]}${(user?.nom || '?')[0]}`.toUpperCase();
  const currentPhotoUrl = photoPreview || resolveMediaUrl(user?.photo) || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="relative bg-surface rounded-2xl shadow-card border border-edge w-full max-w-lg"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <h2 className="text-lg font-semibold text-ink">Edit profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-ink-tertiary hover:text-ink hover:bg-surface-200 rounded-lg"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-5">
          {/* Avatar uploader */}
          <div className="flex items-center gap-4">
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt="Profile preview"
                className="w-20 h-20 rounded-full object-cover border-2 border-edge"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-light border-2 border-edge flex items-center justify-center">
                <span className="text-xl font-bold text-brand">{initial}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-surface-200"
              >
                <Camera className="w-4 h-4" />
                {photoFile ? 'Change selection' : 'Upload photo'}
              </button>
              <p className="text-xs text-ink-tertiary">JPG, PNG or WebP — max 5 MB.</p>
              {photoFile && (
                <button
                  type="button"
                  onClick={() => setPhotoFile(null)}
                  className="text-xs text-danger hover:underline"
                >
                  Discard new photo
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onPickPhoto}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="profile-phone" className="block text-xs font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">
              Phone number
            </label>
            <input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError('');
              }}
              placeholder="+213 555 12 34 56"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none transition focus:ring-2 ${
                phoneValid
                  ? 'border-edge focus:border-brand focus:ring-brand/30'
                  : 'border-danger focus:border-danger focus:ring-danger/30'
              }`}
            />
            {phoneError && <p className="text-xs text-danger mt-1">{phoneError}</p>}
            {!phoneError && !phoneValid && (
              <p className="text-xs text-danger mt-1">Phone format looks invalid.</p>
            )}
          </div>

          {/* Read-only fields */}
          <div className="rounded-lg bg-surface-200/60 px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-ink-tertiary">Email</span>
              <span className="font-medium text-ink-secondary">{user?.email}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ink-tertiary">Full name</span>
              <span className="font-medium text-ink-secondary">
                {`${user?.prenom || ''} ${user?.nom || ''}`.trim()}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted pt-1">
              Email and full name are managed by the administration.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-danger/5 border border-danger/30 px-3 py-2 text-sm text-danger">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg bg-success/5 border border-success/30 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-edge bg-surface-200/30 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-200 rounded-lg transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-surface bg-brand rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
        </footer>
      </form>
    </div>
  );
}
