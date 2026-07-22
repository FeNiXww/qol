import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/lib/theme';
import { useLang } from '@/contexts/LanguageContext';

const slideBgs = [
`linear-gradient(160deg, #0d0e2b 0%, #17998A 100%)`,
`linear-gradient(160deg, #0d0e2b 0%, #1a3a5c 100%)`,
`linear-gradient(160deg, #1a0a2e 0%, #17998A 80%)`,
`linear-gradient(160deg, #0d0e2b 0%, #1e3a5f 100%)`];

const slideEmojis = ['🌍', '🤝', '💬', '🛡️'];
const slideAccents = [theme.colors.teal, theme.colors.orange, '#a78bfa', theme.colors.teal];

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [current, setCurrent] = useState(0);
  const isLast = current === t.slides.length - 1;

  const next = () => {
    if (isLast) navigate('/sign-up');else
    setCurrent((c) => c + 1);
  };

  const slide = t.slides[current];

  return (
    <div
      className="flex flex-col max-w-md mx-auto relative overflow-hidden"
      style={{ height: '100dvh', background: slideBgs[current], transition: 'background 0.7s ease' }}
      dir={t.dir}>
      
      {/* Skip */}
      <div className="flex justify-end px-6 pt-12 flex-shrink-0">
        <button
          onClick={() => navigate('/sign-up')}
          className="text-white/40 font-medium hover:text-white/70 transition-colors text-2xl">
          
          {t.skip}
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
            className="flex flex-col items-center">
            
            {current === 0 ?
            <img src="https://media.base44.com/images/public/6a5874b8ce4d2dc8cf35eb52/a5dc31826_Untitleddesign.png"

            alt="QOL"
            className="w-28 h-28 object-contain mb-8 drop-shadow-2xl"
            style={{ mixBlendMode: 'multiply' }} /> :


            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 text-5xl shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              
                {slideEmojis[current]}
              </div>
            }

            <h1
              className="text-4xl font-black text-white mb-5 leading-tight whitespace-pre-line"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              
              {slide.title}
            </h1>

            <p className="text-white/70 text-base leading-relaxed max-w-xs">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-12 flex-shrink-0 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {t.slides.map((_, i) =>
          <button key={i} onClick={() => setCurrent(i)}>
              <motion.div
              animate={{ width: i === current ? 24 : 8, opacity: i === current ? 1 : 0.35 }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full hidden"
              style={{ backgroundColor: 'white' }} />
            
            </button>
          )}
        </div>

        <button
          onClick={next}
          className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-xl transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg, #132E4C, #1E4870)` }}>
          
          {isLast ? t.joinMovement : t.next}
        </button>

        <p className="text-white/40 text-sm">
          {t.alreadyHaveAccount}{' '}
          <button
            onClick={() => navigate('/sign-in')}
            className="text-white/70 font-semibold underline underline-offset-2 hover:text-white transition-colors">
            
            {t.signIn}
          </button>
        </p>
      </div>
    </div>);

}