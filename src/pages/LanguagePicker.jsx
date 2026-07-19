import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLang } from '@/contexts/LanguageContext';
import { theme } from '@/lib/theme';

const options = [
  {
    code: 'he',
    label: 'עברית',
    sublabel: 'Hebrew',
    flag: '🇮🇱',
    dir: 'rtl',
  },
  {
    code: 'ar',
    label: 'العربية',
    sublabel: 'Arabic',
    flag: '🇵🇸',
    dir: 'rtl',
  },
];

export default function LanguagePicker() {
  const navigate = useNavigate();
  const { chooseLang, lang } = useLang();
  const [selected, setSelected] = React.useState(lang || null);

  const handleContinue = () => {
    if (!selected) return;
    chooseLang(selected);
    navigate('/welcome');
  };

  return (
    <div
      className="flex flex-col items-center justify-center max-w-md mx-auto px-8"
      style={{
        height: '100dvh',
        background: `linear-gradient(160deg, #132E4C 0%, #0D6470 100%)`,
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex flex-col items-center"
      >
        <img
          src="https://media.base44.com/images/public/6a5874b8ce4d2dc8cf35eb52/561895cb0_Qollogo.png"
          alt="QOL"
          className="w-20 h-20 object-contain mb-4"
          style={{ mixBlendMode: 'multiply' }}
        />
        <h1 className="text-3xl font-black text-white text-center leading-tight">
          Choose your language
        </h1>
        <p className="text-white/50 mt-2 text-sm text-center">
          בחר שפה · اختر لغة
        </p>
      </motion.div>

      {/* Language cards */}
      <div className="w-full flex flex-col gap-4 mb-10">
        {options.map((opt, i) => (
          <motion.button
            key={opt.code}
            initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.15 + i * 0.1 }}
            onClick={() => setSelected(opt.code)}
            className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 transition-all"
            style={{
              background: selected === opt.code ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
              borderColor: selected === opt.code ? 'white' : 'rgba(255,255,255,0.15)',
              boxShadow: selected === opt.code ? '0 0 0 3px rgba(255,255,255,0.2)' : 'none',
            }}
          >
            <span className="text-4xl">{opt.flag}</span>
            <div className="text-left flex-1" dir={opt.dir}>
              <p className="text-white font-black text-xl">{opt.label}</p>
              <p className="text-white/50 text-sm">{opt.sublabel}</p>
            </div>
            <div
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: selected === opt.code ? 'white' : 'rgba(255,255,255,0.3)',
                background: selected === opt.code ? 'white' : 'transparent',
              }}
            >
              {selected === opt.code && (
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Continue */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.4 }}
        onClick={handleContinue}
        disabled={!selected}
        className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-xl transition-all active:scale-95 disabled:opacity-30"
        style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
      >
        {selected === 'he' ? 'המשך →' : selected === 'ar' ? 'استمر ←' : 'Continue'}
      </motion.button>
    </div>
  );
}