import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Loader2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/contexts/LanguageContext';
import { fetchNotifications, acceptConnectionRequest, DISMISS_KEY } from '@/lib/discovery';

// Global notifications bell (every signed-in page under Layout) + a panel that
// lists past notifications: pending connection invites and connections made.
export default function NotificationsButton() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ pending: [], connections: [] });
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { base44.auth.me().then(setMe).catch(() => {}); }, []);

  const load = async () => {
    if (!me) return;
    setLoading(true);
    try { setData(await fetchNotifications(me.id)); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!me) return;
    load();
    const unsubS = base44.entities.Swipe.subscribe(() => load());
    const unsubM = base44.entities.Match.subscribe(() => load());
    return () => { unsubS(); unsubM(); };
  }, [me?.id]);

  const pendingCount = data.pending.length;

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
      if (match) { setOpen(false); navigate(`/chat/${match.id}`); }
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

  const all = [
    ...data.pending.map((p) => ({ kind: 'pending', ...p, date: p.swipe.created_date })),
    ...data.connections.map((c) => ({ kind: 'connection', ...c, date: c.match.created_date })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute z-40 flex items-center justify-center"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
          right: 14,
          width: 40,
          height: 40,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Bell className="w-5 h-5 text-white" />
        {pendingCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: '#FA7C27' }}
          >
            {pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#E6E2D8' }}>
          <div className="px-4 pb-4 flex-shrink-0 flex items-center gap-3" style={{ paddingTop: '52px', background: 'linear-gradient(145deg, #132E4C 0%, #0D6470 100%)' }}>
            <button onClick={() => setOpen(false)} className="text-white/80 p-1">
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black text-white">{t.notifications}</h1>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {loading && all.length === 0 && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
            {!loading && all.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">{t.noNotifications}</div>
            )}
            {all.map((n, idx) => {
              const name = n.profile?.display_name || 'Someone';
              const flag = n.profile?.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
              const avatar = n.profile?.avatar_url;
              if (n.kind === 'pending') {
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100">
                    {avatar ? (
                      <img src={avatar} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}>
                        {name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{flag} {name}</p>
                      <p className="text-xs text-gray-500">{t.wantsToConnect}</p>
                    </div>
                    <button
                      onClick={() => handleDecline(n)}
                      disabled={busyId === n.swipe.id}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 disabled:opacity-50"
                    >
                      {t.decline}
                    </button>
                    <button
                      onClick={() => handleAccept(n)}
                      disabled={busyId === n.swipe.id}
                      className="px-3 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}
                    >
                      {busyId === n.swipe.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {t.accept}
                    </button>
                  </div>
                );
              }
              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100">
                  {avatar ? (
                    <img src={avatar} className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #16A499, #0D6470)' }}>
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{flag} {name}</p>
                    <p className="text-xs text-gray-500">{t.connectedWith} 🤝</p>
                  </div>
                  <button
                    onClick={() => { setOpen(false); navigate(`/chat/${n.match.id}`); }}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1"
                    style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}