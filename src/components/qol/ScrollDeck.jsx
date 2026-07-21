import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, RefreshCw, UserCheck } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useLang } from '@/contexts/LanguageContext';
import ProfileDetailSheet from './ProfileDetailSheet';

function ProfileCard({ profile, onConnect, onPass, isActive }) {
  const [showDetail, setShowDetail] = useState(false);
  const name = profile.display_name || 'Anonymous';
  const flag = profile.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const hobbies = profile.hobbies || [];

  return (
    <>
      <div
        className="relative w-full flex-shrink-0 flex items-center justify-center"
        style={{ height: '100%' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
          style={{
            width: '88%',
            maxWidth: 360,
            height: '88%',
            maxHeight: 580,
            background: `linear-gradient(160deg, #0D6470 0%, #132E4C 100%)`,
          }}
        >
          {/* Avatar circle with hobby emoji ring */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pt-8">
            <div className="relative mb-6">
              {/* Hobby emoji decorations */}
              {hobbies.slice(0, 6).map((_, i) => {
                const angle = (i / Math.max(hobbies.slice(0, 6).length, 1)) * 2 * Math.PI - Math.PI / 2;
                const radius = 82;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const emojis = ['⚽', '🎵', '📚', '🎨', '🏃', '🍕', '🎮', '✈️', '🌿', '🤸'];
                return (
                  <span
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      left: `calc(50% + ${x}px - 14px)`,
                      top: `calc(50% + ${y}px - 14px)`,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    }}
                  >
                    {emojis[i % emojis.length]}
                  </span>
                );
              })}

              {/* Avatar */}
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-xl relative z-10">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-5xl font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
                  >
                    {name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Name + flag */}
            <h2 className="text-3xl font-black text-white mb-1 text-center">
              Hi, I'm {name} {flag}
            </h2>

            {/* Age / bio snippet */}
            {profile.bio ? (
              <p className="text-white/60 text-sm text-center leading-relaxed px-4 line-clamp-2 mb-3">
                {profile.bio}
              </p>
            ) : (
              <div className="mb-3" />
            )}

            {/* Hobby chips */}
            {hobbies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center px-4">
                {hobbies.slice(0, 4).map(h => (
                  <span
                    key={h}
                    className="text-xs px-3 py-1 rounded-full font-semibold"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom action area */}
          <div className="pb-8 px-6 flex items-center justify-center gap-10">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => onPass(profile)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <span className="text-2xl">👋</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => onConnect(profile)}
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
            >
              <UserCheck className="w-9 h-9 text-white" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowDetail(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <span className="text-2xl">👁️</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {showDetail && (
        <ProfileDetailSheet
          profile={profile}
          onClose={() => setShowDetail(false)}
          onLike={() => { setShowDetail(false); onConnect(profile); }}
          onPass={() => { setShowDetail(false); onPass(profile); }}
        />
      )}
    </>
  );
}

export default function ScrollDeck({ profiles, onSwipe, onLoadMore, loading, empty }) {
  const { t } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const touchStartY = useRef(null);

  // Auto-load more when near end
  useEffect(() => {
    if (profiles.length > 0 && currentIndex >= profiles.length - 2 && currentIndex < profiles.length) {
      onLoadMore?.();
    }
  }, [currentIndex, profiles.length]);

  const goNext = useCallback(() => {
    setCurrentIndex(i => i + 1);
  }, []);

  const handleConnect = (profile) => {
    onSwipe(profile, 'like');
    goNext();
  };

  const handlePass = (profile) => {
    onSwipe(profile, 'pass');
    goNext();
  };

  // Touch swipe up/down
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 50) goNext();
    touchStartY.current = null;
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">{t.findingConnections}</p>
        </div>
      </div>
    );
  }

  if (empty || profiles.length === 0) {
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

  const currentProfile = profiles[currentIndex];

  // All profiles exhausted — show empty state
  if (!currentProfile && !loading) {
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

  if (!currentProfile) return null;

  // Scroll indicator dots
  const totalVisible = Math.min(profiles.length, 5);
  const startDot = Math.max(0, currentIndex - 2);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProfile.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <ProfileCard
              profile={currentProfile}
              onConnect={handleConnect}
              onPass={handlePass}
              isActive
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scroll dots indicator */}
      {profiles.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {profiles.slice(startDot, startDot + totalVisible).map((_, i) => {
            const idx = startDot + i;
            return (
              <div
                key={idx}
                className="rounded-full transition-all duration-300"
                style={{
                  width: idx === currentIndex ? 20 : 6,
                  height: 6,
                  background: idx === currentIndex ? theme.colors.teal : 'rgba(0,0,0,0.2)',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}