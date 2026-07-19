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
  const [localFlipped, setLocalFlipped] = useState([]);
  const [localMatched, setLocalMatched] = useState([]);
  const [myMatches, setMyMatches] = useState(() => (isPlayerA ? session.score_a || 0 : session.score_b || 0));
  const initRef = useRef(false);

  let board = null;
  try {
    board = session.board_state ? JSON.parse(session.board_state) : null;
  } catch (e) {
    board = null;
  }

  const currentTurn = session.current_turn || 'a';
  const myTurn = isPlayerA ? currentTurn === 'a' : currentTurn === 'b';
  const otherName = otherProfile?.display_name || t.opponent;

  // Reset optimistic flip state whenever the turn switches.
  useEffect(() => {
    setLocalFlipped([]);
  }, [currentTurn]);

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

  const onCardClick = (idx) => {
    if (busy || !board || !myTurn) return;
    const pairId = board.deck[idx].pairId;
    if (board.matched.includes(pairId) || localMatched.includes(pairId)) return;
    if (localFlipped.includes(idx)) return;
    if (localFlipped.length >= 2) return;

    const deck = board.deck;
    const newFlipped = [...localFlipped, idx];
    setLocalFlipped(newFlipped);

    // Sync the flip to the opponent in the background (don't block the UI).
    base44.entities.GameSession.update(session.id, {
      board_state: JSON.stringify({ deck, flipped: newFlipped, matched: board.matched }),
    }).catch(() => {});

    if (newFlipped.length === 2) {
      setBusy(true);
      const [i1, i2] = newFlipped;
      const player = currentTurn;
      const capturedMatched = board.matched;
      const capturedLocalMatched = [...localMatched];
      const capturedMyMatches = myMatches;

      if (deck[i1].pairId === deck[i2].pairId) {
        setTimeout(() => {
          const newMyMatches = capturedMyMatches + 1;
          setMyMatches(newMyMatches);
          setLocalMatched(m => [...m, deck[i1].pairId]);
          setLocalFlipped([]);
          const globalMatched = Array.from(new Set([...capturedMatched, ...capturedLocalMatched, deck[i1].pairId]));
          const scoreKey = isPlayerA ? 'score_a' : 'score_b';
          const update = {
            board_state: JSON.stringify({ deck, flipped: [], matched: globalMatched }),
            [scoreKey]: newMyMatches,
          };
          if (globalMatched.length >= PAIRS) {
            update.status = 'finished';
            const theirScore = isPlayerA ? session.score_b : session.score_a;
            update.winner_id = newMyMatches > theirScore
              ? session.player_a_id
              : theirScore > newMyMatches
                ? session.player_b_id
                : null;
          }
          base44.entities.GameSession.update(session.id, update).catch(() => {});
          setBusy(false);
        }, 650);
      } else {
        setTimeout(() => {
          setLocalFlipped([]);
          base44.entities.GameSession.update(session.id, {
            board_state: JSON.stringify({ deck, flipped: [], matched: capturedMatched }),
            current_turn: player === 'a' ? 'b' : 'a',
          }).catch(() => {});
          setBusy(false);
        }, 1000);
      }
    }
  };

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: theme.colors.teal }} />
      </div>
    );
  }

  const displayFlipped = myTurn ? localFlipped : board.flipped;
  const displayMatched = myTurn ? [...board.matched, ...localMatched] : board.matched;
  const myColor = isPlayerA ? theme.colors.teal : theme.colors.orange;
  const theirColor = isPlayerA ? theme.colors.orange : theme.colors.teal;
  const myScore = myMatches;
  const theirScore = isPlayerA ? session.score_b : session.score_a;

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
              flipped={displayFlipped.includes(idx)}
              matched={displayMatched.includes(card.pairId)}
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