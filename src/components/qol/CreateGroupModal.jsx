import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '@/lib/groupsApi';
import { bustMatchesCache } from '@/lib/matchesApi';
import { theme } from '@/lib/theme';

// Full-screen modal for creating a new group. The creator becomes the first
// owner and can add members afterwards from the Group info sheet in chat.
export default function CreateGroupModal({ myId, ageBand, onClose }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const { match } = await createGroup({ creatorId: myId, name: name.trim(), bio });
      bustMatchesCache();
      onClose();
      navigate(`/chat/${match.id}`);
    } catch (e) {
      alert('Could not create group. Please try again.');
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: '#F0F7F6' }}>
      <div
        className="flex items-center gap-3 px-4 pb-4 flex-shrink-0 shadow-md"
        style={{ paddingTop: '52px', background: `linear-gradient(135deg, ${theme.colors.navy}, #1a2a5e)` }}
      >
        <button onClick={onClose} className="text-white/70 p-1"><X className="w-5 h-5" /></button>
        <h2 className="font-bold text-white">New group</h2>
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
        <p className="text-xs text-gray-400 text-center">
          After creating, tap the <span className="font-bold">group icon</span> in the chat to invite members.
        </p>
      </div>

      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-lg disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, #0D6470)` }}
        >
          {creating ? 'Creating…' : 'Create group'}
        </button>
      </div>
    </div>
  );
}