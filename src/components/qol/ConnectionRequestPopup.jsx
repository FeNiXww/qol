import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { acceptConnectionRequest } from '@/lib/discovery';
import MatchModal from '@/components/qol/MatchModal';

const DISMISS_KEY = 'qol_conn_dismissed';

// Global "follow-style" request: when someone likes/connects with you, this
// pops up asking if you want to connect back. Accepting creates the match.
export default function ConnectionRequestPopup() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [me, setMe] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [request, setRequest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const scanInFlight = useRef(false);
  const scanDebounce = useRef(null);

  useEffect(() => { base44.auth.me().then(setMe).catch(() => {}); }, []);

  useEffect(() => {
    if (!me) return;
    base44.entities.Profile.filter({ user_id: me.id })
      .then((p) => setMyProfile(p[0] || null))
      .catch(() => {});
  }, [me?.id]);

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
      const [incoming, outgoing, matchesA, matchesB] = await Promise.all([
        base44.entities.Swipe.filter({ target_id: me.id, direction: 'like' }),
        base44.entities.Swipe.filter({ swiper_id: me.id }),
        base44.entities.Match.filter({ user_a_id: me.id }),
        base44.entities.Match.filter({ user_b_id: me.id }),
      ]);
      const handledIds = new Set(outgoing.map((s) => s.target_id));
      const matchedIds = new Set([
        ...matchesA.map((m) => m.user_b_id),
        ...matchesB.map((m) => m.user_a_id),
      ]);
      let dismissed = [];
      try { dismissed = JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]'); } catch {}
      const pending = incoming
        .filter((s) => !handledIds.has(s.swiper_id) && !matchedIds.has(s.swiper_id) && !dismissed.includes(s.swiper_id))
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      if (pending.length === 0) { setRequest(null); return; }
      const likerId = pending[0].swiper_id;
      const profiles = await base44.entities.Profile.filter({ user_id: likerId });
      setRequest({ likerId, likerProfile: profiles[0] || null });
    } catch {} finally { scanInFlight.current = false; }
  };

  const scheduleScan = () => {
    if (scanDebounce.current) clearTimeout(scanDebounce.current);
    scanDebounce.current = setTimeout(scan, 1500);
  };

  useEffect(() => {
    if (!me) return;
    scan();
    const unsub = base44.entities.Swipe.subscribe((event) => {
      if (event.type === 'create' && event.data?.target_id === me.id && event.data?.direction === 'like') {
        scheduleScan();
      }
    });
    return () => { unsub(); if (scanDebounce.current) clearTimeout(scanDebounce.current); };
  }, [me?.id]);

  const handleAccept = async () => {
    if (!request || !myProfile || !me) return;
    setBusy(true);
    try {
      const likerProfile = request.likerProfile;
      const match = await acceptConnectionRequest({ likerId: request.likerId, myId: me.id, ageBand: myProfile.age_band });
      dismiss(request.likerId);
      setRequest(null);
      if (match) setCelebration({ match, otherProfile: likerProfile, myProfile });
    } catch {} finally { setBusy(false); }
  };

  const handleDecline = () => {
    if (!request) return;
    dismiss(request.likerId);
    setRequest(null);
  };

  const name = request?.likerProfile?.display_name || 'Someone';
  const flag = request?.likerProfile?.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const avatar = request?.likerProfile?.avatar_url;

  return (
    <>
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center"
        >
          <div className="w-full max-w-md px-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-4 flex items-center gap-3 border border-gray-100 relative">
            <button onClick={handleDecline} disabled={busy} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500">
              <X className="w-4 h-4" />
            </button>
            <div className="flex-shrink-0">
              {avatar ? (
                <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}>
                  {name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{flag} {name}</p>
              <p className="text-xs text-gray-500">{t.wantsToConnect}</p>
            </div>
            <button
              onClick={handleDecline}
              disabled={busy}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 disabled:opacity-50"
            >
              {t.decline}
            </button>
            <button
              onClick={handleAccept}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t.accept}
            </button>
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    {celebration && (
      <MatchModal
        match={{ ...celebration.match, otherProfile: celebration.otherProfile }}
        myProfile={celebration.myProfile}
        onClose={() => setCelebration(null)}
      />
    )}
    </>
  );
}