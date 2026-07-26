import { base44 } from '@/api/base44Client';
import { getAgeBand, getOppositeNationality } from './ageUtils';

export const DISMISS_KEY = 'qol_conn_dismissed';
let _lastLocalMatchAt = 0;
export function markLocalMatch() { _lastLocalMatchAt = Date.now(); }
export function wasLocalMatchRecent() { return Date.now() - _lastLocalMatchAt < 3000; }

// Score hobby overlap
function scoreProfile(profile, myHobbies) {
  const overlap = (profile.hobbies || []).filter(h => myHobbies.includes(h)).length;
  const randomFactor = Math.random() * 3;
  return overlap * 2 + randomFactor;
}

// Short-lived cache of swiped-ids per user so each batch doesn't re-query swipes.
const SWIPES_CACHE_TTL = 20000;
const _swipesCache = { key: null, at: 0, ids: null };
async function getSwipedIds(myUserId) {
  const now = Date.now();
  if (_swipesCache.key === myUserId && now - _swipesCache.at < SWIPES_CACHE_TTL) {
    return _swipesCache.ids;
  }
  const swipes = await safeQuery(() => base44.entities.Swipe.filter({ swiper_id: myUserId }));
  const ids = new Set(swipes.map(s => s.target_id));
  _swipesCache.key = myUserId;
  _swipesCache.at = Date.now();
  _swipesCache.ids = ids;
  return ids;
}

// Dedupe concurrent identical batch fetches (e.g., mount + loadMore racing).
const _inflightBatches = new Map();

export async function fetchDiscoverBatch({ myProfile, genderFilter, limit = 20 }) {
  const cacheKey = `${myProfile.user_id || myProfile.created_by_id}:${genderFilter || 'all'}:${limit}`;
  if (_inflightBatches.has(cacheKey)) return _inflightBatches.get(cacheKey);
  const p = _fetchDiscoverBatchImpl({ myProfile, genderFilter, limit });
  _inflightBatches.set(cacheKey, p);
  try { return await p; } finally { _inflightBatches.delete(cacheKey); }
}

