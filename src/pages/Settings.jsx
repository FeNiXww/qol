import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Check } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

const LANGS = [
  { code: 'he', label: 'עברית', sublabel: 'Hebrew', flag: '🇮🇱' },
  { code: 'ar', label: 'العربية', sublabel: 'Arabic', flag: '🇵🇸' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { lang, chooseLang, t } = useLang();

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#132E4C' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 pb-5 flex-shrink-0"
        style={{ paddingTop: '52px', background: 'linear-gradient(145deg, #132E4C 0%, #0D6470 100%)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}
      >
        <button onClick={() => navigate(-1)} className="text-white/70 p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-black text-white">{t.appLanguage}</h1>
      </div>

      <div className="flex-1 px-5 py-6 space-y-5" style={{ background: '#E6E2D8' }}>
        {/* Language section */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <Globe className="w-4 h-4" style={{ color: '#0D6470' }} />
            <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#0D6470' }}>{t.appLanguage}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {LANGS.map(opt => (
              <motion.button
                key={opt.code}
                whileTap={{ scale: 0.98 }}
                onClick={() => chooseLang(opt.code)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
                style={lang === opt.code ? { background: 'rgba(22,164,153,0.07)' } : {}}
              >
                <span className="text-3xl">{opt.flag}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.sublabel}</p>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={lang === opt.code
                    ? { background: '#16A499' }
                    : { border: '2px solid #D1D5DB' }
                  }
                >
                  {lang === opt.code && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}