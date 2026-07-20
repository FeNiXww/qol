import React from 'react';
import { motion } from 'framer-motion';
import { theme } from '@/lib/theme';

export default function MemoryCard({ card, flipped, matched, onClick, disabled }) {
  const isUp = flipped || matched;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative w-full aspect-square disabled:opacity-100"
      style={{ perspective: 600 }}
    >
      <motion.div
        animate={{ rotateY: isUp ? 180 : 0 }}
        transition={{ duration: 0.32 }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Back (facedown) */}
        <div
          className="absolute inset-0 rounded-xl flex items-center justify-center shadow-md"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: `linear-gradient(135deg, ${theme.colors.navy}, ${theme.colors.navyLight})`,
          }}
        >
          <span className="text-white text-xl font-black opacity-30">?</span>
        </div>
        {/* Front (face up) */}
        <div
          className="absolute inset-0 rounded-xl flex flex-col items-center justify-center shadow-md bg-white"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            border: matched ? `2px solid ${theme.colors.teal}` : '2px solid #E8E8E8',
          }}
        >
          <span className="text-2xl sm:text-3xl leading-none">{card.emoji}</span>
          <span className="absolute bottom-1 left-1.5 text-[10px] font-semibold text-gray-600">{card.he}</span>
          <span className="absolute bottom-1 right-1.5 text-[10px] font-semibold text-gray-600">{card.ar}</span>
        </div>
      </motion.div>
    </button>
  );
}