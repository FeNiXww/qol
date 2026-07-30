import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Returns the words a receiver has already marked "known" in their dictionary,
// in a given language (he/ar) — used so chat translation can leave those
// specific words untranslated instead of always translating everything.
//
// DictionaryWord's RLS restricts reads to the owner's own rows, which
// correctly stops any client from reading someone else's dictionary directly.
// This function runs server-side with the service role so it CAN do that
// cross-user read, but only:
//   1. after confirming the caller is authenticated, and
//   2. after confirming the caller actually shares a chat (1:1 match or
//      group) with the receiver — so this can't be used to probe an
//      arbitrary user's vocabulary just by knowing their id.
// It only ever returns the minimal word list needed for translation, never
// the full DictionaryWord rows (no "not yet known" words, no ids, etc).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { receiverId, lang } = await req.json();
    if (typeof receiverId !== 'string' || !receiverId || receiverId === user.id) {
      return Response.json({ words: [] });
    }
    if (lang !== 'he' && lang !== 'ar') {
      return Response.json({ words: [] });
    }

    // Verify the caller shares a 1:1 match or a group with this receiver.
    const [oneToOneA, oneToOneB, groupMatches] = await Promise.all([
      base44.asServiceRole.entities.Match.filter({ user_a_id: user.id, user_b_id: receiverId }),
      base44.asServiceRole.entities.Match.filter({ user_a_id: receiverId, user_b_id: user.id }),
      base44.asServiceRole.entities.Match.filter({ is_group: true, participant_ids: { $in: [user.id] } }),
    ]);
    const sharesGroup = groupMatches.some((m) => (m.participant_ids || []).includes(receiverId));
    const isConnected = oneToOneA.length > 0 || oneToOneB.length > 0 || sharesGroup;
    if (!isConnected) {
      return Response.json({ words: [] });
    }

    const field = lang === 'he' ? 'text_he' : 'text_ar';
    const known = await base44.asServiceRole.entities.DictionaryWord.filter(
      { user_id: receiverId, known: true }, undefined, 500
    );
    const words = [...new Set(known.map((w) => w[field]).filter(Boolean))];
    return Response.json({ words });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});