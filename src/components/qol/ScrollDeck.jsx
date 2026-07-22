import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, UserCheck } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useLang } from '@/contexts/LanguageContext';
import ProfileDetailSheet from './ProfileDetailSheet';

function ProfileCard({ profile, onConnect, onPass }) {
  const [showDetail, setShowDetail] = useState(false);
  const name = profile.display_name || 'Anonymous';
  const flag = profile.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const hobbies = profile.hobbies || [];
  const emojis = ['⚽', '🎵', '📚', '🎨', '🏃', '🍕', '🎮', '✈️', '🌿', '🤸'];

  return (
    <>
      <div
        className="relative rounded-[32px] overflow-hidden shadow-2xl flex flex-col mx-auto"
        style={{
          width: 'calc(100% - 32px)',
          maxWidth: 360,
          height: 500,
          background: 'linear-gradient(160deg, #0D6470 0%, #132E4C 100%)'
        }}>
        
        {/* View profile button — top left */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setShowDetail(true)}
          className="absolute top-4 left-4 flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-2xl z-10"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
          
          
          <span className="text-[10px] font-semibold text-white/80 leading-none">view</span>
        </motion.button>

        {/* Avatar + hobby ring */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-8">
          <div className="relative mb-6" style={{ width: 200, height: 200 }}>
            {hobbies.slice(0, 6).map((_, i) => {
              const angle = i / Math.max(hobbies.slice(0, 6).length, 1) * 2 * Math.PI - Math.PI / 2;
              const radius = 82;
              const x = 100 + Math.cos(angle) * radius - 14;
              const y = 100 + Math.sin(angle) * radius - 14;
              return (
                <span
                  key={i}
                  className="absolute text-2xl"
                  style={{ left: x, top: y, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                  
                  {emojis[i % emojis.length]}
                </span>);

            })}
            <div
              className="absolute rounded-full overflow-hidden border-4 border-white shadow-xl"
              style={{ width: 144, height: 144, left: 28, top: 28 }}>
              
              {profile.avatar_url ?
              <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" /> :

              <div
                className="w-full h-full flex items-center justify-center text-5xl font-black text-white"
                style={{ background: `linear-gradient(135deg, #16A499, #FA7C27)` }}>
                
                  {name[0]?.toUpperCase()}
                </div>
              }
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-1 text-center">
            Hi, I'm {name} {flag}
          </h2>

          {profile.bio &&
          <p className="text-white/60 text-sm text-center leading-relaxed px-4 line-clamp-2 mb-3">
              {profile.bio}
            </p>
          }

          {hobbies.length > 0 &&
          <div className="flex flex-wrap gap-1.5 justify-center px-4 mt-2">
              {hobbies.slice(0, 4).map((h) =>
            <span
              key={h}
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
              
                  {h}
                </span>
            )}
            </div>
          }
        </div>

        {/* Action buttons */}
        <div className="pb-8 px-6 flex items-center justify-center gap-10">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => onPass(profile)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hidden"
            style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.2)' }}>
            
            <span className="text-2xl">👋</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => onConnect(profile)}
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #16A499, #FA7C27)' }}>
            
            <UserCheck className="w-9 h-9 text-white" />
          </motion.button>


        </div>
      </div>

      {showDetail &&
      <ProfileDetailSheet
        profile={profile}
        onClose={() => setShowDetail(false)}
        onLike={() => {setShowDetail(false);onConnect(profile);}}
        onPass={() => {setShowDetail(false);onPass(profile);}} />

      }
    </>);

}

export default function ScrollDeck({ profiles, onSwipe, onLoadMore, onRefresh, loading, empty }) {
  const { t } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (profiles.length === 0) setCurrentIndex(0);
  }, [profiles.length]);

  useEffect(() => {
    if (profiles.length > 0 && currentIndex >= profiles.length - 2) {
      onLoadMore?.();
    }
  }, [currentIndex, profiles.length]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((i) => i + 1);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleConnect = (p) => {onSwipe(p, 'like');goNext();};
  const handlePass = (p) => {onSwipe(p, 'pass');goNext();};

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const deltaX = Math.abs(touchStartX.current - e.changedTouches[0].clientX);
    if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > deltaX * 1.5) {
      if (deltaY > 0) goNext();else
      goPrev();
    }
    touchStartY.current = null;
    touchStartX.current = null;
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: 560 }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">{t.findingConnections}</p>
        </div>
      </div>);

  }

  if (empty || profiles.length === 0 && !loading) {
    return (
      <div className="w-full flex items-center justify-center px-8" style={{ height: 560 }}>
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
            onClick={() => onRefresh?.()}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg, #16A499, #FA7C27)' }}>
            
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        </div>
      </div>);

  }

  const currentProfile = profiles[currentIndex];
  if (!currentProfile && !loading) return null;
  if (!currentProfile) return null;

  const startDot = Math.max(0, currentIndex - 2);
  const totalVisible = Math.min(profiles.length, 5);

  return (
    <div
      className="w-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>
      
      {/* Fixed height card container */}
      <div className="relative w-full overflow-hidden" style={{ height: 520 }}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentProfile.id}
            custom={direction}
            initial={{ y: direction > 0 ? 520 : -520, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction > 0 ? -520 : 520, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            <ProfileCard
              profile={currentProfile}
              onConnect={handleConnect}
              onPass={handlePass} />
            
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scroll hint */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        <span className="text-xs text-gray-400">Swipe up for next</span>
        <span className="text-gray-400 animate-bounce text-sm">↑</span>
      </div>

      {/* Dots indicator */}
      {profiles.length > 1 &&
      <div className="flex justify-center gap-1.5 py-3">
          {profiles.slice(startDot, startDot + totalVisible).map((_, i) => {
          const idx = startDot + i;
          return (
            <div
              key={idx}
              className="rounded-full transition-all duration-300"
              style={{
                width: idx === currentIndex ? 20 : 6,
                height: 6,
                background: idx === currentIndex ? '#16A499' : 'rgba(0,0,0,0.2)'
              }} />);


        })}
        </div>
      }
    </div>);

}