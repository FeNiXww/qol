import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Loader2, Mic } from 'lucide-react';
import { useDictT } from '@/lib/dictionaryI18n';
import generateTTS from '@/utils/tts';

export default function DictionaryCard({ word, front, back, frontTranslit, frontLang = 'he', backLang = 'he', onSwipe }) {
  const dt = useDictT();
  const [flipped, setFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const knowOpacity = useTransform(x, [0, 80], [0, 1]);
  const dontOpacity = useTransform(x, [-80, 0], [1, 0]);
  const controls = useAnimation();

  const handleDragEnd = async (_, info) => {
    const offset = info.offset.x;
    if (Math.abs(offset) > 100) {
      const dir = offset > 0 ? 'know' : 'dont';
      await controls.start({ x: offset > 0 ? 600 : -600, opacity: 0, transition: { duration: 0.25 } });
      onSwipe(dir);
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const handleSpeak = async (e) => {
    e?.stopPropagation();
    if (speaking) return;
    setSpeaking(true);
    try {
      const textToSpeak = flipped ? back : front;
      const lang = flipped ? backLang : frontLang;
      await generateTTS(textToSpeak, lang);
    } catch (err) {
      console.error("TTS failed:", err);
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <motion.div
      key={word.id}
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileDrag={{ scale: 1.03, cursor: 'grabbing' }}
      onTap={() => setFlipped(f => !f)}
      className="relative select-none w-full"
    >
      {/* Know / Don't know indicators */}
      <motion.div
        style={{ opacity: knowOpacity }}
        className="absolute top-5 left-5 z-20 border-[3px] border-emerald-400 rounded-2xl px-3 py-1 rotate-[-14deg] bg-white/60"
      >
        <span className="text-emerald-500 font-black text-sm">✓ {dt.knowIt}</span>
      </motion.div>
      <motion.div
        style={{ opacity: dontOpacity }}
        className="absolute top-5 right-5 z-20 border-[3px] border-rose-400 rounded-2xl px-3 py-1 rotate-[14deg] bg-white/60"
      >
        <span className="text-rose-500 font-black text-sm">✗ {dt.dontKnowIt}</span>
      </motion.div>

      <div
        className="w-full flex flex-col items-center justify-center px-6 text-center relative"
        style={{
          height: 340,
          borderRadius: 28,
          background: flipped
            ? 'linear-gradient(160deg, #FA7C27 0%, #E8651A 100%)'
            : 'linear-gradient(160deg, #16A499 0%, #0D6470 100%)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
        }}
      >
        {/* listen button — top right corner of card, unobtrusive */}
        <button
          onClick={handleSpeak}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={speaking}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-50 active:scale-90"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
        >
          {speaking
            ? <Loader2 className="w-4 h-4 animate-spin text-white" />
            : <Mic className="w-4 h-4 text-white" />
          }
        </button>

        <p className="text-white font-black text-4xl leading-tight" dir="auto">
          {flipped ? back : front}
        </p>
        {!flipped && frontTranslit && (
          <p className="text-white/70 text-base font-medium mt-3" dir="auto">🗣 {frontTranslit}</p>
        )}
        <p className="text-white/60 text-xs font-semibold mt-6">
          {flipped ? '🔄' : `👆 ${dt.tapToFlip}`}
        </p>
      </div>
    </motion.div>
  );
}