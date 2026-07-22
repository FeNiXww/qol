import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Filter, BookOpen, TrendingUp, ArrowLeft, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/contexts/LanguageContext';

const PERKS = [
  {
    icon: <Zap className="w-6 h-6" />,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
    title: 'Unlimited Swipes',
    titleHe: 'החלקות ללא הגבלה',
    titleAr: 'تمريرات غير محدودة',
    desc: 'Free users get 20 swipes/day. Go Premium for unlimited daily discoveries.',
    descHe: 'משתמשי חינם מקבלים 20 החלקות ביום. עברו לפרימיום לגילויים יומיים ללא הגבלה.',
    descAr: 'يحصل المستخدمون المجانيون على 20 تمريرة يومياً. اشترك بالبريميوم للاكتشافات اليومية غير المحدودة.',
  },
  {
    icon: <Filter className="w-6 h-6" />,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.15)',
    title: 'Advanced Filters',
    titleHe: 'מסננים מתקדמים',
    titleAr: 'فلاتر متقدمة',
    desc: 'Filter by hobbies, age range, and more to find your ideal connection.',
    descHe: 'סנן לפי תחביבים, טווח גילאים ועוד כדי למצוא את החיבור האידיאלי שלך.',
    descAr: 'تصفية حسب الهوايات والفئة العمرية والمزيد للعثور على اتصالك المثالي.',
  },
  {
    icon: <Star className="w-6 h-6" />,
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.15)',
    title: 'Super Connection',
    titleHe: 'חיבור-על',
    titleAr: 'اتصال فائق',
    desc: 'Send a personal note with your like so you stand out from the crowd.',
    descHe: 'שלח הערה אישית יחד עם הלייק שלך כדי לבלוט מהקהל.',
    descAr: 'أرسل ملاحظة شخصية مع إعجابك لتبرز عن الآخرين.',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.15)',
    title: 'Vocabulary Boost',
    titleHe: 'האצת אוצר מילים',
    titleAr: 'تعزيز المفردات',
    desc: 'Save unlimited words to your personal dictionary (free = 50 words).',
    descHe: 'שמור מילים ללא הגבלה במילון האישי שלך (חינם = 50 מילים).',
    descAr: 'احفظ كلمات غير محدودة في قاموسك الشخصي (مجاني = 50 كلمة).',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.15)',
    title: 'Profile Boost',
    titleHe: 'בוסט לפרופיל',
    titleAr: 'تعزيز الملف الشخصي',
    desc: 'Get featured at the top of discovery queues for 30 min per day.',
    descHe: 'הופיעו בראש תור הגילויים למשך 30 דקות ביום.',
    descAr: 'احصل على مكانة متميزة في صفوف الاكتشاف لمدة 30 دقيقة يومياً.',
  },
];

