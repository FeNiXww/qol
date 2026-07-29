import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, Loader2, Check, UserPlus } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

// Full-screen searchable user picker. Used by GroupInfoSheet to add members.
// excludeIds hides those users from results (current members + self).
// onConfirm receives the newly-selected user ids (excludes already-members).
export default function GroupMemberSearch({
  myId,
  ageBand,
  excludeIds = [],
  onClose,
  onConfirm,
  onSkip,
  skipLabel = 'Skip for now',
  title = 'Add members',
  confirmLabel = 'Add',
}) {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const debounceRef = useRef(null);
  const cacheRef = useRef(null);
  const excludeSet = useRef(new Set([...excludeIds, myId]));

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
            if (excludeSet.current.has(pid)) return false;
            if (ageBand && p.age_band && p.age_band !== ageBand) return false;
            return (p.display_name || '').toLowerCase().includes(needle);
          })
          .slice(0, 30);
        setResults(filtered);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  const toggle = (profile) => {
    const pid = profile.user_id || profile.created_by_id;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid); else next.add(pid);
      return next;
    });
  };

  const selectedIds = [...selected];
  const handleConfirm = () => onConfirm(selectedIds);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: '#E6E2D8' }}>
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
              placeholder={title}
              className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white/15 text-white placeholder-white/50 focus:outline-none text-sm border border-white/20"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        {!loading && q.trim() && results.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No users found</div>
        )}
        {!loading && !q.trim() && (
          <div className="text-center py-12 text-gray-400 text-sm">Search by name to add members</div>
        )}
        {results.map((p) => {
          const pid = p.user_id || p.created_by_id;
          const isSelected = selected.has(pid);
          const name = p.display_name || 'User';
          const flag = p.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
          return (
            <button
              key={p.id}
              onClick={() => toggle(p)}
              className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl text-left"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: isSelected ? '2px solid #16A499' : '1px solid rgba(0,0,0,0.04)' }}
            >
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}>
                  {name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-gray-900 truncate">{flag} {name}</p>
                {p.bio && <p className="text-xs text-gray-400 truncate">{p.bio}</p>}
              </div>
              {isSelected && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#16A499' }}>
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 flex-col flex-shrink-0">
        <button
          onClick={handleConfirm}
          className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #16A499, #0D6470)' }}
        >
          <UserPlus className="w-4 h-4" />
          {confirmLabel}{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </button>
        {onSkip && (
          <button onClick={onSkip} className="w-full text-sm text-gray-400 font-semibold py-2">
            {skipLabel}
          </button>
        )}
      </div>
    </div>
  );
}