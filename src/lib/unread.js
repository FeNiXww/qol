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
//
// IMPORTANT: We fetch recent messages for ALL matches in a single query
// (sorted newest-first) rather than firing one query per match — the
// per-match approach bursts many simultaneous requests and trips the
// platform's rate limit.
export async function getUnreadMatchIds(matches, myUserId) {
  if (!matches.length) return new Set();
  const ids = matches.map((m) => m.id);

  const recent = await base44.entities.Message.filter(
    { match_id: { $in: ids } },
    '-created_date',
    500
  );

  // Keep the newest message per match (first occurrence since sorted desc).
  const latestByMatch = {};
  for (const msg of recent) {
    if (latestByMatch[msg.match_id]) continue;
    latestByMatch[msg.match_id] = msg;
  }

  const result = new Set();
  for (const match of matches) {
    const last = latestByMatch[match.id];
    if (!last) continue;
    if (last.sender_id === myUserId) continue; // I sent the last message
    const lastRead = getMatchLastRead(match.id);
    if (!lastRead || new Date(last.created_date) > new Date(lastRead)) {
      result.add(match.id);
    }
  }
  return result;
}