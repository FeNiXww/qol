import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getMatches } from '@/lib/matchesApi';
import { theme } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, ChevronRight, Zap, BookOpen } from 'lucide-react';
import QolLogo from '@/components/qol/QolLogo';
import { useLang } from '@/contexts/LanguageContext';

const GAMES = [
  {
    id: 'word_guess',
    name: 'Word Guess',
    emoji: '🔤',
    description: 'Guess the word in the other language. Take turns!',
    color: theme.colors.teal,
  },
  {
    id: 'translation_duel',
    name: 'Translation Duel',
    emoji: '⚔️',
    description: 'Translate a phrase — your partner rates your answer!',
    color: theme.colors.orange,
  },
];

export default function MiniGames() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [matches, setMatches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [creating, setCreating] = useState(false);

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
    <div className="flex flex-col h-full" style={{ background: '#F8FFFE' }}>
      {/* Header */}
      <div
        className="px-6 pb-5 flex-shrink-0 shadow-sm"
        style={{ paddingTop: '52px', background: `linear-gradient(135deg, ${theme.colors.navy} 0%, ${theme.colors.navyLight} 100%)` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <QolLogo size={32} blend />
          <h1 className="text-2xl font-black text-white">{t.miniGamesTitle}</h1>
        </div>
        <p className="text-xs mt-1" style={{ color: theme.colors.tealLight }}>
          {t.learnTogether}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Game picker */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{t.chooseGame}</p>
          <div className="space-y-3">
            {GAMES.map(game => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(selectedGame?.id === game.id ? null : game)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-white text-left transition-all shadow-sm"
                style={{
                  borderColor: selectedGame?.id === game.id ? game.color : '#F0FDFA',
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
                  <Zap className="w-5 h-5 flex-shrink-0" style={{ color: game.color }} />
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
            ) : matches.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                {t.noMatchesForGame}
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map(match => {
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
                      <ChevronRight className="w-5 h-5 flex-shrink-0 text-gray-300" />
                    </button>
                  );
                })}
              </div>
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