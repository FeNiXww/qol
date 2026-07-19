import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getMatches, isProfileOnline } from '@/lib/matchesApi';
import { theme } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, ChevronRight, BookOpen } from 'lucide-react';
import QolLogo from '@/components/qol/QolLogo';
import GameInvitations from '@/components/qol/GameInvitations';
import { useLang } from '@/contexts/LanguageContext';

const GAMES_CONFIG = [
  { id: 'word_guess', emoji: '🔤', color: theme.colors.teal, nameKey: 'wordGuessName', descKey: 'wordGuessDesc' },
  { id: 'translation_duel', emoji: '⚔️', color: theme.colors.orange, nameKey: 'translationDuelName', descKey: 'translationDuelDesc' },
  { id: 'memory', emoji: '🃏', color: theme.colors.orange, nameKey: 'memoryGameName', descKey: 'memoryGameDesc' },
];

const OFFLINE_GAMES = [
  { id: 'letter_match', emoji: '🧩', color: theme.colors.navy, nameKey: 'letterMatchName', descKey: 'letterMatchDesc' },
];

export default function MiniGames() {
  const navigate = useNavigate();
  const { t } = useLang();
  const GAMES = GAMES_CONFIG.map(g => ({ ...g, name: t[g.nameKey], description: t[g.descKey] }));
  const [matches, setMatches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [creating, setCreating] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    getMatches(currentUser.id).then(data => {
      setMatches(data);
      setLoading(false);
    });
  }, [currentUser?.id, refreshTick]);

  // Re-evaluate online status every 30s without refetching all matches
  useEffect(() => {
    const interval = setInterval(() => setRefreshTick(t => t + 1), 30_000);
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
        <div className="flex items-center gap-2.5 mb-0.5">
          <QolLogo size={36} />
          <h1 className="text-2xl font-black text-white">{t.miniGamesTitle}</h1>
        </div>
        <p className="text-xs font-medium mt-1" style={{ color: '#268ECE' }}>
          {t.learnTogether}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Pending game invitations */}
        <GameInvitations />

        {/* Offline / single-player games */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{t.offlineGames}</p>
          <div className="space-y-3">
            {OFFLINE_GAMES.map(game => {
              const g = { ...game, name: t[game.nameKey], description: t[game.descKey] };
              return (
                <button
                  key={g.id}
                  onClick={() => navigate('/letter-match')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-white text-left transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
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
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-white text-left transition-all shadow-sm"
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
                {selectedGame?.id === game.id && (
                  <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: game.color }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Match picker — shown after game selected */}
        {selectedGame && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              {t.pickMatch}
            </p>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-7 h-7 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: theme.colors.teal }} />
              </div>
            ) : (
              (() => {
                const onlineMatches = matches.filter(m => isProfileOnline(m.otherProfile));
                if (onlineMatches.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {t.noMatchesOnline}
                    </div>
                  );
                }
                return (
              <div className="space-y-2">
                {onlineMatches.map(match => {
                  const other = match.otherProfile;
                  const name = other?.display_name || 'Connection';
                  const flag = other?.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
                  return (
                    <button
                      key={match.id}
                      onClick={() => startGame(match, selectedGame.id)}
                      disabled={creating}
                      className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-50 text-left transition-all hover:shadow-md active:scale-[0.98]"
                    >
                      {other?.avatar_url ? (
                        <img src={other.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
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
                })}
              </div>
                );
              })()
            )}
          </div>
        )}

        {/* Hint when no game selected */}
        {!selectedGame && (
          <div className="flex flex-col items-center py-10 text-center text-gray-400">
            <BookOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{t.selectGameHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}