import { base44 } from '@/api/base44Client';

// Tracks, per match, when the current user last opened the chat (stored locally).
const key = (matchId) => `qol_read_${matchId}`;

export function markMatchRead(matchId) {
  try { localStorage.setItem(key(matchId), new Date().toISOString()); } catch {}
}

export function getMatchLastRead(matchId) {
  try { return localStorage.getItem(key(matchId)); } catch { return null; }
}

// Returns a Set of match ids that have a message from the other user
// newer than the last time this user opened that chat.
export async function getUnreadMatchIds(matches, myUserId) {
  const results = await Promise.all(matches.map(async (match) => {
    const [lastMsg] = await base44.entities.Message.filter({ match_id: match.id }, '-created_date', 1);
    if (!lastMsg || lastMsg.sender_id === myUserId) return null;
    const lastRead = getMatchLastRead(match.id);
    if (!lastRead || new Date(lastMsg.created_date) > new Date(lastRead)) return match.id;
    return null;
  }));
  return new Set(results.filter(Boolean));
}