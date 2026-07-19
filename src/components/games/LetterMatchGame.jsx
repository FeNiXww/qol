import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/lib/theme';
import { useLang } from '@/contexts/LanguageContext';

const MAX_MISTAKES = 3;
const LETTER_SIZE = 52;

const hebrewLetters = { 1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ו', 6: 'ז', 7: 'מ', 8: 'נ', 9: 'פ', 10: 'ש' };
const arabicLetters = { 1: 'ا', 2: 'ب', 3: 'ج', 4: 'د', 5: 'و', 6: 'ز', 7: 'م', 8: 'ن', 9: 'ف', 10: 'ش' };

function generateLetters(width, height) {
  const result = [];
  const placed = [];
  const MIN_DIST = 74;
  const PAD = 12;
  const w = Math.max(width, LETTER_SIZE + PAD * 2 + 1);
  const h = Math.max(height, LETTER_SIZE + PAD * 2 + 1);
  for (let i = 1; i <= 10; i++) {
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
        letter: lang === 'hebrew' ? hebrewLetters[i] : arabicLetters[i],
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
    letterEls.current = {};
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

  return (
    <div className="flex flex-col h-full" style={{ background: '#F5F0E8' }}>
      {/* Lives bar */}
      <div className="flex items-center justify-end px-5 py-2.5 bg-white border-b" style={{ borderColor: '#E8E0D2' }}>
        <div className="flex gap-1">
          {lives.map((_, i) => (
            <span key={i} className="text-lg leading-none">{i < MAX_MISTAKES - mistakes ? '❤️' : '🖤'}</span>
          ))}
        </div>
      </div>

      {/* Board */}
      <div ref={boardRef} className="relative flex-1 overflow-hidden touch-none" style={{ background: '#F5F0E8' }}>
        {letters.map(l => {
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
              whileTap={{ scale: 1.08 }}
              whileDrag={{ zIndex: 50, scale: 1.12 }}
              ref={(el) => { if (el) letterEls.current[key] = el; else delete letterEls.current[key]; }}
              className="absolute flex items-center justify-center rounded-xl shadow-md cursor-grab active:cursor-grabbing select-none"
              style={{
                left: l.x,
                top: l.y,
                width: LETTER_SIZE,
                height: LETTER_SIZE,
                background: isHebrew ? theme.colors.teal : theme.colors.orange,
              }}
            >
              <span className="text-white font-semibold leading-none" style={{ fontSize: 26 }}>{l.letter}</span>
            </motion.div>
          );
        })}
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