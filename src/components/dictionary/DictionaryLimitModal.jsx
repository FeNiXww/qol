import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/contexts/LanguageContext';

export default function DictionaryLimitModal({ open, onClose }) {
  const navigate = useNavigate();
  const { lang } = useLang();
  const isRtl = lang === 'he' || lang === 'ar';

  const title = lang === 'he' ? 'המילון שלך מלא!' : lang === 'ar' ? 'قاموسك ممتلئ!' : 'Your dictionary is full!';
  const subtitle = lang === 'he'
    ? 'הגעת ל-30 מילים בחשבון החינמי. שדרג לפרימיום כדי לשמור מילים ללא הגבלה ולהמשיך ללמוד.'
    : lang === 'ar'
      ? 'وصلت إلى 30 كلمة في الحساب المجاني. ترقية إلى البريميوم لحفظ كلمات غير محدودة ومواصلة التعلم.'
      : "You've reached 30 words on the free plan. Upgrade to Premium to save unlimited words and keep learning.";
  const cta = lang === 'he' ? '👑 שדרג לפרימיום' : lang === 'ar' ? '👑 ترقية إلى البريميوم' : '👑 Upgrade to Premium';
  const later = lang === 'he' ? 'אולי מאוחר יותר' : lang === 'ar' ? 'ربما لاحقاً' : 'Maybe later';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: 'rgba(10,22,40,0.78)' }}
          dir={isRtl ? 'rtl' : 'ltr'}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-[32px] overflow-hidden"
            style={{ background: '#0A1628', border: '1px solid rgba(245,158,11,0.35)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
          >
            {/* Glow orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }} />
            <div className="absolute -top-6 right-0 w-40 h-40 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, #EC4899, transparent)' }} />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <X className="w-4 h-4 text-white/70" />
            </button>

            <div className="relative px-7 pt-12 pb-7 text-center">
              {/* Crown */}
              <motion.div
                initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                className="w-24 h-24 rounded-[28px] mx-auto mb-6 flex items-center justify-center relative"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', boxShadow: '0 12px 40px rgba(245,158,11,0.45)' }}
              >
                <Crown className="w-12 h-12 text-white" />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-300 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-amber-700" />
                </div>
              </motion.div>

              {/* Floating sparkles */}
              {['✨', '⭐', '✦', '✨'].map((s, i) => (
                <motion.span
                  key={i}
                  className="absolute text-lg"
                  style={{ left: `${20 + i * 20}%`, top: `${10 + (i % 2) * 8}%` }}
                  animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
                >
                  {s}
                </motion.span>
              ))}

              <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
              <p className="text-white/55 text-sm leading-relaxed mb-7 max-w-[260px] mx-auto">{subtitle}</p>

              <div className="space-y-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onClose(); navigate('/premium'); }}
                  className="w-full py-3.5 rounded-2xl font-black text-white text-base shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', boxShadow: '0 10px 30px rgba(245,158,11,0.45)' }}
                >
                  {cta}
                </motion.button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-2xl text-white/50 text-sm font-semibold"
                >
                  {later}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}