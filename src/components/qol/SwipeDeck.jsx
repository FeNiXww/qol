import React, { useState, useEffect, useRef } from 'react';
import SwipeCard from './SwipeCard';
import { Heart, X, RefreshCw } from 'lucide-react';
import { theme } from '@/lib/theme';
import { motion } from 'framer-motion';
import { useLang } from '@/contexts/LanguageContext';

export default function SwipeDeck({ profiles, onSwipe, onLoadMore, loading, empty }) {
  const { t } = useLang();
  const [stack, setStack] = useState([]);
  const topCardRef = useRef(null);
  const swipedIdsRef = useRef(new Set());

  useEffect(() => {
    setStack(prev => {
      const prevIds = new Set(prev.map(p => p.id));
      const newOnes = profiles.filter(p => !prevIds.has(p.id) && !swipedIdsRef.current.has(p.id));
      if (newOnes.length === 0) return prev;
      return [...newOnes, ...prev];
    });
  }, [profiles]);

  const handleSwipeDone = (profile, direction) => {
    swipedIdsRef.current.add(profile.id);
    setStack(prev => {
      const next = prev.filter(p => p.id !== profile.id);
      if (next.length <= 3) onLoadMore?.();
      return next;
    });
    onSwipe?.(profile, direction);
  };

  const handleButton = async (dir) => {
    if (!topCardRef.current) return;
    topCardRef.current.triggerSwipe(dir);
  };

  if (loading && stack.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">{t.findingConnections}</p>
        </div>
      </div>
    );
  }

  if (empty || stack.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="text-center max-w-xs mx-auto">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(22,164,153,0.12), rgba(250,124,39,0.12))' }}>
              <span className="text-6xl">🌍</span>
            </div>
            <div className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-xl">🇮🇱</div>
            <div className="absolute -bottom-1 -left-1 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-xl">🇵🇸</div>
          </div>
          <h3 className="text-2xl font-black text-gray-800 mb-3">{t.youMetEveryone}</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">{t.comeBackSoon}</p>
          <button
            onClick={() => onLoadMore?.()}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm shadow-lg active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #16A499, #FA7C27)' }}
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4">
      <div className="relative w-full max-w-sm" style={{ height: 520 }}>
        {stack.slice(-3).map((profile, idx, arr) => {
          const isTop = idx === arr.length - 1;
          const offsetY = (arr.length - 1 - idx) * 12;
          const scale = 1 - (arr.length - 1 - idx) * 0.04;
          return (
            <SwipeCard
              key={profile.id}
              ref={isTop ? topCardRef : null}
              profile={profile}
              onSwipe={(dir) => handleSwipeDone(profile, dir)}
              isTop={isTop}
              style={{ transform: `translateY(${offsetY}px) scale(${scale})`, zIndex: idx + 1 }}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-8 mt-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleButton('pass')} className="flex flex-col items-center gap-1.5">
          <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-red-100 hover:border-red-300 transition-colors">
            <X className="w-7 h-7 text-red-400" />
          </div>
          <span className="text-xs font-semibold text-red-400">{t.pass}</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleButton('like')} className="flex flex-col items-center gap-1.5">
          <div className="w-20 h-20 rounded-full shadow-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}>
            <Heart className="w-9 h-9 text-white fill-white" />
          </div>
          <span className="text-xs font-semibold" style={{ color: theme.colors.teal }}>{t.like}</span>
        </motion.button>
      </div>
    </div>
  );
}