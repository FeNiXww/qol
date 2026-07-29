import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { fetchNotifications, acceptConnectionRequest, DISMISS_KEY } from '@/lib/discovery';
import { acceptGroupInvite, declineGroupInvite } from '@/lib/groupsApi';
import { bustMatchesCache } from '@/lib/matchesApi';
import NotificationsPanel from '@/components/qol/NotificationsPanel';
import MatchModal from '@/components/qol/MatchModal';

const Ctx = createContext({ pendingCount: 0, openPanel: () => {} });
export const useNotifications = () => useContext(Ctx);

// Owns notifications state + the celebration shown after accepting an invite.
// Renders the panel (when open) and the "You're Connected!" modal (on accept).
export function NotificationsProvider({ children }) {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ pending: [], connections: [] });
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const loadInFlight = useRef(false);
  const debounceRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setMe).catch(() => {}); }, []);

  const lastLoadAt = useRef(0);
  const load = async (force = false) => {
    if (!me || loadInFlight.current) return;
    // Throttle: don't refetch more than once every 3s unless forced.
    if (!force && Date.now() - lastLoadAt.current < 3000) return;
    loadInFlight.current = true;
    setLoading(true);
    try {
      setData(await fetchNotifications(me.id));
      lastLoadAt.current = Date.now();
    } catch (e) {
      // Swallow rate-limit / transient errors so the UI never crashes.
      console.warn('notifications load failed', e);
    } finally {
      setLoading(false);
      loadInFlight.current = false;
    }
  };

  const scheduleLoad = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, 1500);
  };

  useEffect(() => {
    if (!me) return;
    load();
    const unsubS = base44.entities.Swipe.subscribe((event) => {
      if (event.type === 'create' && event.data?.target_id === me.id) scheduleLoad();
    });
    const unsubM = base44.entities.Match.subscribe((event) => {
      if (event.type === 'create' && (event.data?.user_a_id === me.id || event.data?.user_b_id === me.id)) scheduleLoad();
    });
    const unsubGI = base44.entities.GroupInvite.subscribe((event) => {
      if (event.data?.invitee_id === me.id) scheduleLoad();
    });
    return () => { unsubS(); unsubM(); unsubGI(); if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [me?.id]);

  const handleAccept = async (item) => {
    if (!me) return;
    setBusyId(item.swipe.id);
    try {
      const myProfiles = await base44.entities.Profile.filter({ user_id: me.id });
      const myProfile = myProfiles[0];
      const match = await acceptConnectionRequest({
        likerId: item.swipe.swiper_id,
        myId: me.id,
        ageBand: myProfile?.age_band,
      });
      await load();
      if (match) setCelebration({ match, otherProfile: item.profile, myProfile });
    } finally { setBusyId(null); }
  };

  const handleDecline = (item) => {
    try {
      const arr = JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]');
      if (!arr.includes(item.swipe.swiper_id)) {
        arr.push(item.swipe.swiper_id);
        localStorage.setItem(DISMISS_KEY, JSON.stringify(arr));
      }
    } catch {}
    load();
  };

  const handleAcceptGroupInvite = async (item) => {
    if (!me) return;
    setBusyId('gi-' + item.invite.id);
    try {
      await acceptGroupInvite(item.invite.id, item.invite.match_id, me.id);
      bustMatchesCache();
      await load(true);
      const matchId = item.invite.match_id;
      setOpen(false);
      navigate(`/chat/${matchId}`);
    } finally { setBusyId(null); }
  };

  const handleDeclineGroupInvite = async (item) => {
    setBusyId('gi-' + item.invite.id);
    try {
      await declineGroupInvite(item.invite.id);
      await load(true);
    } finally { setBusyId(null); }
  };

  const openPanel = () => setOpen(true);

  return (
    <Ctx.Provider value={{ pendingCount: data.pending.length + (data.groupInvites?.length || 0), openPanel }}>
      {children}
      {open && (
        <NotificationsPanel
          data={data}
          loading={loading}
          busyId={busyId}
          onClose={() => setOpen(false)}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onAcceptGroupInvite={handleAcceptGroupInvite}
          onDeclineGroupInvite={handleDeclineGroupInvite}
          onOpenChat={(matchId) => { setOpen(false); navigate(`/chat/${matchId}`); }}
        />
      )}
      {celebration && (
        <MatchModal
          match={{ ...celebration.match, otherProfile: celebration.otherProfile }}
          myProfile={celebration.myProfile}
          onClose={() => setCelebration(null)}
        />
      )}
    </Ctx.Provider>
  );
}