import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import { Loader2, X, Gamepad2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

export default function GameInvitePopup() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const dismissedIds = useRef(new Set());

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const checkInvites = useCallback(async () => {
    if (!currentUser) return;
    try {
      const sessions = await base44.entities.GameSession.filter(
        { player_b_id: currentUser.id, status: 'waiting' }, '-created_date', 5
      );
      const fresh = sessions.find(s => !dismissedIds.current.has(s.id));
      if (!fresh) { setInvite(null); return; }
      const profiles = await base44.entities.Profile.filter({ user_id: fresh.player_a_id });
      setInvite({ ...fresh, inviterProfile: profiles[0] || null });
    } catch {}
  }, [currentUser?.id]);

  useEffect(() => {
    checkInvites();
    if (!currentUser) return;
    const unsub = base44.entities.GameSession.subscribe(() => checkInvites());
    return unsub;
  }, [currentUser?.id, checkInvites]);

  const accept = async () => {
    if (!invite) return;
    setAccepting(true);
    try {
      await base44.entities.GameSession.update(invite.id, { status: 'active' });
      const id = invite.id;
      dismissedIds.current.add(id);
      setInvite(null);
      navigate(`/game/${id}`);
    } finally {
      setAccepting(false);
    }
  };

  const dismiss = () => {
    if (!invite) return;
    dismissedIds.current.add(invite.id);
    setInvite(null);
  };

  const name = invite?.inviterProfile?.display_name || t.opponent;
  const gameName = invite
    ? (invite.game_type === 'word_guess' ? t.wordGuessName
      : invite.game_type === 'translation_duel' ? t.translationDuelName
      : t.memoryGameName)
    : '';

  return (
    <AnimatePresence>
      {invite && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="fixed left-3 right-3 mx-auto z-50 max-w-md"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <div
            className="flex items-center gap-3 p-3.5 rounded-2xl shadow-xl border-2"
            style={{ background: 'white', borderColor: theme.colors.orange }}
          >
            {invite.inviterProfile?.avatar_url ? (
              <img src={invite.inviterProfile.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, #132E4C, #1E4870)` }}
              >
                <Gamepad2 className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{name}</p>
              <p className="text-xs text-gray-400 truncate">{t.invitedYou} {gameName}</p>
            </div>
            <button
              onClick={accept}
              disabled={accepting}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1 flex-shrink-0 active:scale-95 transition-transform"
              style={{ background: theme.colors.orange }}
            >
              {accepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.acceptInvite}
            </button>
            <button onClick={dismiss} className="p-1.5 flex-shrink-0">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}