export default function Premium() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [currentUser, setCurrentUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [success, setSuccess] = useState(false);

  const isRtl = lang === 'he' || lang === 'ar';

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me().catch(() => null);
      setCurrentUser(user);
      if (user) {
        const subs = await base44.entities.Subscription.filter({ user_id: user.id });
        setSubscription(subs[0] || null);
      }
      setLoading(false);
    };
    load();
  }, []);

  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active';

  const handleSubscribe = async () => {
    if (!currentUser || subscribing) return;
    setSubscribing(true);
    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + 1);

    if (subscription) {
      await base44.entities.Subscription.update(subscription.id, {
        plan: 'premium',
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expires.toISOString(),
      });
    } else {
      await base44.entities.Subscription.create({
        user_id: currentUser.id,
        plan: 'premium',
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expires.toISOString(),
        swipes_used_today: 0,
      });
    }
    setSubscribing(false);
    setSuccess(true);
    setTimeout(() => navigate(-1), 2000);
  };

  const perkTitle = (p) => lang === 'he' ? p.titleHe : lang === 'ar' ? p.titleAr : p.title;
  const perkDesc = (p) => lang === 'he' ? p.descHe : lang === 'ar' ? p.descAr : p.desc;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0A1628' }}>
        <div className="w-8 h-8 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: '#0A1628' }} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.1)' }}
      >
        <ArrowLeft className="w-5 h-5 text-white" style={{ transform: isRtl ? 'scaleX(-1)' : undefined }} />
      </button>

      {/* Hero */}
      <div className="relative pt-20 pb-10 px-6 text-center overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }} />
        <div className="absolute top-20 left-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
        <div className="absolute top-20 right-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #EC4899, transparent)' }} />

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
        >
          <Crown className="w-12 h-12 text-white" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-300 flex items-center justify-center">
            <span className="text-[9px]">✨</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-black text-white mb-2"
        >
          QOL{' '}
          <span style={{ background: 'linear-gradient(90deg, #F59E0B, #EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Premium
          </span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-white/60 text-base max-w-xs mx-auto"
        >
          {lang === 'he'
            ? 'חבר ללא הגבלה. למד מהר יותר. תבלוט.'
            : lang === 'ar'
            ? 'تواصل بلا حدود. تعلّم بشكل أسرع. ابرز.'
            : 'Connect without limits. Learn faster. Stand out.'}
        </motion.p>
      </div>

      {/* Comparison */}
      <div className="px-5 mb-6">
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Header row */}
          <div className="grid grid-cols-3 text-center py-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="text-white/40 text-xs font-semibold uppercase tracking-wide">
              {lang === 'he' ? 'תכונה' : lang === 'ar' ? 'الميزة' : 'Feature'}
            </div>
            <div className="text-white/50 text-xs font-semibold uppercase tracking-wide">
              {lang === 'he' ? 'חינם' : lang === 'ar' ? 'مجاني' : 'Free'}
            </div>
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#F59E0B' }}>Premium</div>
          </div>

          {[
            { feature: lang === 'he' ? 'החלקות יומיות' : lang === 'ar' ? 'تمريرات يومية' : 'Daily Swipes', free: '20', premium: '∞' },
            { feature: lang === 'he' ? 'מסננים' : lang === 'ar' ? 'فلاتر' : 'Filters', free: '⚧', premium: '+ גיל / سن / Age' },
            { feature: lang === 'he' ? 'מילון' : lang === 'ar' ? 'القاموس' : 'Dictionary', free: '50', premium: '∞' },
            { feature: lang === 'he' ? 'חיבור-על' : lang === 'ar' ? 'اتصال فائق' : 'Super Connect', free: '✗', premium: '✓' },
            { feature: lang === 'he' ? 'בוסט פרופיל' : lang === 'ar' ? 'تعزيز الملف' : 'Profile Boost', free: '✗', premium: '✓' },
          ].map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-3 text-center py-3.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
            >
              <div className="text-white/70 text-xs px-2">{row.feature}</div>
              <div className="text-white/40 text-sm font-medium">{row.free}</div>
              <div className="text-sm font-bold" style={{ color: '#F59E0B' }}>{row.premium}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Perks */}
      <div className="px-5 mb-6 space-y-3">
        <h2 className="text-white font-black text-lg mb-4">
          {lang === 'he' ? 'מה כלול' : lang === 'ar' ? 'ما يتضمن' : "What's included"}
        </h2>
        {PERKS.map((perk, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 * i + 0.2 }}
            className="flex items-start gap-4 p-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: perk.bg, color: perk.color }}>
              {perk.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-white text-sm">{perkTitle(perk)}</p>
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#10B981' }} />
              </div>
              <p className="text-white/50 text-xs leading-relaxed">{perkDesc(perk)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pricing + CTA */}
      <div className="px-5 pb-12">
        <div
          className="rounded-3xl p-6 mb-4 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.10))', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <div className="flex items-baseline justify-center gap-1 mb-1">
            <span className="text-5xl font-black text-white">$4</span>
            <span className="text-xl font-bold text-white/60">.99</span>
            <span className="text-white/50 text-sm ml-1">
              / {lang === 'he' ? 'חודש' : lang === 'ar' ? 'شهر' : 'month'}
            </span>
          </div>
          <p className="text-white/40 text-xs mb-1">
            {lang === 'he' ? 'בטל בכל עת' : lang === 'ar' ? 'إلغاء في أي وقت' : 'Cancel anytime'}
          </p>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mt-1" style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>
            {lang === 'he' ? '✨ הצעה לזמן מוגבל' : lang === 'ar' ? '✨ عرض لفترة محدودة' : '✨ Limited time offer'}
          </div>
        </div>

        {isPremium ? (
          <div className="w-full py-4 rounded-2xl text-center font-bold text-white" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            ✓ {lang === 'he' ? 'אתה פרימיום!' : lang === 'ar' ? 'أنت مشترك!' : "You're Premium!"}
          </div>
        ) : success ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full py-4 rounded-2xl text-center font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            🎉 {lang === 'he' ? 'ברוך הבא לפרימיום!' : lang === 'ar' ? 'مرحباً بك في البريميوم!' : 'Welcome to Premium!'}
          </motion.div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubscribe}
            disabled={subscribing}
            className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-2xl disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }}
          >
            {subscribing
              ? (lang === 'he' ? 'מעבד…' : lang === 'ar' ? 'جارٍ المعالجة…' : 'Processing…')
              : (lang === 'he' ? '👑 שדרג לפרימיום' : lang === 'ar' ? '👑 ترقية إلى البريميوم' : '👑 Upgrade to Premium')}
          </motion.button>
        )}

        <p className="text-center text-white/25 text-xs mt-4 leading-relaxed">
          {lang === 'he'
            ? 'תנאי השירות • מדיניות הפרטיות • מנוי מתחדש אוטומטית'
            : lang === 'ar'
            ? 'شروط الخدمة • سياسة الخصوصية • الاشتراك يتجدد تلقائياً'
            : 'Terms of Service • Privacy Policy • Subscription auto-renews monthly'}
        </p>
      </div>
    </div>
  );
}