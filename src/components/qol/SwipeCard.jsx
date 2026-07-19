import React, { forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { theme } from '@/lib/theme';
import { useLang } from '@/contexts/LanguageContext';
import { MapPin } from 'lucide-react';

const HOBBY_EMOJIS = {
  Music: '🎵', Art: '🎨', Cooking: '🍳', Reading: '📚', Football: '⚽', Basketball: '🏀',
  Tennis: '🎾', Swimming: '🏊', Hiking: '🥾', Photography: '📸', Gaming: '🎮', Dancing: '💃',
  Travel: '✈️', Yoga: '🧘', Fitness: '💪', Cinema: '🎬', Theatre: '🎭', Poetry: '✍️',
  Chess: '♟️', Cycling: '🚴', Painting: '🖌️', Volunteering: '🤝', Languages: '🗣️',
  History: '🏛️', Technology: '💻',
};

const SwipeCard = forwardRef(function SwipeCard({ profile, onSwipe, isTop, style }, ref) {
  const { t } = useLang();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
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

  const name = profile.display_name || (profile.nationality === 'israeli' ? t.israeli : t.palestinian);
  const age = profile.birthdate
    ? Math.floor((new Date() - new Date(profile.birthdate)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const flag = profile.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const nationalityLabel = profile.nationality === 'israeli' ? t.israeli : t.palestinian;
  const hobbies = (profile.hobbies || []).slice(0, 6);

  return (
    <motion.div
      style={{ x, rotate, ...style, position: 'absolute', width: '100%' }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={isTop ? handleDragEnd : undefined}
      animate={controls}
      whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
      className="select-none"
    >
      {/* Like / Pass indicators */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-6 z-20 border-[3px] border-emerald-400 rounded-2xl px-4 py-1.5 rotate-[-18deg] bg-white/10 backdrop-blur-sm"
          >
            <span className="text-emerald-400 font-black text-xl tracking-widest">{t.like.toUpperCase()}</span>
          </motion.div>
          <motion.div
            style={{ opacity: passOpacity }}
            className="absolute top-8 right-6 z-20 border-[3px] border-rose-400 rounded-2xl px-4 py-1.5 rotate-[18deg] bg-white/10 backdrop-blur-sm"
          >
            <span className="text-rose-400 font-black text-xl tracking-widest">{t.pass.toUpperCase()}</span>
          </motion.div>
        </>
      )}

      {/* Card */}
      <div
        className="overflow-hidden flex flex-col"
        style={{
          height: 500,
          borderRadius: 28,
          boxShadow: isTop
            ? '0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)'
            : '0 8px 32px rgba(0,0,0,0.10)',
          background: '#fff',
        }}
      >
        {/* Photo / Avatar section */}
        <div className="relative flex-shrink-0" style={{ height: 300 }}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(160deg, #16A499 0%, #0D6470 60%, #132E4C 100%)` }}
            >
              <span className="text-white font-black" style={{ fontSize: 96, opacity: 0.25 }}>{name[0]?.toUpperCase()}</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(19,46,76,0.85) 0%, rgba(19,46,76,0.2) 45%, transparent 70%)' }}
          />
          {/* Name + nationality on photo */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-white font-black text-2xl leading-tight drop-shadow-lg">
                  {name}{age ? `, ${age}` : ''}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base">{flag}</span>
                  <span className="text-white/75 text-sm font-medium">{nationalityLabel}</span>
                </div>
              </div>
              {profile.gender && (
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  {t[profile.gender] || profile.gender}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom content */}
        <div className="flex-1 px-5 pt-4 pb-5 flex flex-col gap-3 overflow-hidden">
          {profile.bio && (
            <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 italic">"{profile.bio}"</p>
          )}

          {hobbies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {hobbies.map((h) => (
                <span
                  key={h}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(22,164,153,0.08)', color: '#0D6470', border: '1.5px solid rgba(22,164,153,0.25)' }}
                >
                  <span>{HOBBY_EMOJIS[h] || '✨'}</span>
                  {t.hobbyTranslations?.[h] || h}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-3xl mb-1">🌱</p>
              <p className="text-gray-400 text-xs">{t.stillExploring}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default SwipeCard;