import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getMatches, isProfileOnline } from '@/lib/matchesApi';
import { theme } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Settings, X } from 'lucide-react';

import QolLogo from '@/components/qol/QolLogo';
import GameInvitations from '@/components/qol/GameInvitations';
import { useLang } from '@/contexts/LanguageContext';

const GAMES_CONFIG = [
  { id: 'word_guess', emoji: '🔤', color: theme.colors.teal, nameKey: 'wordGuessName', descKey: 'wordGuessDesc' },
  { id: 'translation_duel', emoji: '⚔️', color: theme.colors.orange, nameKey: 'translationDuelName', descKey: 'translationDuelDesc' },
  { id: 'memory', emoji: '🃏', color: theme.colors.orange, nameKey: 'memoryGameName', descKey: 'memoryGameDesc' },
];

const OFFLINE_GAMES = [
  { id: 'letter_match', emoji: '🧩', color: theme.colors.navy, nameKey: 'letterMatchName', descKey: 'letterMatchDesc', path: '/letter-match' },
];

export default function MiniGames() {
  const navigate = useNavigate();
  const { t } = useLang();
  const GAMES = GAMES_CONFIG.map(g => ({ ...g, name: t[g.nameKey], description: t[g.descKey] }));
  const soloGames = OFFLINE_GAMES.map(g => ({ ...g, name: t[g.nameKey], description: t[g.descKey] }));
  const [matches, setMatches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [creating, setCreating] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    getMatches(currentUser.id).then(data => {
      setMatches(data);
      setLoading(false);
    });
  }, [currentUser?.id]);

  // Re-evaluate online status every 30s by re-rendering only — no re-fetch
  useEffect(() => {
    const interval = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const startGame = async (match, gameType) => {
    setCreating(true);
    try {
      const otherId = match.user_a_id === currentUser.id ? match.user_b_id : match.user_a_id;
      const session = await base44.entities.GameSession.create({
        match_id: match.id,
        player_a_id: currentUser.id,
        player_b_id: otherId,
        game_type: gameType,
        status: 'waiting',
        current_round: 1,
        total_rounds: 5,
        score_a: 0,
        score_b: 0,
      });
      navigate(`/game/${session.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#E6E2D8' }}>
      {/* Header */}
      <div
        className="px-5 pb-5 flex-shrink-0"
        style={{ paddingTop: '52px', background: 'linear-gradient(145deg, #132E4C 0%, #0D6470 100%)', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2.5">
            <QolLogo size={36} />
            <h1 className="text-2xl font-black text-white">{t.miniGamesTitle}</h1>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Settings className="w-4 h-4 text-white/80" />
          </button>
        </div>
        <p className="text-xs font-medium mt-1" style={{ color: '#268ECE' }}>
          {t.learnTogether}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6" style={{ background: '#E6E2D8' }}>
        {/* Pending game invitations */}
        <GameInvitations />

        {/* Offline / single-player games */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{t.offlineGames}</p>
          <div className="space-y-3">
            {soloGames.map(g => {
              return (
                <button
                  key={g.id}
                  onClick={() => navigate(g.path)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-white transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                  style={{ borderColor: 'rgba(22,164,153,0.12)' }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${g.color}18` }}
                  >
                    {g.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{g.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{g.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0 text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-player game picker */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{t.twoPlayerGames}</p>
          <div className="space-y-3">
            {GAMES.map(game => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(selectedGame?.id === game.id ? null : game)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-white transition-all shadow-sm"
                style={{
                  borderColor: selectedGame?.id === game.id ? game.color : 'rgba(22,164,153,0.12)',
                  boxShadow: selectedGame?.id === game.id ? `0 0 0 2px ${game.color}30` : undefined,
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${game.color}18` }}
                >
                  {game.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{game.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{game.description}</p>
                </div>
                <ChevronRight
                  className="w-5 h-5 flex-shrink-0 transition-transform"
                  style={{ color: selectedGame?.id === game.id ? game.color : '#CBD5E1', transform: selectedGame?.id === game.id ? 'rotate(90deg)' : 'none' }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Hint when no game selected */}
        {!selectedGame && (
          <div className="flex flex-col items-center py-10 text-center text-gray-400">
            <span className="text-5xl mb-3 opacity-40">🎮</span>
            <p className="text-sm">{t.selectGameHint}</p>
          </div>
        )}
      </div>

      {/* Match picker popup */}
      {selectedGame && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setSelectedGame(null)}
          />
          {/* Bottom sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
            style={{ maxHeight: '70vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedGame.emoji}</span>
                <div>
                  <p className="font-bold text-gray-900">{selectedGame.name}</p>
                  <p className="text-xs text-gray-400">{t.pickMatch}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Match list */}
            <div className="overflow-y-auto px-4 py-4 space-y-2" style={{ maxHeight: 'calc(70vh - 100px)' }}>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-7 h-7 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: theme.colors.teal }} />
                </div>
              ) : (() => {
                const onlineMatches = matches.filter(m => isProfileOnline(m.otherProfile));
                if (onlineMatches.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {t.noMatchesOnline}
                    </div>
                  );
                }
                return onlineMatches.map(match => {
                  const other = match.otherProfile;
                  const name = other?.display_name || 'Connection';
                  const flag = other?.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
                  return (
                    <button
                      key={match.id}
                      onClick={() => startGame(match, selectedGame.id)}
                      disabled={creating}
                      className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:shadow-md active:scale-[0.98]"
                    >
                      {other?.avatar_url ? (
                        <img src={other.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
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
                        <p className="text-xs text-gray-400">{t.playWith} {selectedGame.name}</p>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0 ring-2 ring-white" />
                      <ChevronRight className="w-5 h-5 flex-shrink-0 text-gray-300" />
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}