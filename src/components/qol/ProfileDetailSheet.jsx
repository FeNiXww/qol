import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { theme } from '@/lib/theme';

const HOBBY_EMOJIS = {
  Music: '🎵', Art: '🎨', Cooking: '🍳', Reading: '📚', Football: '⚽', Basketball: '🏀',
  Tennis: '🎾', Swimming: '🏊', Hiking: '🥾', Photography: '📸', Gaming: '🎮', Dancing: '💃',
  Travel: '✈️', Yoga: '🧘', Fitness: '💪', Cinema: '🎬', Theatre: '🎭', Poetry: '✍️',
  Chess: '♟️', Cycling: '🚴', Painting: '🖌️', Volunteering: '🤝', Languages: '🗣️',
  History: '🏛️', Technology: '💻',
};

export default function ProfileDetailSheet({ profile, onClose, onLike, onPass }) {
  const { t } = useLang();
  if (!profile) return null;

  const name = profile.display_name || (profile.nationality === 'israeli' ? t.israeli : t.palestinian);
  const age = profile.birthdate
    ? Math.floor((new Date() - new Date(profile.birthdate)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const flag = profile.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const nationalityLabel = profile.nationality === 'israeli' ? t.israeli : t.palestinian;
  const photos = [profile.avatar_url, ...(profile.photos || [])].filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Sheet */}
        <motion.div
          className="relative z-10 w-full overflow-y-auto rounded-t-3xl"
          style={{ background: '#E6E2D8', maxHeight: '90vh' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(19,46,76,0.12)' }}
          >
            <X className="w-5 h-5" style={{ color: '#132E4C' }} />
          </button>

          {/* Hero image */}
          <div className="relative w-full flex-shrink-0" style={{ height: 320 }}>
            {photos.length > 0 ? (
              <img src={photos[0]} alt={name} className="w-full h-full object-cover rounded-t-3xl" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center rounded-t-3xl"
                style={{ background: 'linear-gradient(160deg, #1E4870 0%, #132E4C 100%)' }}
              >
                <span className="text-white font-black" style={{ fontSize: 96, opacity: 0.25 }}>{name[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-t-3xl" style={{ background: 'linear-gradient(to top, rgba(19,46,76,0.85) 0%, transparent 55%)' }} />
            <div className="absolute bottom-0 left-0 px-5 pb-5">
              <h2 className="text-white font-black text-3xl drop-shadow-lg">{name}{age ? `, ${age}` : ''}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">{flag}</span>
                <span className="text-white/80 text-sm font-medium">{nationalityLabel}</span>
                {profile.gender && (
                  <span className="text-white/60 text-sm">· {t[profile.gender] || profile.gender}</span>
                )}
              </div>
            </div>
          </div>

          {/* Extra photos */}
          {photos.length > 1 && (
            <div className="flex gap-2 px-5 pt-4 overflow-x-auto pb-1 scrollbar-none">
              {photos.slice(1).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-24 h-24 rounded-2xl object-cover flex-shrink-0"
                  style={{ border: '2px solid rgba(22,164,153,0.25)' }}
                />
              ))}
            </div>
          )}

          {/* Bio */}
          <div className="px-5 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#0D6470' }}>{t.aboutMe}</h3>
            {profile.bio ? (
              <p className="text-sm leading-relaxed text-gray-700">"{profile.bio}"</p>
            ) : (
              <p className="text-sm italic text-gray-400">{t.noBio}</p>
            )}
          </div>

          {/* Hobbies */}
          {(profile.hobbies || []).length > 0 && (
            <div className="px-5 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#0D6470' }}>{t.interests}</h3>
              <div className="flex flex-wrap gap-2">
                {(profile.hobbies || []).map(h => (
                  <span
                    key={h}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(22,164,153,0.1)', color: '#0D6470', border: '1.5px solid rgba(22,164,153,0.25)' }}
                  >
                    <span>{HOBBY_EMOJIS[h] || '✨'}</span>
                    {t.hobbyTranslations?.[h] || h}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pb-10" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}