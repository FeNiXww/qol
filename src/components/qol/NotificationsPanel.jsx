import React from 'react';
import { X, Check, Loader2, MessageCircle } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

// Presentational notifications list. State/handlers come from NotificationsProvider.
export default function NotificationsPanel({ data, loading, busyId, onClose, onAccept, onDecline, onOpenChat }) {
  const { t } = useLang();

  const all = [
    ...data.pending.map((p) => ({ kind: 'pending', ...p, date: p.swipe.created_date })),
    ...data.connections.map((c) => ({ kind: 'connection', ...c, date: c.match.created_date })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#E6E2D8' }}>
      <div
        className="px-4 pb-4 flex-shrink-0 flex items-center gap-3"
        style={{ paddingTop: '52px', background: 'linear-gradient(145deg, #132E4C 0%, #0D6470 100%)' }}
      >
        <button onClick={onClose} className="text-white/80 p-1">
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
                  onClick={() => onDecline(n)}
                  disabled={busyId === n.swipe.id}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 disabled:opacity-50"
                >
                  {t.decline}
                </button>
                <button
                  onClick={() => onAccept(n)}
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
                onClick={() => onOpenChat(n.match.id)}
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
  );
}