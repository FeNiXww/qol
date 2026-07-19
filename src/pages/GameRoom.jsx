import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import WordGuessGame from '@/components/games/WordGuessGame';
import TranslationDuelGame from '@/components/games/TranslationDuelGame';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

export default function GameRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      const s = await base44.entities.GameSession.get(sessionId);
      setSession(s);
      const otherId = s.player_a_id === currentUser.id ? s.player_b_id : s.player_a_id;
      const [myProfiles, otherProfiles] = await Promise.all([
        base44.entities.Profile.filter({ user_id: currentUser.id }),
        base44.entities.Profile.filter({ user_id: otherId }),
      ]);
      setMyProfile(myProfiles[0] || null);
      setOtherProfile(otherProfiles[0] || null);
      setLoading(false);
    };
    load();

    // Real-time sync
    const unsub = base44.entities.GameSession.subscribe(event => {
      if (event.data?.id === sessionId) setSession(event.data);
    });
    return unsub;
  }, [sessionId, currentUser?.id]);

  if (loading || !session || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: theme.colors.teal }} />
      </div>
    );
  }

  const isPlayerA = session.player_a_id === currentUser.id;
  const myScore = isPlayerA ? session.score_a : session.score_b;
  const theirScore = isPlayerA ? session.score_b : session.score_a;
  const otherName = otherProfile?.display_name || t.opponent;

  const cancelInvite = async () => {
    try { await base44.entities.GameSession.delete(session.id); } catch (e) { /* ignore */ }
    navigate('/games');
  };

  // Waiting room — opponent hasn't accepted the invitation yet
  if (session.status === 'waiting') {
    const avatarUrl = otherProfile?.avatar_url;
    return (
      <div className="flex flex-col items-center justify-center h-screen px-8 text-center relative" style={{ background: '#F8FFFE' }}>
        <button onClick={cancelInvite} className="absolute left-4 text-gray-400 p-1" style={{ top: '52px' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        {avatarUrl ? (
          <img src={avatarUrl} alt={otherName} className="w-24 h-24 rounded-full object-cover shadow-lg mb-5" />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg mb-5"
            style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
          >
            {otherName[0]?.toUpperCase()}
          </div>
        )}
        <h2 className="text-2xl font-black mb-2" style={{ color: theme.colors.navy }}>{t.waitingForOpponent}</h2>
        <p className="text-gray-400 mb-6 text-sm">{t.inviteSent} {otherName}</p>
        <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: theme.colors.teal }} />
        {isPlayerA && (
          <button
            onClick={cancelInvite}
            className="mt-10 px-6 py-2.5 rounded-2xl text-gray-600 font-semibold text-sm bg-white border border-gray-200 shadow-sm"
          >
            {t.cancel}
          </button>
        )}
      </div>
    );
  }

  if (session.status === 'finished') {
    const iWon = session.winner_id === currentUser.id;
    const isDraw = !session.winner_id;
    return (
      <div className="flex flex-col items-center justify-center h-screen px-8 text-center" style={{ background: '#F8FFFE' }}>
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl"
          style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
        >
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-black mb-2" style={{ color: theme.colors.navy }}>
          {isDraw ? t.itsDraw : iWon ? t.youWon : t.goodGame}
        </h2>
        <p className="text-gray-500 mb-2">{t.finalScore}</p>
        <p className="text-2xl font-bold mb-8" style={{ color: theme.colors.teal }}>
          {t.you} {myScore} — {theirScore} {otherName}
        </p>
        <button
          onClick={() => navigate('/games')}
          className="px-8 py-3 rounded-2xl text-white font-bold shadow-lg"
          style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
        >
          {t.playAgain}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: '#F8FFFE' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-4 flex-shrink-0 shadow-md"
        style={{ paddingTop: '52px', background: `linear-gradient(135deg, ${theme.colors.navy}, #1a2a5e)` }}
      >
        <button onClick={() => navigate('/games')} className="text-white/70 p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-white text-sm">
            {session.game_type === 'word_guess' ? t.wordGuessGameName : t.translationDuelGameName}
          </p>
          <p className="text-xs text-white/50">{t.roundOf} {session.current_round} {t.of} {session.total_rounds}</p>
        </div>
        {/* Scores */}
        <div className="flex items-center gap-2">
          <div className="text-center">
            <p className="text-lg font-black text-white leading-none">{myScore}</p>
            <p className="text-[10px] text-white/50">{t.you}</p>
          </div>
          <p className="text-white/40 font-bold">—</p>
          <div className="text-center">
            <p className="text-lg font-black text-white leading-none">{theirScore}</p>
            <p className="text-[10px] text-white/50">{otherName.split(' ')[0]}</p>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 overflow-y-auto">
        {session.game_type === 'word_guess' && (
          <WordGuessGame
            session={session}
            currentUser={currentUser}
            myProfile={myProfile}
            otherProfile={otherProfile}
            isPlayerA={isPlayerA}
          />
        )}
        {session.game_type === 'translation_duel' && (
          <TranslationDuelGame
            session={session}
            currentUser={currentUser}
            myProfile={myProfile}
            otherProfile={otherProfile}
            isPlayerA={isPlayerA}
          />
        )}
      </div>
    </div>
  );
}