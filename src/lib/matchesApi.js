import { base44 } from '@/api/base44Client';

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

const MATCHES_CACHE_TTL = 12000;
const _matchesCache = { key: null, at: 0, data: null };

export async function getMatches(myUserId) {
  const now = Date.now();
  if (_matchesCache.key === myUserId && now - _matchesCache.at < MATCHES_CACHE_TTL) {
    return _matchesCache.data;
  }

  const matchesA = await safeQuery(() => base44.entities.Match.filter({ user_a_id: myUserId }, '-last_message_at', 50));
  const matchesB = await safeQuery(() => base44.entities.Match.filter({ user_b_id: myUserId }, '-last_message_at', 50));

  const all = [...matchesA, ...matchesB].sort((a, b) =>
    new Date(b.last_message_at) - new Date(a.last_message_at)
  );

  // Collect all other user IDs
  const otherIds = all.map(match => match.user_a_id === myUserId ? match.user_b_id : match.user_a_id);
  const uniqueOtherIds = [...new Set(otherIds)];

  let byUserId = [], byCreatorId = [];
  if (uniqueOtherIds.length > 0) {
    // Fetch all profiles in two bulk queries (by user_id and by created_by_id)
    [byUserId, byCreatorId] = await Promise.all([
      safeQuery(() => base44.entities.Profile.filter({ user_id: { $in: uniqueOtherIds } })),
      safeQuery(() => base44.entities.Profile.filter({ created_by_id: { $in: uniqueOtherIds } })),
    ]);
  }

  // Build a lookup map: userId -> profile
  const profileMap = {};
  [...byCreatorId, ...byUserId].forEach(p => {
    const key = p.user_id || p.created_by_id;
    if (key) profileMap[key] = p;
  });

  const enriched = all.map(match => {
    const otherId = match.user_a_id === myUserId ? match.user_b_id : match.user_a_id;
    return { ...match, otherId, otherProfile: profileMap[otherId] || null };
  });

  _matchesCache.key = myUserId;
  _matchesCache.at = Date.now();
  _matchesCache.data = enriched;
  return enriched;
}

// A profile is considered online if its heartbeat is within the last 2 minutes
export function isProfileOnline(profile, windowMs = 120_000) {
  if (!profile?.last_seen_at) return false;
  return Date.now() - new Date(profile.last_seen_at).getTime() < windowMs;
}

export async function getMessages(matchId) {
  return base44.entities.Message.filter({ match_id: matchId }, 'created_date', 200);
}

export async function sendMessage({ matchId, senderId, text, senderNationality, receiverNationality }) {
  const { translateText, getNativeLang } = await import('./translate');
  const fromLang = getNativeLang(senderNationality);
  const toLang = getNativeLang(receiverNationality);

  // Translate first — if it fails (unclear message), nothing is sent or updated
  const translatedText = await translateText(text, fromLang, toLang);
  await base44.entities.Match.update(matchId, { last_message_at: new Date().toISOString() });

  const msg = await base44.entities.Message.create({
    match_id: matchId,
    sender_id: senderId,
    original_text: text,
    original_lang: fromLang,
    translated_text: translatedText,
    translated_lang: toLang,
    status: 'sent',
  });

  return msg;
}