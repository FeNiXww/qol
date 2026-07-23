import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { theme } from '@/lib/theme';
import QolLogo from '@/components/qol/QolLogo';
import LetterMatchGame from '@/components/games/LetterMatchGame';
import { useLang } from '@/contexts/LanguageContext';

export default function LetterMatch() {
  const { t } = useLang();
  const dir = t.dir || 'ltr';
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const navigate = useNavigate();
  return (
    <div dir={dir} className="flex flex-col h-screen" style={{ background: '#F5F0E8' }}>
      <div
        className="flex items-center gap-3 px-4 pb-4 flex-shrink-0 shadow-sm"
        style={{ paddingTop: '52px', background: `linear-gradient(135deg, ${theme.colors.navy} 0%, ${theme.colors.navyLight} 100%)` }}
      >
        <button onClick={() => navigate('/games')} className="text-white p-1">
          <BackIcon className="w-5 h-5" />
        </button>
        <QolLogo size={30} blend />
        <h1 className="text-xl font-black text-white">{t.matchLettersTitle}</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <LetterMatchGame />
      </div>
    </div>
  );
}