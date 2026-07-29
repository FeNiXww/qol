import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createGroup, createGroupInvites } from '@/lib/groupsApi';
import { bustMatchesCache } from '@/lib/matchesApi';
import { theme } from '@/lib/theme';
import GroupMemberSearch from '@/components/qol/GroupMemberSearch';

// Two-step group creation: enter name + bio, then invite initial members before
// opening the chat. The creator is the first owner; members only join after they
// accept the invitation popup on their device.
export default function CreateGroupModal({ myId, ageBand, onClose }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [step, setStep] = useState('form');
  const [matchId, setMatchId] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const { match } = await createGroup({ creatorId: myId, name: name.trim(), bio });
      bustMatchesCache();
      setMatchId(match.id);
      setStep('invite');
    } catch (e) {
      alert('Could not create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const openChat = () => {
    onClose();
    if (matchId) navigate(`/chat/${matchId}`);
  };

  const handleInvite = async (selectedIds) => {
    if (selectedIds.length && matchId) {
      try {
        await createGroupInvites({ matchId, inviterId: myId, inviteeIds: selectedIds });
      } catch {}
    }
    openChat();
  };

  // Step 2: pick who to invite to the freshly-created group.
  if (step === 'invite') {
    return (
      <GroupMemberSearch
        myId={myId}
        ageBand={ageBand}
        excludeIds={[]}
        title="Invite members"
        confirmLabel="Send invites & open group"
        onConfirm={handleInvite}
        onClose={openChat}
        onSkip={openChat}
        skipLabel="Skip — I'll invite later"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: '#F0F7F6' }}>
      <div
        className="flex items-center gap-3 px-4 pb-4 flex-shrink-0 shadow-md"
        style={{ paddingTop: '52px', background: `linear-gradient(135deg, ${theme.colors.navy}, #1a2a5e)` }}
      >
        <button onClick={onClose} className="text-white/70 p-1"><X className="w-5 h-5" /></button>
        <h2 className="font-bold text-white">New group</h2>
        <div className="ml-auto text-xs text-white/60 font-semibold">Step 1 of 2</div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-5">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase">Group name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="e.g. Peace Circle"
            className="w-full mt-1 px-4 py-3 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What's this group about?"
            rows={3}
            className="w-full mt-1 px-4 py-3 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-sm resize-none"
          />
        </div>
        <p className="text-xs text-gray-400 text-center px-4">
          On the next step you can invite members — they'll get a notification with your group's name, bio, and member list.
        </p>
      </div>

      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-lg disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, #0D6470)` }}
        >
          {creating ? 'Creating…' : 'Next: invite members'}
        </button>
      </div>
    </div>
  );
}