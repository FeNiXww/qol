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

// Drop the cached matches list so the next read fetches fresh data. Call after
// creating a group or after any membership change so the Connections list
// reflects the update without waiting for the TTL to expire.
export function bustMatchesCache() {
  _matchesCache.key = null;
  _matchesCache.at = 0;
  _matchesCache.data = null;
}

async function fetchProfileMap(userIds) {
  if (!userIds.length) return {};
  const [byUserId, byCreatorId] = await Promise.all([
    safeQuery(() => base44.entities.Profile.filter({ user_id: { $in: userIds } })),
    safeQuery(() => base44.entities.Profile.filter({ created_by_id: { $in: userIds } })),
  ]);
  const map = {};
  byCreatorId.concat(byUserId).forEach((p) => {
    const k = p.user_id || p.created_by_id;
    if (k) map[k] = p;
  });
  return map;
}

// Fetch all of the current user's chats:
//  - 1:1 matches (user_a or user_b)
//  - group matches (participant_ids contains the user)
// Group matches are enriched with their Group metadata row so the list can
// render group name/avatar/member count instead of the 1:1 other-profile.
export async function getMatches(myUserId) {
  const now = Date.now();
  if (_matchesCache.key === myUserId && now - _matchesCache.at < MATCHES_CACHE_TTL) {
    return _matchesCache.data;
  }

  const [matchesA, matchesB] = await Promise.all([
    safeQuery(() => base44.entities.Match.filter({ user_a_id: myUserId }, '-last_message_at', 50)),
    safeQuery(() => base44.entities.Match.filter({ user_b_id: myUserId }, '-last_message_at', 50)),
  ]);
  const groupMatches = await safeQuery(() => base44.entities.Match.filter({ is_group: true, participant_ids: { $in: [myUserId] } }, '-last_message_at', 50));

  const oneOnOne = [...matchesA, ...matchesB].filter((m) => !m.is_group);
  const all = [...oneOnOne, ...groupMatches].sort((a, b) =>
    new Date(b.last_message_at) - new Date(a.last_message_at)
  );

  const otherIds = oneOnOne.map(match => match.user_a_id === myUserId ? match.user_b_id : match.user_a_id);
  const profileMap = await fetchProfileMap([...new Set(otherIds)]);

  let groupRows = [];
  if (groupMatches.length) {
    const groupMatchIds = groupMatches.map((m) => m.id);
    groupRows = await safeQuery(() => base44.entities.Group.filter({ match_id: { $in: groupMatchIds } }));
  }
  const groupByMatch = {};
  groupRows.forEach((g) => { groupByMatch[g.match_id] = g; });

  const enriched = all.map(match => {
    if (match.is_group) {
      return { ...match, group: groupByMatch[match.id] || null, otherProfile: null };
    }
    const otherId = match.user_a_id === myUserId ? match.user_b_id : match.user_a_id;
    return { ...match, otherId, otherProfile: profileMap[otherId] || null };
  });

  _matchesCache.key = myUserId;
  _matchesCache.at = Date.now();
  _matchesCache.data = enriched;
  return enriched;
}

export function isProfileOnline(profile, windowMs = 120_000) {
  if (!profile?.last_seen_at) return false;
  return Date.now() - new Date(profile.last_seen_at).getTime() < windowMs;
}

export async function getMessages(matchId) {
  return base44.entities.Message.filter({ match_id: matchId }, 'created_date', 200);
}

// Send a message. For 1:1 chats, translate to the receiver's native language
// and respect the receiver's known-word dictionary. For group chats, there is
// no single receiver, so we store the original text only; each viewer's
// client translates it to their own native language on demand (see Chat.jsx).
export async function sendMessage({ matchId, senderId, receiverId, text, senderNationality, receiverNationality, isGroup = false }) {
  const { translateText, getNativeLang } = await import('./translate');
  const fromLang = getNativeLang(senderNationality);

  let toLang = fromLang;
  let knownWords = [];
  let translatedText = text;
  if (!isGroup) {
    toLang = getNativeLang(receiverNationality);
    if (receiverId) {
      try {
        const known = await base44.entities.DictionaryWord.filter(
          { user_id: receiverId, known: true }, null, 500
        );
        const field = fromLang === 'he' ? 'text_he' : 'text_ar';
        knownWords = [...new Set(known.map(w => w[field]).filter(Boolean))];
      } catch {
        knownWords = [];
      }
    }
    translatedText = fromLang === toLang ? text : await translateText(text, fromLang, toLang, knownWords);
  }
  const keptWords = knownWords.filter(w => translatedText.includes(w));

  await base44.entities.Match.update(matchId, { last_message_at: new Date().toISOString() });

  const msg = await base44.entities.Message.create({
    match_id: matchId,
    sender_id: senderId,
    original_text: text,
    original_lang: fromLang,
    translated_text: translatedText,
    translated_lang: toLang,
    kept_words: keptWords,
    status: 'sent',
  });

  return msg;
}