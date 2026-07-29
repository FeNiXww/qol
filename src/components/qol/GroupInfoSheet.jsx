import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Crown, UserMinus, LogOut, UserPlus, Upload, Shield, ShieldOff, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GroupMemberSearch from '@/components/qol/GroupMemberSearch';
import { getGroup, removeMember, promoteToOwner, demoteOwner, leaveGroup, updateGroupProfile, createGroupInvites } from '@/lib/groupsApi';
import { bustMatchesCache } from '@/lib/matchesApi';
import { theme } from '@/lib/theme';

// Full-screen group management sheet. Self-contained data loading so owner
// actions (add/promote/demote/kick/leave/edit) refresh locally without
// requiring the parent Chat to refetch.
export default function GroupInfoSheet({ matchId, currentUserId, myAgeBand, group: initialGroup, onClose, onLeftGroup }) {
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [group, setGroup] = useState(initialGroup);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [avatarDraft, setAvatarDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const m = await base44.entities.Match.get(matchId);
      setMatch(m);
      const g = group || (await getGroup(matchId));
      if (g) {
        setGroup(g);
        setNameDraft(g.name || '');
        setBioDraft(g.bio || '');
        setAvatarDraft(g.avatar_url || '');
      }
      const pids = m.participant_ids || [];
      if (pids.length) {
        const [byUser, byCreator] = await Promise.all([
          base44.entities.Profile.filter({ user_id: { $in: pids } }),
          base44.entities.Profile.filter({ created_by_id: { $in: pids } }),
        ]);
        const map = {};
        byCreator.concat(byUser).forEach((p) => { const k = p.user_id || p.created_by_id; if (k) map[k] = p; });
        setProfiles(pids.map((id) => map[id]).filter(Boolean));
      } else {
        setProfiles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [matchId]);

  const ownerSet = new Set(match?.owner_ids || []);
  const isOwner = ownerSet.has(currentUserId);
  const participantIds = match?.participant_ids || [];

  const handleAdd = async (selectedIds) => {
    if (!selectedIds.length) { setAddMode(false); return; }
    // Don't add members directly anymore — send each selected user a group
    // invitation they can review and accept from their own device.
    await createGroupInvites({ matchId, inviterId: currentUserId, inviteeIds: selectedIds });
    setAddMode(false);
    load();
  };

  const handleKick = async (uid) => {
    if (!confirm('Remove this member from the group?')) return;
    setBusyId(uid);
    try { await removeMember({ matchId, userId: uid }); bustMatchesCache(); load(); }
    finally { setBusyId(null); }
  };

  const handlePromote = async (uid) => {
    setBusyId(uid);
    try { await promoteToOwner({ matchId, userId: uid }); load(); }
    finally { setBusyId(null); }
  };

  const handleDemote = async (uid) => {
    setBusyId(uid);
    try {
      await demoteOwner({ matchId, userId: uid });
      load();
    } catch (e) {
      alert(e.message || 'Cannot demote last owner');
    } finally {
      setBusyId(null);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this group?')) return;
    await leaveGroup({ matchId, userId: currentUserId });
    bustMatchesCache();
    onLeftGroup?.();
  };

  const handleAvatarUpload = async (file) => {
    if (!file || !group) return;
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatarDraft(file_url);
      await updateGroupProfile({ groupId: group.id, avatarUrl: file_url });
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!group) return;
    setSaving(true);
    try {
      await updateGroupProfile({
        groupId: group.id,
        name: nameDraft.trim() || group.name || 'Group',
        bio: bioDraft,
        avatarUrl: avatarDraft,
      });
      setEditing(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: theme.colors.teal }} />
      </div>
    );
  }

  if (addMode) {
    return (
      <GroupMemberSearch
        myId={currentUserId}
        ageBand={myAgeBand}
        excludeIds={participantIds}
        onClose={() => setAddMode(false)}
        onConfirm={handleAdd}
        title="Add members"
        confirmLabel="Add"
      />
    );
  }

  const avatarSrc = avatarDraft || group?.avatar_url;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: '#F0F7F6' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-4 flex-shrink-0 shadow-md"
        style={{ paddingTop: '52px', background: `linear-gradient(135deg, ${theme.colors.navy}, #1a2a5e)` }}
      >
        <button onClick={onClose} className="text-white/70 p-1"><X className="w-5 h-5" /></button>
        <h2 className="font-bold text-white">Group info</h2>
        {isOwner && !editing && (
          <button onClick={() => setEditing(true)} className="ml-auto text-white/70 p-1"><Pencil className="w-4 h-4" /></button>
        )}
      </div>

      {/* Avatar + name + bio */}
      <div className="flex flex-col items-center px-6 py-6 bg-white">
        <div className="relative mb-4">
          {avatarSrc ? (
            <img src={avatarSrc} alt={group?.name} className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md" />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}>
              {(group?.name || 'G')[0]?.toUpperCase()}
            </div>
          )}
          {editing && (
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: theme.colors.teal }}>
              <Upload className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" hidden onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
            </label>
          )}
        </div>
        {editing ? (
          <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Group name" className="w-full text-center text-lg font-bold px-3 py-2 rounded-xl border border-gray-200 mb-2" />
        ) : (
          <h3 className="text-xl font-bold text-gray-900">{group?.name || 'Group'}</h3>
        )}
        {editing ? (
          <textarea value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} placeholder="Group bio" className="w-full text-center text-sm text-gray-500 px-3 py-2 rounded-xl border border-gray-200 mb-2 resize-none" rows={2} />
        ) : (
          group?.bio ? <p className="text-sm text-gray-500 text-center">{group.bio}</p> : null
        )}
        {editing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 px-6 py-2 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #16A499, #0D6470)' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>

      {/* Members */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase mb-1">{participantIds.length} members</p>
        {profiles.map((p) => {
          const pid = p.user_id || p.created_by_id;
          const isMe = pid === currentUserId;
          const memberIsOwner = ownerSet.has(pid);
          const name = p.display_name || 'User';
          const flag = p.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}>{name[0]?.toUpperCase()}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{flag} {name}{isMe ? ' (you)' : ''}</p>
                {memberIsOwner && <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-bold"><Crown className="w-3 h-3" /> Owner</span>}
              </div>
              {isMe ? (
                <button onClick={handleLeave} className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: '#FEF2F2', color: '#DC2626' }}><LogOut className="w-4 h-4" /></button>
              ) : isOwner && (
                <div className="flex gap-1">
                  {memberIsOwner ? (
                    <button
                      onClick={() => handleDemote(pid)}
                      disabled={busyId === pid}
                      title="Demote to member"
                      className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50"
                      style={{ background: '#FEF3C7', color: '#B45309' }}
                    >
                      <ShieldOff className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePromote(pid)}
                      disabled={busyId === pid}
                      title="Promote to owner"
                      className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50"
                      style={{ background: '#FEF3C7', color: '#B45309' }}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleKick(pid)}
                    disabled={busyId === pid}
                    title="Remove from group"
                    className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50"
                    style={{ background: '#FEF2F2', color: '#DC2626' }}
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 flex gap-2">
        {isOwner && (
          <button
            onClick={() => setAddMode(true)}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #16A499, #0D6470)' }}
          >
            <UserPlus className="w-4 h-4" /> Invite members
          </button>
        )}
        <button
          onClick={handleLeave}
          className={isOwner ? "py-3 px-4 rounded-2xl font-bold text-sm flex items-center gap-2" : "flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"}
          style={{ background: '#FEF2F2', color: '#DC2626' }}
        >
          <LogOut className="w-4 h-4" /> Leave
        </button>
      </div>
    </div>
  );
}