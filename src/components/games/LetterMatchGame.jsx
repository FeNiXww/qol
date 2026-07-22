import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { RefreshCw, Volume2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

const MAX_MISTAKES = 3;
const PAIRS_PER_ROUND = 5;

// Hebrew ↔ Arabic cognate letter pairs
const LETTER_PAIRS = [
  ['א', 'ا'], ['ב', 'ب'], ['ג', 'ج'], ['ד', 'د'], ['ה', 'ه'], ['ו', 'و'],
  ['ז', 'ز'], ['ח', 'ح'], ['ט', 'ط'], ['י', 'ي'], ['כ', 'ك'], ['ל', 'ل'],
  ['מ', 'م'], ['נ', 'ن'], ['ס', 'س'], ['ע', 'ع'], ['פ', 'ف'], ['צ', 'ص'],
  ['ק', 'ق'], ['ר', 'ر'], ['ש', 'ش'], ['ת', 'ت'],
];

const HE_GRADIENT = 'linear-gradient(145deg, #132E4C, #1E4870)';
const AR_GRADIENT = 'linear-gradient(145deg, #16A499, #0D6470)';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeRound() {
  const chosen = shuffle(LETTER_PAIRS).slice(0, PAIRS_PER_ROUND);
  const pairs = chosen.map((p, i) => ({ id: i + 1, he: p[0], ar: p[1] }));
  const ids = pairs.map(p => p.id);
  let heOrder = shuffle(ids);
  let arOrder = shuffle(ids);
  // Make sure the two orders aren't identical (so it's not purely positional)
  let guard = 0;
  while (arOrder.join() === heOrder.join() && guard++ < 10) arOrder = shuffle(ids);
  return { pairs, heOrder, arOrder };
}

function speakLetter(letter, lang) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(letter);
    u.lang = lang === 'he' ? 'he-IL' : 'ar-SA';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export default function LetterMatchGame() {
  const { t } = useLang();
  const [pairs, setPairs] = useState([]);
  const [heOrder, setHeOrder] = useState([]);
  const [arOrder, setArOrder] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [selected, setSelected] = useState(null); // { id, side }
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState(null); // { a: key, b: key }
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  const newGame = useCallback(() => {
    const r = makeRound();
    setPairs(r.pairs);
    setHeOrder(r.heOrder);
    setArOrder(r.arOrder);
    setMatched(new Set());
    setSelected(null);
    setMistakes(0);
    setWrong(null);
    setWon(false);
    setLost(false);
  }, []);

  useEffect(() => { newGame(); }, [newGame]);

  useEffect(() => {
    if (won) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#132E4C', '#1E4870', '#16A499', '#FA7C27'] });
    }
  }, [won]);

  const pairById = useMemo(() => {
    const m = {};
    pairs.forEach(p => { m[p.id] = p; });
    return m;
  }, [pairs]);

  const totalPairs = pairs.length;
  const matchedCount = matched.size;

  const handleTap = (id, side) => {
    if (showTutorial || won || lost) return;
    const pair = pairById[id];
    if (!pair) return;
    const letter = side === 'he' ? pair.he : pair.ar;
    speakLetter(letter, side === 'he' ? 'he' : 'ar');

    if (!selected) {
      setSelected({ id, side });
      return;
    }
    if (selected.id === id && selected.side === side) {
      setSelected(null);
      return;
    }
    if (selected.side === side) {
      setSelected({ id, side });
      return;
    }
    // Opposite side → evaluate
    if (selected.id === id) {
      // Correct match
      const next = new Set(matched);
      next.add(id);
      setMatched(next);
      setSelected(null);
      confetti({ particleCount: 24, spread: 50, startVelocity: 28, origin: { y: 0.5 }, colors: ['#16A499', '#1E4870'], scalar: 0.7 });
      if (next.size === totalPairs) setTimeout(() => setWon(true), 350);
    } else {
      // Wrong
      setWrong({ a: `${selected.side}-${selected.id}`, b: `${side}-${id}` });
      setSelected(null);
      const next = mistakes + 1;
      setMistakes(next);
      setTimeout(() => setWrong(null), 600);
      if (next >= MAX_MISTAKES) setTimeout(() => setLost(true), 650);
    }
  };

  const renderTile = (id, side) => {
    const pair = pairById[id];
    if (!pair || matched.has(id)) return null;
    const key = `${side}-${id}`;
    const isSelected = selected && selected.id === id && selected.side === side;
    const isWrong = wrong && (wrong.a === key || wrong.b === key);
    const letter = side === 'he' ? pair.he : pair.ar;

    return (
      <motion.button
        key={key}
        layout
        initial={{ scale: 0, opacity: 0 }}
        animate={isWrong
          ? { scale: 1, opacity: 1, x: [0, -6, 6, -4, 4, 0] }
          : { scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0.4, opacity: 0, rotate: -20, transition: { duration: 0.25 } }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => handleTap(id, side)}
        className="relative flex items-center justify-center rounded-2xl select-none touch-manipulation"
        style={{
          width: 60,
          height: 60,
          background: isWrong
            ? 'linear-gradient(145deg, #EF4444, #B91C1C)'
            : (side === 'he' ? HE_GRADIENT : AR_GRADIENT),
          boxShadow: isSelected
            ? '0 0 0 4px #fff, 0 8px 22px rgba(0,0,0,0.28)'
            : '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)',
        }}
      >
        <span className="text-white font-bold leading-none" style={{ fontSize: 30 }}>{letter}</span>
        {isSelected && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-pulse" />
        )}
      </motion.button>
    );
  };

  const visibleHe = heOrder.filter(id => !matched.has(id));
  const visibleAr = arOrder.filter(id => !matched.has(id));

  return (
    <div className="flex flex-col h-full" style={{ background: '#F5F0E8' }}>
      {/* Progress + lives bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b" style={{ borderColor: '#E8E0D2' }}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex-1 max-w-[160px] h-2.5 rounded-full overflow-hidden" style={{ background: '#EEE7DA' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #132E4C, #1E4870)' }}
              animate={{ width: `${totalPairs ? (matchedCount / totalPairs) * 100 : 0}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
          </div>
          <span className="text-xs font-bold text-gray-400 flex-shrink-0">{matchedCount}/{totalPairs || PAIRS_PER_ROUND}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
              <span key={i} className="text-base leading-none">{i < MAX_MISTAKES - mistakes ? '❤️' : '🖤'}</span>
            ))}
          </div>
          <button onClick={newGame} className="text-gray-400 hover:text-gray-600 active:scale-90 transition-transform" aria-label="restart">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5 py-4">
        {/* Hebrew row */}
        <div className="w-full max-w-sm flex flex-col items-center gap-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wide">עברית · Hebrew</span>
          <div className="flex flex-wrap justify-center gap-2.5">
            <AnimatePresence>
              {visibleHe.map(id => renderTile(id, 'he'))}
            </AnimatePresence>
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-px h-5" style={{ background: '#D6CDB8' }} />
          <span className="text-[10px] font-bold text-gray-400 px-2.5 py-0.5 rounded-full" style={{ background: '#EEE7DA' }}>MATCH</span>
          <div className="w-px h-5" style={{ background: '#D6CDB8' }} />
        </div>

        {/* Arabic row */}
        <div className="w-full max-w-sm flex flex-col items-center gap-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wide">العربية · Arabic</span>
          <div className="flex flex-wrap justify-center gap-2.5">
            <AnimatePresence>
              {visibleAr.map(id => renderTile(id, 'ar'))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
          <Volume2 className="w-3 h-3" />
          <span>{t.tapToHear || 'Tap a letter to hear it & match its pair'}</span>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showTutorial && (
          <Overlay>
            <ModalCard>
              <div className="text-5xl mb-3">🧩</div>
              <p className="text-xl font-bold mb-2" style={{ color: '#132E4C' }}>{t.howToPlay || 'How to play'}</p>
              <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                {t.howToPlayDesc || 'Tap a Hebrew letter, then tap its matching Arabic letter to connect them. Clear the board before you run out of hearts ❤️.'}
              </p>
              <PrimaryBtn onClick={() => setShowTutorial(false)}>{t.gotIt || 'Got it'}</PrimaryBtn>
            </ModalCard>
          </Overlay>
        )}
        {won && (
          <Overlay>
            <ModalCard>
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-2xl font-bold mb-2" style={{ color: '#132E4C' }}>{t.youDidIt || 'You did it!'}</p>
              <p className="text-sm text-gray-500 text-center mb-6">{t.allMatched || 'All letters matched!'}</p>
              <PrimaryBtn onClick={newGame}>{t.playAgain || 'Play again'}</PrimaryBtn>
            </ModalCard>
          </Overlay>
        )}
        {lost && (
          <Overlay>
            <ModalCard>
              <div className="text-5xl mb-3">💔</div>
              <p className="text-2xl font-bold mb-2" style={{ color: '#132E4C' }}>{t.youLost || 'Out of hearts'}</p>
              <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                {t.lostDesc || 'You ran out of hearts. Want to give it another try?'}
              </p>
              <PrimaryBtn onClick={newGame}>{t.playAgain || 'Play again'}</PrimaryBtn>
            </ModalCard>
          </Overlay>
        )}
      </AnimatePresence>
    </div>
  );
}

function Overlay({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      {children}
    </motion.div>
  );
}

function ModalCard({ children }) {
  return (
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-3xl px-7 py-9 flex flex-col items-center shadow-2xl w-full max-w-xs"
    >
      {children}
    </motion.div>
  );
}

function PrimaryBtn({ children, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-10 py-3.5 rounded-xl text-white font-semibold text-base shadow-md"
      style={{ background: 'linear-gradient(135deg, #132E4C, #1E4870)' }}
    >
      {children}
    </motion.button>
  );
}