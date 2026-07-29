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

// Create a new group: a group-backed Match record plus the Group metadata row.
// The creator is the first participant and the first owner.
export async function createGroup({ creatorId, name, bio = '', avatarUrl = '' }) {
  const match = await safeQuery(() => base44.entities.Match.create({
    user_a_id: creatorId,
    user_b_id: creatorId, // placeholder required field for group matches
    is_group: true,
    participant_ids: [creatorId],
    owner_ids: [creatorId],
    last_message_at: new Date().toISOString(),
  }));
  const group = await safeQuery(() => base44.entities.Group.create({
    match_id: match.id,
    name,
    bio,
    avatar_url: avatarUrl,
    created_by_id: creatorId,
  }));
  base44.analytics.track({ eventName: 'group_created' });
  return { match, group };
}

// Fetch the Group metadata row tied to a match id.
export async function getGroup(matchId) {
  const rows = await safeQuery(() => base44.entities.Group.filter({ match_id: matchId }));
  return rows[0] || null;
}

// Add one or more users to a group match's participant list (idempotent).
export async function addMembers({ matchId, userIds }) {
  const match = await base44.entities.Match.get(matchId);
  const current = new Set(match.participant_ids || []);
  userIds.forEach((id) => current.add(id));
  await base44.entities.Match.update(matchId, { participant_ids: [...current] });
}

// Remove a user from the group entirely, clearing their owner role too.
// Used both for the owner "kick" action and for a user leaving.
export async function removeMember({ matchId, userId }) {
  const match = await base44.entities.Match.get(matchId);
  const participants = (match.participant_ids || []).filter((id) => id !== userId);
  const owners = (match.owner_ids || []).filter((id) => id !== userId);
  await base44.entities.Match.update(matchId, { participant_ids: participants, owner_ids: owners });
}

export async function promoteToOwner({ matchId, userId }) {
  const match = await base44.entities.Match.get(matchId);
  const owners = new Set(match.owner_ids || []);
  owners.add(userId);
  await base44.entities.Match.update(matchId, { owner_ids: [...owners] });
}

export async function demoteOwner({ matchId, userId }) {
  const match = await base44.entities.Match.get(matchId);
  const owners = (match.owner_ids || []).filter((id) => id !== userId);
  if (owners.length === 0) throw new Error('Last owner cannot be demoted');
  await base44.entities.Match.update(matchId, { owner_ids: owners });
}

export async function leaveGroup({ matchId, userId }) {
  return removeMember({ matchId, userId });
}

export async function updateGroupProfile({ groupId, name, bio, avatarUrl }) {
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (bio !== undefined) patch.bio = bio;
  if (avatarUrl !== undefined) patch.avatar_url = avatarUrl;
  return base44.entities.Group.update(groupId, patch);
}

// Persist this user's "clear chat" timestamp on the group match (per-user cleared map).
export async function setGroupClearedAt({ matchId, userId }) {
  const match = await base44.entities.Match.get(matchId);
  const map = match.cleared_at_map || {};
  map[userId] = new Date().toISOString();
  await base44.entities.Match.update(matchId, { cleared_at_map: map });
}

// Group invitations: owners invite users, who get a popup with group info +
// the member list and can accept (added as participant) or decline.
export async function createGroupInvites({ matchId, inviterId, inviteeIds }) {
  const rows = [];
  for (const uid of inviteeIds) {
    if (uid === inviterId) continue;
    try {
      const row = await safeQuery(() => base44.entities.GroupInvite.create({
        match_id: matchId,
        inviter_id: inviterId,
        invitee_id: uid,
        status: 'pending',
      }));
      rows.push(row);
    } catch (e) { /* rate-limit tolerant; keep inviting the rest */ }
  }
  base44.analytics.track({ eventName: 'group_invite_sent', properties: { count: rows.length } });
  return rows;
}

export async function getPendingGroupInvites(userId) {
  return safeQuery(() => base44.entities.GroupInvite.filter({ invitee_id: userId, status: 'pending' }, '-created_date', 20));
}

// Fetch the participant profiles for a group match — used by the invite popup.
export async function getGroupParticipants(matchId) {
  const m = await base44.entities.Match.get(matchId);
  const pids = m.participant_ids || [];
  if (!pids.length) return [];
  const [byUser, byCreator] = await Promise.all([
    base44.entities.Profile.filter({ user_id: { $in: pids } }),
    base44.entities.Profile.filter({ created_by_id: { $in: pids } }),
  ]);
  const map = {};
  byCreator.concat(byUser).forEach((p) => { const k = p.user_id || p.created_by_id; if (k) map[k] = p; });
  return pids.map((id) => map[id]).filter(Boolean);
}

export async function acceptGroupInvite(inviteId, matchId, userId) {
  await addMembers({ matchId, userIds: [userId] });
  await base44.entities.GroupInvite.update(inviteId, { status: 'accepted' });
}

export async function declineGroupInvite(inviteId) {
  await base44.entities.GroupInvite.update(inviteId, { status: 'declined' });
}