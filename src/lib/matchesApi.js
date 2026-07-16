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

  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

  // Try to translate within 3 seconds, otherwise save without translation
  let translatedText = '';
  try {
    translatedText = await Promise.race([translateText(text, fromLang, toLang), timeout(3000)]);
  } catch {
    // Timed out — save now, translate in background
  }

  const msg = await base44.entities.Message.create({
    match_id: matchId,
    sender_id: senderId,
    original_text: text,
    original_lang: fromLang,
    translated_text: translatedText,
    translated_lang: toLang,
    status: 'sent',
  });

  base44.entities.Match.update(matchId, { last_message_at: new Date().toISOString() }).catch(() => {});

  // If translation didn't finish in time, update in background
  if (!translatedText) {
    translateText(text, fromLang, toLang)
      .then(t => base44.entities.Message.update(msg.id, { translated_text: t }))
      .catch(() => {});
  }

  return msg;
}