async function _fetchDiscoverBatchImpl({ myProfile, genderFilter, limit = 20 }) {
  const oppositeNationality = getOppositeNationality(myProfile.nationality);

  // Use user_id if set (demo profiles), otherwise fall back to created_by_id
  const myUserId = myProfile.user_id || myProfile.created_by_id;

  const swipedIds = await getSwipedIds(myUserId);

  // Query candidates: opposite nationality, complete profile
  // Note: don't filter by age_band here — it may not be set on all profiles
  let query = {
    nationality: oppositeNationality,
    onboarding_step: 'complete',
  };
  if (genderFilter) {
    query.gender = genderFilter;
  }

  const candidates = await safeQuery(() => base44.entities.Profile.filter(query, '-created_date', limit * 3));

  // Filter out already-swiped; use user_id if available for identity check
  const filtered = candidates.filter(p => {
    const pUserId = p.user_id || p.created_by_id;
    return !swipedIds.has(pUserId) && pUserId !== myUserId;
  });

  // Score and sort with randomness
  const scored = filtered
    .map(p => ({ ...p, _score: scoreProfile(p, myProfile.hobbies || []) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  return scored;
}

export async function recordSwipe({ swiperId, targetId, direction }) {
  await base44.entities.Swipe.create({
    swiper_id: swiperId,
    target_id: targetId,
    direction,
  });

  if (direction === 'like') {
    const reciprocal = await base44.entities.Swipe.filter({
      swiper_id: targetId,
      target_id: swiperId,
      direction: 'like',
    });
    if (reciprocal.length > 0) {
      return { matched: true, targetId };
    }
  }
  return { matched: false };
}

export async function createMatchIfMutual({ userAId, userBId, ageBand }) {
  // Check if match already exists
  const existingA = await base44.entities.Match.filter({ user_a_id: userAId, user_b_id: userBId });
  const existingB = await base44.entities.Match.filter({ user_a_id: userBId, user_b_id: userAId });
  if (existingA.length > 0 || existingB.length > 0) return;

  await base44.entities.Match.create({
    user_a_id: userAId,
    user_b_id: userBId,
    age_band: ageBand,
    last_message_at: new Date().toISOString(),
  });
  markLocalMatch();
}

// One-sided "follow": send a like to a target. If they already liked us, it's a
// mutual match right away. Otherwise the target gets a connection-request popup.
export async function sendConnectionRequest({ myId, targetId, ageBand }) {
  await base44.entities.Swipe.create({ swiper_id: myId, target_id: targetId, direction: 'like' });
  const reciprocal = await base44.entities.Swipe.filter({ swiper_id: targetId, target_id: myId, direction: 'like' });
  if (reciprocal.length > 0) {
    await createMatchIfMutual({ userAId: myId, userBId: targetId, ageBand });
    const matches = await base44.entities.Match.filter({ user_a_id: myId, user_b_id: targetId });
    const matchesB = await base44.entities.Match.filter({ user_a_id: targetId, user_b_id: myId });
    return { matched: true, match: matches[0] || matchesB[0] || null };
  }
  return { matched: false };
}

// Accept someone's connection request: record the reciprocal like + create the match.
export async function acceptConnectionRequest({ likerId, myId, ageBand }) {
  await base44.entities.Swipe.create({ swiper_id: myId, target_id: likerId, direction: 'like' });
  await createMatchIfMutual({ userAId: likerId, userBId: myId, ageBand });
  const matches = await base44.entities.Match.filter({ user_a_id: likerId, user_b_id: myId });
  const matchesB = await base44.entities.Match.filter({ user_a_id: myId, user_b_id: likerId });
  return matches[0] || matchesB[0] || null;
}

// Run a query with retry-on-rate-limit. Requests are issued sequentially (not
// in Promise.all) so concurrent bursts don't trip the API rate limit.
async function safeQuery(fn, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

// Fetch all notifications for a user: pending connection requests + connections made.
// Profiles are fetched in a single query and mapped locally — doing one
// Profile.filter per swipe/match triggered an API burst that hit rate limits.
export async function fetchNotifications(myId) {
  const incoming = await safeQuery(() => base44.entities.Swipe.filter({ target_id: myId, direction: 'like' }));
  const outgoing = await safeQuery(() => base44.entities.Swipe.filter({ swiper_id: myId }));
  const matchesA = await safeQuery(() => base44.entities.Match.filter({ user_a_id: myId }));
  const matchesB = await safeQuery(() => base44.entities.Match.filter({ user_b_id: myId }));
  const allProfiles = await safeQuery(() => base44.entities.Profile.filter({ onboarding_step: 'complete' }, '-created_date', 200));

  const profileByUserId = new Map();
  for (const p of allProfiles) {
    const key = p.user_id || p.created_by_id;
    if (key && !profileByUserId.has(key)) profileByUserId.set(key, p);
  }

  const outgoingIds = new Set(outgoing.map((s) => s.target_id));
  const matchedIds = new Set([...matchesA.map((m) => m.user_b_id), ...matchesB.map((m) => m.user_a_id)]);
  let dismissed = [];
  try { dismissed = JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]'); } catch {}
  const pendingSwipes = incoming.filter(
    (s) => !outgoingIds.has(s.swiper_id) && !matchedIds.has(s.swiper_id) && !dismissed.includes(s.swiper_id)
  );
  const pending = pendingSwipes.map((s) => ({ swipe: s, profile: profileByUserId.get(s.swiper_id) || null }));
  const connections = [...matchesA, ...matchesB].map((m) => {
    const otherId = m.user_a_id === myId ? m.user_b_id : m.user_a_id;
    return { match: m, profile: profileByUserId.get(otherId) || null };
  });
  return { pending, connections };
}