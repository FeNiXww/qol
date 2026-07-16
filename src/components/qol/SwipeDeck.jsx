import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeCard from './SwipeCard';
import { Heart, X, RefreshCw } from 'lucide-react';
import { theme } from '@/lib/theme';

export default function SwipeDeck({ profiles, onSwipe, onLoadMore, loading, empty }) {
  const [stack, setStack] = useState([]);

  useEffect(() => {
    setStack(profiles);
  }, [profiles]);

  const handleSwipe = (direction) => {
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    setStack(prev => {
      const next = prev.slice(0, -1);
      if (next.length <= 3) onLoadMore?.();
      return next;
    });
    onSwipe?.(top, direction);
  };

  const handleButton = async (dir) => {
    handleSwipe(dir);
  };

  if (loading && stack.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Finding connections…</p>
        </div>
      </div>
    );
  }

  if (empty || stack.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">You've seen everyone!</h3>
          <p className="text-gray-400 text-sm">Check back later to discover more connections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4">
      {/* Deck */}
      <div className="relative w-full max-w-sm" style={{ height: 560 }}>
        {stack.slice(-3).map((profile, idx, arr) => {
          const isTop = idx === arr.length - 1;
          const offsetY = (arr.length - 1 - idx) * 12;
          const scale = 1 - (arr.length - 1 - idx) * 0.04;
          return (
            <SwipeCard
              key={profile.id}
              profile={profile}
              onSwipe={handleSwipe}
              isTop={isTop}
              style={{
                transform: `translateY(${offsetY}px) scale(${scale})`,
                zIndex: idx + 1,
              }}
            />
          );
        })}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-8 mt-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleButton('pass')}
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-red-100 hover:border-red-300 transition-colors"
        >
          <X className="w-8 h-8 text-red-400" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleButton('like')}
          className="w-20 h-20 rounded-full shadow-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
        >
          <Heart className="w-9 h-9 text-white fill-white" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleButton('pass')}
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-gray-100 hover:border-gray-300 transition-colors"
        >
          <X className="w-7 h-7 text-gray-300" />
        </motion.button>
      </div>
    </div>
  );
}