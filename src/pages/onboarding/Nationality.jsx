import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { theme } from '@/lib/theme';
import PrimaryButton from '@/components/qol/PrimaryButton';
import QolLogo from '@/components/qol/QolLogo';
import { useLang } from '@/contexts/LanguageContext';

export default function Nationality() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateProfile } = useProfile();
  const { t } = useLang();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const options = [
    { value: 'israeli', flag: '🇮🇱', label: 'Israeli', lang: 'Hebrew', desc: 'ישראל' },
    { value: 'palestinian', flag: '🇵🇸', label: 'Palestinian', lang: 'Arabic', desc: 'فلسطين' },
  ];

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const displayName = location.state?.displayName;
      await updateProfile({ nationality: selected, onboarding_step: 'about', ...(displayName ? { display_name: displayName } : {}) });
      navigate('/onboarding/about');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-white" dir={t.dir}>
      <div className="flex justify-center mb-6">
        <QolLogo size={52} />
      </div>
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full bg-gray-200" />
          <div className="h-1.5 w-8 rounded-full bg-gray-200" />
          <div className="h-1.5 w-8 rounded-full bg-gray-200" />
        </div>
        <h1 className="text-3xl font-black mt-6" style={{ color: theme.colors.navy }}>{t.whoAreYou}</h1>
        <p className="text-gray-400 mt-2 text-sm">{t.nationalitySubtitle}</p>
      </div>

      <div className="space-y-4 flex-1">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`w-full flex items-center gap-5 p-6 rounded-3xl border-2 transition-all duration-200 text-left ${
              selected === opt.value ? 'shadow-lg scale-[1.02]' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
            style={selected === opt.value ? { borderColor: theme.colors.teal, backgroundColor: `${theme.colors.teal}10` } : {}}
          >
            <span className="text-5xl">{opt.flag}</span>
            <div>
              <p className="font-bold text-xl text-gray-900">{opt.label}</p>
              <p className="text-sm text-gray-500">{opt.lang} · <span className="font-medium">{opt.desc}</span></p>
            </div>
            {selected === opt.value && (
              <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: theme.colors.teal }}>✓</div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={handleContinue} disabled={!selected} loading={loading}>
          {t.continue}
        </PrimaryButton>
      </div>
    </div>
  );
}