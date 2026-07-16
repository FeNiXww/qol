import React, { forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { theme } from '@/lib/theme';

const SwipeCard = forwardRef(function SwipeCard({ profile, onSwipe, isTop, style }, ref) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const passOpacity = useTransform(x, [-80, 0], [1, 0]);
  const controls = useAnimation();

  const SWIPE_THRESHOLD = 100;

  // Expose triggerSwipe so SwipeDeck buttons can animate before removing
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
  const nationality = profile.nationality === 'israeli' ? '🇮🇱 Israeli' : '🇵🇸 Palestinian';
  const hobbies = (profile.hobbies || []).slice(0, 4);

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
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl h-[500px] flex flex-col">
        {/* Photo */}
        <div className="relative flex-1 bg-gray-100">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-7xl font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
            >
              {name[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-white text-2xl font-bold drop-shadow">
              {name}{age ? `, ${age}` : ''}
            </h2>
            <p className="text-white/70 text-sm mt-0.5">{profile.bio ? `${profile.bio} · ` : ''}{nationality}</p>
          </div>
        </div>

        {/* Hobbies */}
        {hobbies.length > 0 && (
          <div className="p-4 bg-white flex flex-wrap gap-1.5">
            {hobbies.map(h => (
              <span key={h} className="px-2.5 py-1 rounded-full text-xs font-medium text-teal-700 bg-teal-50 border border-teal-100">
                {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default SwipeCard;