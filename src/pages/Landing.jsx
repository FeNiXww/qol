import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/lib/theme';

const slides = [
  {
    emoji: '🌍',
    bg: `linear-gradient(160deg, #0d0e2b 0%, #17998A 100%)`,
    title: 'Two peoples.\nOne world.',
    body: 'Israelis and Palestinians have lived side by side for generations — yet most have never had a real conversation. QOL changes that.',
    accent: theme.colors.teal,
  },
  {
    emoji: '🤝',
    bg: `linear-gradient(160deg, #0d0e2b 0%, #1a3a5c 100%)`,
    title: 'Connect across\nthe divide.',
    body: 'Discover real people on the other side. Swipe, match, and start a conversation — automatically translated so language is never a barrier.',
    accent: theme.colors.orange,
  },
  {
    emoji: '💬',
    bg: `linear-gradient(160deg, #1a0a2e 0%, #17998A 80%)`,
    title: 'Every message\nis a bridge.',
    body: 'Peace doesn\'t start in parliaments. It starts with a simple "hello" between two curious human beings.',
    accent: '#a78bfa',
  },
  {
    emoji: '🛡️',
    bg: `linear-gradient(160deg, #0d0e2b 0%, #1e3a5f 100%)`,
    title: 'Safe.\nRespectful.\nReal.',
    body: 'QOL is built with strict safety features for minors and adults alike. A community rooted in dignity and mutual respect.',
    accent: theme.colors.teal,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const isLast = current === slides.length - 1;

  const next = () => {
    if (isLast) navigate('/sign-up');
    else setCurrent(c => c + 1);
  };

  const slide = slides[current];

  return (
    <div
      className="flex flex-col max-w-md mx-auto relative overflow-hidden"
      style={{ height: '100dvh', background: slide.bg, transition: 'background 0.7s ease' }}
    >
      {/* Skip */}
      <div className="flex justify-end px-6 pt-12 flex-shrink-0">
        <button
          onClick={() => navigate('/sign-up')}
          className="text-white/40 text-sm font-medium hover:text-white/70 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="flex flex-col items-center"
          >
            {/* Emoji */}
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 text-5xl shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {slide.emoji}
            </div>

            {/* Title */}
            <h1
              className="text-4xl font-black text-white mb-5 leading-tight whitespace-pre-line"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
            >
              {slide.title}
            </h1>

            {/* Body */}
            <p className="text-white/70 text-base leading-relaxed max-w-xs">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-12 flex-shrink-0 flex flex-col items-center gap-6">
        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}>
              <motion.div
                animate={{ width: i === current ? 24 : 8, opacity: i === current ? 1 : 0.35 }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
                style={{ backgroundColor: 'white' }}
              />
            </button>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-xl transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
        >
          {isLast ? 'Join the Movement 🌿' : 'Next'}
        </button>

        {/* Sign in link */}
        <p className="text-white/40 text-sm">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/sign-in')}
            className="text-white/70 font-semibold underline underline-offset-2 hover:text-white transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}