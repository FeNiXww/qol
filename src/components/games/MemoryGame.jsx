import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function MemoryGame() {
  const { t } = useLang();
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [turn, setTurn] = useState(1);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [busy, setBusy] = useState(false);

  const start = useCallback(() => {
    setCards(buildDeck());
    setFlipped([]);
    setMatched([]);
    setTurn(1);
    setScore1(0);
    setScore2(0);
    setBusy(false);
  }, []);

  useEffect(() => { start(); }, [start]);

  const onCardClick = (idx) => {
    if (busy) return;
    if (matched.includes(cards[idx].pairId)) return;
    if (flipped.includes(idx)) return;
    if (flipped.length >= 2) return;

    const next = [...flipped, idx];
    setFlipped(next);

    if (next.length === 2) {
      setBusy(true);
      const [i1, i2] = next;
      const player = turn;
      if (cards[i1].pairId === cards[i2].pairId) {
        setTimeout(() => {
          setMatched(m => [...m, cards[i1].pairId]);
          setFlipped([]);
          setBusy(false);
          if (player === 1) setScore1(s => s + 1); else setScore2(s => s + 1);
        }, 650);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
          setTurn(player === 1 ? 2 : 1);
        }, 1000);
      }
    }
  };

  const allMatched = cards.length > 0 && matched.length === PAIRS;
  const p1Color = theme.colors.teal;
  const p2Color = theme.colors.orange;

  return (
    <div className="flex flex-col h-full px-4 pt-3 pb-5" style={{ background: '#F8FFFE' }}>
      {/* Scoreboard + turn */}
      <div className="flex items-stretch gap-2 mb-4">
        <PlayerScore label={t.player1} score={score1} color={p1Color} active={turn === 1 && !allMatched} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            key={`${turn}-${allMatched}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-sm"
            style={{ background: turn === 1 ? p1Color : p2Color }}
          >
            {t.playerTurn} {turn}
          </motion.div>
        </div>
        <PlayerScore label={t.player2} score={score2} color={p2Color} active={turn === 2 && !allMatched} />
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-md">
          {cards.map((card, idx) => (
            <MemoryCard
              key={card.uid}
              card={card}
              flipped={flipped.includes(idx)}
              matched={matched.includes(card.pairId)}
              onClick={() => onCardClick(idx)}
              disabled={busy}
            />
          ))}
        </div>
      </div>

      {/* Game over */}
      <AnimatePresence>
        {allMatched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl px-7 py-8 flex flex-col items-center shadow-2xl w-full max-w-xs"
            >
              <div className="text-5xl mb-3">{score1 === score2 ? '🤝' : '🏆'}</div>
              <p className="text-2xl font-black mb-1 text-center" style={{ color: theme.colors.navy }}>
                {score1 === score2 ? t.tie : `${t.player} ${score1 > score2 ? 1 : 2} ${t.winner}`}
              </p>
              <p className="text-gray-500 mb-5 text-sm">{t.finalScore}</p>
              <div className="flex gap-6 mb-6">
                <ScorePill label={t.player1} score={score1} color={p1Color} />
                <ScorePill label={t.player2} score={score2} color={p2Color} />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={start}
                className="px-10 py-3 rounded-xl text-white font-bold shadow-md"
                style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
              >
                {t.playAgain}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayerScore({ label, score, color, active }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-2 py-2 rounded-2xl flex-1 transition-all"
      style={{
        background: active ? `${color}15` : '#fff',
        border: active ? `2px solid ${color}` : '2px solid #EEF2F1',
      }}
    >
      <p className="text-[10px] font-bold" style={{ color: active ? color : '#9CA3AF' }}>{label}</p>
      <p className="text-xl font-black" style={{ color }}>{score}</p>
    </div>
  );
}

function ScorePill({ label, score, color }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-[10px] font-bold text-gray-400">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>{score}</p>
    </div>
  );
}