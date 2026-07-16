import React, { forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { theme } from '@/lib/theme';

const HOBBY_EMOJIS = {
  Music: '🎵', Art: '🎨', Cooking: '🍳', Reading: '📚', Football: '⚽', Basketball: '🏀',
  Tennis: '🎾', Swimming: '🏊', Hiking: '🥾', Photography: '📸', Gaming: '🎮', Dancing: '💃',
  Travel: '✈️', Yoga: '🧘', Fitness: '💪', Cinema: '🎬', Theatre: '🎭', Poetry: '✍️',
  Chess: '♟️', Cycling: '🚴', Painting: '🖌️', Volunteering: '🤝', Languages: '🗣️',
  History: '🏛️', Technology: '💻',
};

const SwipeCard = forwardRef(function SwipeCard({ profile, onSwipe, isTop, style }, ref) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const passOpacity = useTransform(x, [-80, 0], [1, 0]);
  const controls = useAnimation();

  const SWIPE_THRESHOLD = 100;

  useImperativeHandle(ref, () => ({
    triggerSwipe: async (dir) => {
      await controls.start({
        x: dir === 'like' ? 600 : -600,
        opacity: 0,
        rotate: dir === 'like' ? 20 : -20,
        transition: { duration: 0.28 },
      });
      onSwipe(dir);
    },
  }));

  const handleDragEnd = async (_, info) => {
    const offset = info.offset.x;
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      const dir = offset > 0 ? 'like' : 'pass';
      await controls.start({ x: offset > 0 ? 600 : -600, opacity: 0, transition: { duration: 0.25 } });
      onSwipe(dir);
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const name = profile.display_name || (profile.nationality === 'israeli' ? 'Israeli' : 'Palestinian');
  const age = profile.birthdate
    ? Math.floor((new Date() - new Date(profile.birthdate)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const flag = profile.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const hobbies = (profile.hobbies || []).slice(0, 8);

  return (
    <motion.div
      style={{ x, rotate, ...style, position: 'absolute', width: '100%' }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={isTop ? handleDragEnd : undefined}
      animate={controls}
      whileDrag={{ scale: 1.02 }}
      className="select-none"
    >
      {/* Like/Pass indicators */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-6 left-6 z-10 border-4 border-green-400 rounded-xl px-3 py-1 rotate-[-20deg]"
          >
            <span className="text-green-400 font-black text-2xl">LIKE</span>
          </motion.div>
          <motion.div
            style={{ opacity: passOpacity }}
            className="absolute top-6 right-6 z-10 border-4 border-red-400 rounded-xl px-3 py-1 rotate-[20deg]"
          >
            <span className="text-red-400 font-black text-2xl">PASS</span>
          </motion.div>
        </>
      )}

      {/* Card */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col" style={{ height: 500 }}>

        {/* Top: avatar + identity */}
        <div
          className="flex items-center gap-4 px-5 py-4"
          style={{ background: `linear-gradient(135deg, ${theme.colors.navy} 0%, #1a2a5e 100%)` }}
        >
          {/* Avatar — small */}
          <div className="flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white border-2 border-white/20"
                style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
              >
                {name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-xl leading-tight truncate">
              {name}{age ? `, ${age}` : ''}
            </h2>
            <p className="text-white/60 text-sm mt-0.5">{flag} {profile.nationality === 'israeli' ? 'Israeli' : 'Palestinian'}</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio ? (
          <div className="px-5 pt-4 pb-2">
            <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">"{profile.bio}"</p>
          </div>
        ) : (
          <div className="pt-4" />
        )}

        {/* Interests — main focus */}
        <div className="flex-1 px-5 pb-5 flex flex-col justify-center">
          {hobbies.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Interests</p>
              <div className="flex flex-wrap gap-2">
                {hobbies.map(h => (
                  <span
                    key={h}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold border"
                    style={{
                      backgroundColor: `${theme.colors.teal}12`,
                      borderColor: `${theme.colors.teal}30`,
                      color: theme.colors.navy,
                    }}
                  >
                    <span className="text-base">{HOBBY_EMOJIS[h] || '✨'}</span>
                    {h}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">🌱</p>
              <p className="text-gray-400 text-sm">Still exploring interests</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default SwipeCard;