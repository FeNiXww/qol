import { base44 } from '@/api/base44Client';

export async function getMatches(myUserId) {
  const matchesA = await base44.entities.Match.filter({ user_a_id: myUserId }, '-last_message_at', 50);
  const matchesB = await base44.entities.Match.filter({ user_b_id: myUserId }, '-last_message_at', 50);

  const all = [...matchesA, ...matchesB].sort((a, b) =>
    new Date(b.last_message_at) - new Date(a.last_message_at)
  );

  // For each match, get the other user's profile
  // Try both user_id and created_by_id since profiles use either field
  const enriched = await Promise.all(all.map(async (match) => {
    const otherId = match.user_a_id === myUserId ? match.user_b_id : match.user_a_id;
    let profileList = await base44.entities.Profile.filter({ user_id: otherId });
    if (!profileList.length) {
      profileList = await base44.entities.Profile.filter({ created_by_id: otherId });
    }
    return { ...match, otherId, otherProfile: profileList[0] || null };
  }));

  // Return all matches, even those without a profile (show as "Deleted user")
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