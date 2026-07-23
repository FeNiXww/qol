import { base44 } from '@/api/base44Client';
import { getAgeBand, getOppositeNationality } from './ageUtils';

// Score hobby overlap
function scoreProfile(profile, myHobbies) {
  const overlap = (profile.hobbies || []).filter(h => myHobbies.includes(h)).length;
  const randomFactor = Math.random() * 3;
  return overlap * 2 + randomFactor;
}

export async function fetchDiscoverBatch({ myProfile, genderFilter, limit = 20 }) {
  const myNationality = myProfile.nationality;
  const myAgeBand = myProfile.age_band;
  const oppositeNationality = getOppositeNationality(myNationality);

  // Use user_id if set (demo profiles), otherwise fall back to created_by_id
  const myUserId = myProfile.user_id || myProfile.created_by_id;

  // Get all swiped IDs first
  const swipes = await base44.entities.Swipe.filter({ swiper_id: myUserId });
  const swipedIds = new Set(swipes.map(s => s.target_id));

  // Query candidates: opposite nationality, complete profile
  // Note: don't filter by age_band here — it may not be set on all profiles
  let query = {
    nationality: oppositeNationality,
    onboarding_step: 'complete',
  };
  if (genderFilter) {
    query.gender = genderFilter;
  }

  const candidates = await base44.entities.Profile.filter(query, '-created_date', limit * 3);

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