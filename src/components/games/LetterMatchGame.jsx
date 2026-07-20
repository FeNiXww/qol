import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/lib/theme';
import { useLang } from '@/contexts/LanguageContext';

const MAX_MISTAKES = 3;
const LETTER_SIZE = 52;

const PAIRS_PER_ROUND = 10;

// Full Hebrew ↔ Arabic cognate letter pairs — each round picks a random subset
const LETTER_PAIRS = [
  ['א', 'ا'], ['ב', 'ب'], ['ג', 'ج'], ['ד', 'د'], ['ה', 'ه'], ['ו', 'و'],
  ['ז', 'ز'], ['ח', 'ح'], ['ט', 'ط'], ['י', 'ي'], ['כ', 'ك'], ['ל', 'ل'],
  ['מ', 'م'], ['נ', 'ن'], ['ס', 'س'], ['ע', 'ع'], ['פ', 'ف'], ['צ', 'ص'],
  ['ק', 'ق'], ['ר', 'ر'], ['ש', 'ش'], ['ת', 'ت'],
];

function pickRandomPairs() {
  const shuffled = [...LETTER_PAIRS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, PAIRS_PER_ROUND);
}

function generateLetters(width, height) {
  const pairs = pickRandomPairs();
  const result = [];
  const placed = [];
  const MIN_DIST = 74;
  const PAD = 12;
  const w = Math.max(width, LETTER_SIZE + PAD * 2 + 1);
  const h = Math.max(height, LETTER_SIZE + PAD * 2 + 1);
  for (let i = 1; i <= pairs.length; i++) {
    const [heLetter, arLetter] = pairs[i - 1];
    for (const lang of ['hebrew', 'arabic']) {
      let x = 0, y = 0, attempts = 0, overlaps = true;
      while (overlaps && attempts < 100) {
        x = PAD + Math.random() * (w - LETTER_SIZE - PAD * 2);
        y = PAD + Math.random() * (h - LETTER_SIZE - PAD * 2);
        overlaps = placed.some(p => Math.abs(p.x - x) < MIN_DIST && Math.abs(p.y - y) < MIN_DIST);
        attempts++;
      }
      placed.push({ x, y });
      result.push({
        id: i,
        language: lang,
        letter: lang === 'hebrew' ? heLetter : arLetter,
        x, y,
      });
    }
  }
  return result;
}

function rectsOverlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

