import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, Loader2, UserPlus } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

// Search a specific user by name and send them a connection request,
// the same way a "like" from the discovery deck does.
export default function SearchUsers({ myId, onClose, onConnect }) {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const debounceRef = useRef(null);
  const cacheRef = useRef(null);

  const getAllProfiles = async () => {
    if (cacheRef.current) return cacheRef.current;
    const all = await base44.entities.Profile.filter({ onboarding_step: 'complete' }, '-created_date', 200);
    cacheRef.current = all;
    return all;
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const all = await getAllProfiles();
        const needle = q.trim().toLowerCase();
        const filtered = all
          .filter((p) => {
            const pid = p.user_id || p.created_by_id;
            if (pid === myId) return false;
            return (p.display_name || '').toLowerCase().includes(needle);
          })
          .slice(0, 20);
        setResults(filtered);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  const handleConnect = async (profile) => {
    setSendingId(profile.id);
    try { await onConnect(profile); } finally { setSendingId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#E6E2D8' }}>
      {/* Header */}
      <div className="px-4 pb-4 flex-shrink-0" style={{ paddingTop: '52px', background: 'linear-gradient(145deg, #132E4C 0%, #0D6470 100%)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white/80 p-1">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white/15 text-white placeholder-white/50 focus:outline-none text-sm border border-white/20"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        {!loading && q.trim() && results.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">{t.searchUsers}…</div>
        )}
        {!loading && !q.trim() && (
          <div className="text-center py-12 text-gray-400 text-sm">{t.searchPlaceholder}</div>
        )}
        {results.map((p) => {
          const name = p.display_name || 'User';
          const flag = p.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}>
                  {name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{flag} {name}</p>
                {p.bio && <p className="text-xs text-gray-400 truncate">{p.bio}</p>}
              </div>
              <button
                onClick={() => handleConnect(p)}
                disabled={sendingId === p.id}
                className="px-3 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}
              >
                {sendingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {t.connect}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}