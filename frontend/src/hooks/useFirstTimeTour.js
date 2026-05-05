import { useCallback, useEffect, useState } from 'react';

const STORAGE_PREFIX = 'tour:';

/**
 * Build the localStorage key for a given user + tour. Anonymous users get
 * a shared "guest" namespace so the tour still shows once on the public
 * pages (and doesn't leak between accounts on a shared machine).
 */
const buildKey = (userId, tourId) =>
  `${STORAGE_PREFIX}${userId || 'guest'}:${tourId}`;

const safeRead = (key) => {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
};

const safeWrite = (key, value) => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, value); } catch { /* private mode */ }
};

const safeRemove = (key) => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(key); } catch { /* private mode */ }
};

/**
 * useFirstTimeTour — show a tour exactly once per (user, tourId).
 *
 * Returns:
 *   open       — whether the tour modal should render right now
 *   markSeen   — call after the user finishes (or you decide they have seen it)
 *   dismiss    — close the modal in the current session WITHOUT marking seen
 *                (useful if the user hits "Skip" — pass the choice as a flag)
 *   replay     — re-open the tour in the current session (does not unmark)
 *   forget     — clear the seen flag so it shows again on next mount
 *
 * Usage:
 *   const tour = useFirstTimeTour({ userId: user?.id, tourId: 'student-dashboard' });
 *   <Walkthrough open={tour.open} steps={STEPS} onClose={tour.dismiss} onFinish={tour.markSeen} />
 */
export function useFirstTimeTour({ userId, tourId, ready = true, persistOnSkip = true } = {}) {
  const [open, setOpen] = useState(false);

  // Decide whether to auto-open on first ready render.
  useEffect(() => {
    if (!ready || !tourId) return;
    const key = buildKey(userId, tourId);
    const seen = safeRead(key);
    if (!seen) setOpen(true);
  }, [ready, userId, tourId]);

  const markSeen = useCallback(() => {
    if (!tourId) return;
    safeWrite(buildKey(userId, tourId), new Date().toISOString());
    setOpen(false);
  }, [userId, tourId]);

  const dismiss = useCallback(() => {
    // Skipping is a real choice — don't pester the user every refresh.
    if (persistOnSkip && tourId) {
      safeWrite(buildKey(userId, tourId), 'skipped');
    }
    setOpen(false);
  }, [userId, tourId, persistOnSkip]);

  const replay = useCallback(() => setOpen(true), []);

  const forget = useCallback(() => {
    if (!tourId) return;
    safeRemove(buildKey(userId, tourId));
  }, [userId, tourId]);

  return { open, markSeen, dismiss, replay, forget };
}

export default useFirstTimeTour;