export default function LetterMatchGame() {
  const { t } = useLang();
  const [letters, setLetters] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [mistakeTick, setMistakeTick] = useState(0);
  const boardRef = useRef(null);
  const letterEls = useRef({});
  const generatedRef = useRef(false);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      if (!boardRef.current) return;
      const r = boardRef.current.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (boardRef.current) ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  const newGame = useCallback((w, h) => {
    setWon(false);
    setLost(false);
    setMistakes(0);
    // Don't clear letterEls: React reuses DOM nodes by key across resets, so
    // ref callbacks won't re-fire for them. The callbacks add/delete entries
    // on mount/unmount, keeping the map correct without a manual wipe.
    setLetters(generateLetters(w, h));
  }, []);

  useEffect(() => {
    if (!generatedRef.current && dims.w > 0 && dims.h > 0) {
      generatedRef.current = true;
      newGame(dims.w, dims.h);
    }
  }, [dims, newGame]);

  const speak = (letter, language) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(letter);
      u.lang = language === 'hebrew' ? 'he-IL' : 'ar-SA';
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  };

  const handleCorrect = (id) => {
    setLetters(prev => {
      const next = prev.filter(l => l.id !== id);
      if (next.length === 0) setTimeout(() => setWon(true), 250);
      return next;
    });
  };

  const handleMistake = () => {
    setMistakeTick(t => t + 1);
    setMistakes(prev => {
      const next = prev + 1;
      if (next >= MAX_MISTAKES) setTimeout(() => setLost(true), 250);
      return next;
    });
  };

  const onDragEnd = (key) => {
    const el = letterEls.current[key];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const [releasedLang, idStr] = key.split('-');
    const releasedId = Number(idStr);
    for (const [otherKey, otherEl] of Object.entries(letterEls.current)) {
      if (otherKey === key) continue;
      const [otherLang, otherIdStr] = otherKey.split('-');
      if (otherLang === releasedLang) continue;
      const otherRect = otherEl.getBoundingClientRect();
      if (rectsOverlap(rect, otherRect)) {
        if (Number(otherIdStr) === releasedId) handleCorrect(releasedId);
        else handleMistake();
        return;
      }
    }
  };

  const lives = Array.from({ length: MAX_MISTAKES });
  const matchedPairs = PAIRS_PER_ROUND - letters.length / 2;

  return (
    <div className="flex flex-col h-full" style={{ background: '#F5F0E8' }}>
      {/* Progress + lives bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b" style={{ borderColor: '#E8E0D2' }}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex-1 max-w-[140px] h-2 rounded-full overflow-hidden" style={{ background: '#EEE7DA' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
              animate={{ width: `${(matchedPairs / PAIRS_PER_ROUND) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
          </div>
          <span className="text-xs font-bold text-gray-400 flex-shrink-0">{matchedPairs}/{PAIRS_PER_ROUND}</span>
        </div>
        <motion.div
          key={mistakeTick}
          animate={mistakeTick > 0 ? { x: [0, -6, 6, -4, 4, 0] } : false}
          transition={{ duration: 0.4 }}
          className="flex gap-1"
        >
          {lives.map((_, i) => (
            <span key={i} className="text-lg leading-none">{i < MAX_MISTAKES - mistakes ? '❤️' : '🖤'}</span>
          ))}
        </motion.div>
      </div>

      {/* Board */}
      <div ref={boardRef} className="relative flex-1 overflow-hidden touch-none" style={{ background: '#F5F0E8' }}>
        <AnimatePresence>
          {letters.map((l, idx) => {
            const key = `${l.language}-${l.id}`;
            const isHebrew = l.language === 'hebrew';
            return (
              <motion.div
                key={key}
                drag
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={() => onDragEnd(key)}
                onTap={() => speak(l.letter, l.language)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0, rotate: 90, transition: { duration: 0.3 } }}
                transition={{ type: 'spring', stiffness: 320, damping: 22, delay: idx * 0.02 }}
                whileTap={{ scale: 1.08 }}
                whileDrag={{ zIndex: 50, scale: 1.15, boxShadow: '0 12px 28px rgba(0,0,0,0.25)' }}
                ref={(el) => { if (el) letterEls.current[key] = el; else delete letterEls.current[key]; }}
                className="absolute flex items-center justify-center rounded-2xl cursor-grab active:cursor-grabbing select-none"
                style={{
                  left: l.x,
                  top: l.y,
                  width: LETTER_SIZE,
                  height: LETTER_SIZE,
                  background: isHebrew
                    ? `linear-gradient(145deg, ${theme.colors.teal}, #0D6470)`
                    : `linear-gradient(145deg, ${theme.colors.orange}, #D95F10)`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
              >
                <span className="text-white font-bold leading-none drop-shadow-sm" style={{ fontSize: 26 }}>{l.letter}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showTutorial && (
          <Overlay>
            <ModalCard>
              <div className="text-5xl mb-3">🧩</div>
              <p className="text-xl font-bold mb-2" style={{ color: theme.colors.navy }}>{t.howToPlay}</p>
              <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">{t.howToPlayDesc}</p>
              <PrimaryBtn onClick={() => setShowTutorial(false)} color={theme.colors.teal}>{t.gotIt}</PrimaryBtn>
            </ModalCard>
          </Overlay>
        )}
        {won && (
          <Overlay>
            <ModalCard>
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-2xl font-bold mb-2" style={{ color: theme.colors.navy }}>{t.youDidIt}</p>
              <p className="text-sm text-gray-500 text-center mb-6">{t.allMatched}</p>
              <PrimaryBtn onClick={() => newGame(dims.w, dims.h)} color={theme.colors.teal}>{t.playAgain}</PrimaryBtn>
            </ModalCard>
          </Overlay>
        )}
        {lost && (
          <Overlay>
            <ModalCard>
              <div className="text-5xl mb-3">💔</div>
              <p className="text-2xl font-bold mb-2" style={{ color: theme.colors.navy }}>{t.youLost}</p>
              <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">{t.lostDesc}</p>
              <PrimaryBtn onClick={() => newGame(dims.w, dims.h)} color={theme.colors.orange}>{t.playAgain}</PrimaryBtn>
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

function PrimaryBtn({ children, onClick, color }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-10 py-3.5 rounded-xl text-white font-semibold text-base shadow-md"
      style={{ background: color }}
    >
      {children}
    </motion.button>
  );
}