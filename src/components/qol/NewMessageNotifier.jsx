import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/contexts/LanguageContext';
import { theme } from '@/lib/theme';
import { MessageCircle, X } from 'lucide-react';

// Listens for incoming messages and alerts the user with an in-app popup
// (and a browser notification when the tab is in the background).
export default function NewMessageNotifier() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLang();
  const [alert, setAlert] = useState(null);
  const userRef = useRef(null);
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  const title = lang === 'ar' ? 'رسالة جديدة من' : 'הודעה חדשה מ־';

  useEffect(() => {
    base44.auth.me().then(u => { userRef.current = u; }).catch(() => {});
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const unsub = base44.entities.Message.subscribe(async (event) => {
      const msg = event.data;
      const me = userRef.current;
      if (event.type !== 'create' || !me || !msg || msg.sender_id === me.id) return;
      // Skip if the user is already inside this chat
      if (pathRef.current === `/chat/${msg.match_id}`) return;

      // Confirm the message belongs to one of my matches
      let match = null;
      try { match = await base44.entities.Match.get(msg.match_id); } catch { return; }
      if (match.user_a_id !== me.id && match.user_b_id !== me.id) return;

      const profiles = await base44.entities.Profile.filter({ created_by_id: msg.sender_id });
      const sender = profiles[0];
      const name = sender?.display_name || 'Connection';

      setAlert({ matchId: msg.match_id, name, avatar: sender?.avatar_url });

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
        try {
          const n = new Notification(`${title} ${name}`, { body: '💬', icon: sender?.avatar_url });
          n.onclick = () => { window.focus(); navigate(`/chat/${msg.match_id}`); };
        } catch {}
      }
    });
    return unsub;
  }, [navigate, title]);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  if (!alert) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <button
        onClick={() => { setAlert(null); navigate(`/chat/${alert.matchId}`); }}
        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white text-left shadow-xl border border-gray-100 animate-in slide-in-from-top duration-300"
      >
        {alert.avatar ? (
          <img src={alert.avatar} alt={alert.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
          >
            {alert.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate text-sm">{title} {alert.name}</p>
          <p className="text-xs flex items-center gap-1" style={{ color: theme.colors.teal }}>
            <MessageCircle className="w-3 h-3" /> 💬
          </p>
        </div>
        <span
          onClick={(e) => { e.stopPropagation(); setAlert(null); }}
          className="p-1 text-gray-300 hover:text-gray-500"
        >
          <X className="w-4 h-4" />
        </span>
      </button>
    </div>
  );
}