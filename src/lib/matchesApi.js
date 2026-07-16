import { base44 } from '@/api/base44Client';

export async function getMatches(myUserId) {
  const matchesA = await base44.entities.Match.filter({ user_a_id: myUserId }, '-last_message_at', 50);
  const matchesB = await base44.entities.Match.filter({ user_b_id: myUserId }, '-last_message_at', 50);

  const all = [...matchesA, ...matchesB].sort((a, b) =>
    new Date(b.last_message_at) - new Date(a.last_message_at)
  );

  // For each match, get the other user's profile
  const enriched = await Promise.all(all.map(async (match) => {
    const otherId = match.user_a_id === myUserId ? match.user_b_id : match.user_a_id;
    const profiles = await base44.entities.Profile.filter({ created_by_id: otherId });
    return { ...match, otherProfile: profiles[0] || null };
  }));

  return enriched.filter(m => m.otherProfile);
}

export async function getMessages(matchId) {
  return base44.entities.Message.filter({ match_id: matchId }, 'created_date', 200);
}

export async function sendMessage({ matchId, senderId, text, senderNationality, receiverNationality }) {
  const { translateText, getNativeLang } = await import('./translate');
  const fromLang = getNativeLang(senderNationality);
  const toLang = getNativeLang(receiverNationality);

  // Translate and update match timestamp in parallel — Google Translate is near-instant
  const [translatedText] = await Promise.all([
    translateText(text, fromLang, toLang),
    base44.entities.Match.update(matchId, { last_message_at: new Date().toISOString() }),
  ]);

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