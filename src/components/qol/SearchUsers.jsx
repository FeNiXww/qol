import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { ProfileCard } from '@/components/qol/ScrollDeck';

// Search a specific user by name and send them a connection request,
// the same way a "like" from the discovery deck does. Results render as the
// same profile cards used on the Discover page.
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
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const all = await base44.entities.Profile.filter({ onboarding_step: 'complete' }, '-created_date', 200);
        cacheRef.current = all;
        return all;
      } catch (e) {
        lastErr = e;
        // Rate-limited: wait for the burst to settle, then retry.
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      }
    }
    throw lastErr;
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
      } catch {
        setResults([]);
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

  // While a request is mid-flight, disable that card's connect button
  const isSending = (p) => sendingId === p.id;

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
      <div className="flex-1 overflow-y-auto px-2 py-4">
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
        <div className="space-y-4">
          {results.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onConnect={isSending(p) ? () => {} : handleConnect}
              onPass={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}