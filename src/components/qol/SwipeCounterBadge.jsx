import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { DAILY_SWIPE_LIMIT } from '@/lib/subscription';
import SwipeLimitModal from './SwipeLimitModal';
import SwipeStatusModal from './SwipeStatusModal';

export default function SwipeCounterBadge({ remaining, premium }) {
  const { lang } = useLang();
  const isRtl = lang === 'he' || lang === 'ar';
  const [now, setNow] = useState(Date.now());
  const [showModal, setShowModal] = useState(false);

  // Only tick when we need a live countdown.
  useEffect(() => {
    if (premium || remaining > 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [premium, remaining]);

  const msToMidnight = (() => {
    const d = new Date(now);
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
    return next - d;
  })();

  const fmt = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const copy = lang === 'he'
    ? { left: 'נותרו', refresh: 'מתחדש בעוד', unlimited: 'החלקות ללא הגבלה' }
    : lang === 'ar'
      ? { left: 'متبقي', refresh: 'يتجدد خلال', unlimited: 'تمريرات غير محدودة' }
      : { left: 'left', refresh: 'refreshes in', unlimited: 'Unlimited swipes' };

  // Premium: no limit, no modal
  if (premium) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }} dir={isRtl ? 'rtl' : 'ltr'}>
        <Zap className="w-3.5 h-3.5 text-white" fill="white" />
        <span className="text-xs font-bold text-white">∞</span>
        <span className="text-[10px] font-semibold text-white/90">{copy.unlimited}</span>
      </div>
    );
  }

  const out = remaining <= 0;

  // Outer look depends on state
  const outerStyle = out
    ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }
    : remaining <= 5
      ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)' }
      : { background: 'rgba(22,164,153,0.14)', border: '1px solid rgba(22,164,153,0.3)' };

  const iconColor = out ? '#EF4444' : remaining <= 5 ? '#F59E0B' : '#16A499';
  const textColor = out ? '#B91C1C' : remaining <= 5 ? '#B45309' : '#0D6470';

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={outerStyle}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {out ? (
          <Clock className="w-3.5 h-3.5" style={{ color: textColor }} />
        ) : (
          <Zap className="w-3.5 h-3.5" style={{ color: iconColor }} fill="currentColor" />
        )}
        {out ? (
          <span className="text-xs font-bold tabular-nums" style={{ color: textColor }}>
            {copy.refresh} {fmt(msToMidnight)}
          </span>
        ) : (
          <>
            <span className="text-xs font-black tabular-nums" style={{ color: textColor }}>
              {remaining}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: textColor, opacity: 0.75 }}>
              / {DAILY_SWIPE_LIMIT} {copy.left}
            </span>
          </>
        )}
      </motion.button>

      {out ? (
        <SwipeLimitModal open={showModal} onClose={() => setShowModal(false)} remaining={remaining} />
      ) : (
        <SwipeStatusModal open={showModal} onClose={() => setShowModal(false)} remaining={remaining} />
      )}
    </>
  );
}