import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { requestNotificationPermission, showGameInviteNotification } from '@/lib/gameNotifications';

export default function GameInvitations() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [accepting, setAccepting] = useState(null);
  const knownInviteIds = useRef(new Set());

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    requestNotificationPermission();
  }, []);

  const loadInvites = useCallback(async () => {
    if (!currentUser) return;
    try {
      const sessions = await base44.entities.GameSession.filter({ player_b_id: currentUser.id, status: 'waiting' }, '-created_date', 20);
      const enriched = await Promise.all(sessions.map(async (s) => {
        const profiles = await base44.entities.Profile.filter({ user_id: s.player_a_id });
        return { ...s, inviterProfile: profiles[0] || null };
      }));
      // Fire notification for any new invite we haven't seen yet
      enriched.forEach(inv => {
        if (!knownInviteIds.current.has(inv.id)) {
          if (knownInviteIds.current.size > 0) {
            // Only notify if we already had a baseline (not on first load)
            const name = inv.inviterProfile?.display_name || t.opponent;
            const gameName = inv.game_type === 'word_guess' ? t.wordGuessName
              : inv.game_type === 'translation_duel' ? t.translationDuelName
              : t.memoryGameName;
            showGameInviteNotification({ inviterName: name, gameName });
          }
          knownInviteIds.current.add(inv.id);
        }
      });
      setInvites(enriched);
    } catch (e) {
      // ignore
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadInvites();
    if (!currentUser) return;
    const unsub = base44.entities.GameSession.subscribe(() => { loadInvites(); });
    return unsub;
  }, [currentUser?.id]);

  const acceptInvite = async (session) => {
    setAccepting(session.id);
    try {
      await base44.entities.GameSession.update(session.id, { status: 'active' });
      navigate(`/game/${session.id}`);
    } finally {
      setAccepting(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{t.pendingInvites}</p>
      <div className="space-y-2">
        {invites.map(inv => {
          const name = inv.inviterProfile?.display_name || t.opponent;
          const flag = inv.inviterProfile?.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
          const gameName = inv.game_type === 'word_guess' ? t.wordGuessName : inv.game_type === 'translation_duel' ? t.translationDuelName : t.memoryGameName;
          const isAccepting = accepting === inv.id;
          return (
            <button
              key={inv.id}
              onClick={() => acceptInvite(inv)}
              disabled={!!accepting}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left shadow-sm border-2 transition-all active:scale-[0.98]"
              style={{ background: 'white', borderColor: theme.colors.orange }}
            >
              {inv.inviterProfile?.avatar_url ? (
                <img src={inv.inviterProfile.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, #132E4C, #1E4870)` }}
                >
                  {name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{flag} {name}</p>
                <p className="text-xs text-gray-400">{t.invitedYou} {gameName}</p>
              </div>
              <span
                className="px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1 flex-shrink-0"
                style={{ background: theme.colors.orange }}
              >
                {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.acceptInvite}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}