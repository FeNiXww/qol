import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { useLang } from '@/contexts/LanguageContext';
import MemoryCard from './MemoryCard';

const PAIRS = 8;

const EMOJI_POOL = [
  { emoji: '🐶', he: 'כלב', ar: 'كلب' },
  { emoji: '🐱', he: 'חתול', ar: 'قطة' },
  { emoji: '🌞', he: 'שמש', ar: 'شمس' },
  { emoji: '🌙', he: 'ירח', ar: 'قمر' },
  { emoji: '⭐', he: 'כוכב', ar: 'نجم' },
  { emoji: '🌳', he: 'עץ', ar: 'شجرة' },
  { emoji: '🍎', he: 'תפוח', ar: 'تفاح' },
  { emoji: '🍌', he: 'בננה', ar: 'موز' },
  { emoji: '🐟', he: 'דג', ar: 'سمكة' },
  { emoji: '🐦', he: 'ציפור', ar: 'طائر' },
  { emoji: '🚗', he: 'מכונית', ar: 'سيارة' },
  { emoji: '🏠', he: 'בית', ar: 'بيت' },
  { emoji: '❤️', he: 'לב', ar: 'قلب' },
  { emoji: '🌸', he: 'פרח', ar: 'زهرة' },
  { emoji: '☔', he: 'גשם', ar: 'مطر' },
  { emoji: '🔥', he: 'אש', ar: 'نار' },
  { emoji: '💧', he: 'מים', ar: 'ماء' },
  { emoji: '🍕', he: 'פיצה', ar: 'بيتزا' },
  { emoji: '⚽', he: 'כדור', ar: 'كرة' },
  { emoji: '🎵', he: 'מוזיקה', ar: 'موسيقى' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  const chosen = shuffle(EMOJI_POOL).slice(0, PAIRS);
  const cards = chosen.flatMap((e, i) => [
    { ...e, pairId: i, uid: `${i}-a` },
    { ...e, pairId: i, uid: `${i}-b` },
  ]);
  return shuffle(cards);
}

export default function MemoryGame({ session, isPlayerA, otherProfile }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const initRef = useRef(false);

  let board = null;
  try {
    board = session.board_state ? JSON.parse(session.board_state) : null;
  } catch (e) {
    board = null;
  }

  const currentTurn = session.current_turn || 'a';
  const myTurn = isPlayerA ? currentTurn === 'a' : currentTurn === 'b';
  const myScore = isPlayerA ? session.score_a : session.score_b;
  const theirScore = isPlayerA ? session.score_b : session.score_a;
  const otherName = otherProfile?.display_name || t.opponent;

  // Player A builds the shared deck once the game goes active.
  useEffect(() => {
    if (isPlayerA && !session.board_state && !initRef.current) {
      initRef.current = true;
      const deck = buildDeck();
      base44.entities.GameSession.update(session.id, {
        board_state: JSON.stringify({ deck, flipped: [], matched: [] }),
        current_turn: 'a',
      }).catch(() => {});
    }
  }, [session.id, session.board_state, isPlayerA]);

  const onCardClick = async (idx) => {
    if (busy || !board || !myTurn) return;
    if (board.matched.includes(board.deck[idx].pairId)) return;
    if (board.flipped.includes(idx)) return;
    if (board.flipped.length >= 2) return;

    const deck = board.deck;
    const matchedNow = board.matched;
    const player = currentTurn;
    const newFlipped = [...board.flipped, idx];

    setBusy(true);
    await base44.entities.GameSession.update(session.id, {
      board_state: JSON.stringify({ deck, flipped: newFlipped, matched: matchedNow }),
    });

    if (newFlipped.length === 2) {
      const [i1, i2] = newFlipped;
      if (deck[i1].pairId === deck[i2].pairId) {
        setTimeout(async () => {
          const matched = [...matchedNow, deck[i1].pairId];
          const scoreA = player === 'a' ? session.score_a + 1 : session.score_a;
          const scoreB = player === 'b' ? session.score_b + 1 : session.score_b;
          const allMatched = matched.length === PAIRS;
          const update = {
            board_state: JSON.stringify({ deck, flipped: [], matched }),
            score_a: scoreA,
            score_b: scoreB,
          };
          if (allMatched) {
            update.status = 'finished';
            update.winner_id = scoreA > scoreB
              ? session.player_a_id
              : scoreB > scoreA
                ? session.player_b_id
                : null;
          }
          await base44.entities.GameSession.update(session.id, update);
          setBusy(false);
        }, 650);
      } else {
        setTimeout(async () => {
          await base44.entities.GameSession.update(session.id, {
            board_state: JSON.stringify({ deck, flipped: [], matched: matchedNow }),
            current_turn: player === 'a' ? 'b' : 'a',
          });
          setBusy(false);
        }, 1000);
      }
    } else {
      setBusy(false);
    }
  };

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: theme.colors.teal }} />
      </div>
    );
  }

  const myColor = isPlayerA ? theme.colors.teal : theme.colors.orange;
  const theirColor = isPlayerA ? theme.colors.orange : theme.colors.teal;

  return (
    <div className="flex flex-col h-full px-4 pt-3 pb-5" style={{ background: '#F8FFFE' }}>
      {/* Scoreboard + turn */}
      <div className="flex items-stretch gap-2 mb-4">
        <PlayerScore label={t.you} score={myScore} color={myColor} active={myTurn} />
        <div className="flex-1 flex items-center justify-center min-w-0">
          <motion.div
            key={currentTurn}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-sm text-center max-w-full"
            style={{ background: myTurn ? myColor : theirColor }}
          >
            {myTurn ? t.yourTurn : `${t.waitingFor} ${otherName}`}
          </motion.div>
        </div>
        <PlayerScore label={otherName} score={theirScore} color={theirColor} active={!myTurn} />
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-md">
          {board.deck.map((card, idx) => (
            <MemoryCard
              key={card.uid}
              card={card}
              flipped={board.flipped.includes(idx)}
              matched={board.matched.includes(card.pairId)}
              onClick={() => onCardClick(idx)}
              disabled={busy || !myTurn}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerScore({ label, score, color, active }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-2 py-2 rounded-2xl flex-1 transition-all min-w-0"
      style={{
        background: active ? `${color}15` : '#fff',
        border: active ? `2px solid ${color}` : '2px solid #EEF2F1',
      }}
    >
      <p className="text-[10px] font-bold truncate w-full text-center" style={{ color: active ? color : '#9CA3AF' }}>{label}</p>
      <p className="text-xl font-black" style={{ color }}>{score}</p>
    </div>
  );
}