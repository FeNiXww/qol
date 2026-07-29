import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { X, Check, Users, Crown, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  getPendingGroupInvites,
  acceptGroupInvite,
  declineGroupInvite,
  getGroup,
  getGroupParticipants,
} from '@/lib/groupsApi';
import { bustMatchesCache } from '@/lib/matchesApi';

const DISMISS_KEY = 'qol_group_invite_dismissed';

// Global notification: when an owner invites you to a group, this pops up
// showing the group name, bio, and the member list, with join / decline.
export default function GroupInvitePopup() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [invite, setInvite] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [ownerIds, setOwnerIds] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const scanInFlight = useRef(false);

  useEffect(() => { base44.auth.me().then(setMe).catch(() => {}); }, []);

  const dismiss = (id) => {
    try {
      const arr = JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]');
      if (!arr.includes(id)) { arr.push(id); localStorage.setItem(DISMISS_KEY, JSON.stringify(arr)); }
    } catch {}
  };

  const scan = async () => {
    if (!me || scanInFlight.current) return;
    scanInFlight.current = true;
    try {
      let dismissed = [];
      try { dismissed = JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]'); } catch {}
      const invites = await getPendingGroupInvites(me.id);
      const pending = invites.filter((i) => !dismissed.includes(i.id));
      if (pending.length === 0) {
        setInvite(null); setGroup(null); setMembers([]); setOwnerIds([]);
        return;
      }
      const next = pending[0];
      const g = await getGroup(next.match_id);
      const parts = await getGroupParticipants(next.match_id);
      const m = await base44.entities.Match.get(next.match_id);
      setInvite(next);
      setGroup(g);
      setMembers(parts);
      setOwnerIds(m.owner_ids || []);
    } catch {} finally { scanInFlight.current = false; }
  };

  useEffect(() => {
    if (!me) return;
    scan();
    const unsub = base44.entities.GroupInvite.subscribe((event) => {
      if (event.type === 'create' && event.data?.invitee_id === me.id) scan();
    });
    return () => unsub();
  }, [me?.id]);

  const handleAccept = async () => {
    if (!invite || !me) return;
    setBusy(true);
    try {
      await acceptGroupInvite(invite.id, invite.match_id, me.id);
      bustMatchesCache();
      dismiss(invite.id);
      const matchId = invite.match_id;
      setInvite(null);
      navigate(`/chat/${matchId}`);
    } catch {} finally { setBusy(false); }
  };

  const handleDecline = async () => {
    if (!invite) return;
    setBusy(true);
    try {
      await declineGroupInvite(invite.id);
      dismiss(invite.id);
      setInvite(null);
    } catch {} finally { setBusy(false); }
  };

  const groupName = group?.name || 'Group';
  const groupBio = group?.bio;
  const avatar = group?.avatar_url;
  const ownerSet = new Set(ownerIds);

  return (
    <AnimatePresence>
      {invite && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          className="fixed top-0 left-0 right-0 z-[60] flex justify-center"
        >
          <div className="w-full max-w-md px-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
            <div className="bg-white rounded-3xl shadow-2xl p-4 border border-gray-100 relative">
              <button onClick={handleDecline} disabled={busy} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500">
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-2 pr-6">
                <div className="flex-shrink-0">
                  {avatar ? (
                    <img src={avatar} alt={groupName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}>
                      <Users className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">👥 {groupName}</p>
                  <p className="text-xs text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''} · invitation to join</p>
                </div>
              </div>
              {groupBio && <p className="text-sm text-gray-600 mb-2 pr-6">{groupBio}</p>}

              <div className="rounded-2xl bg-gray-50 px-3 py-2 mb-3">
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase"
                >
                  <span>Members ({members.length})</span>
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expanded && (
                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {members.map((p) => {
                      const pid = p.user_id || p.created_by_id;
                      const name = p.display_name || 'User';
                      const flag = p.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}>
                              {name[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm text-gray-700 truncate flex-1">{flag} {name}</span>
                          {ownerSet.has(pid) && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDecline}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #16A499, #0D6470)' }}
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Join
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}