import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { theme } from '@/lib/theme';
import QolLogo from '@/components/qol/QolLogo';
import MemoryGame from '@/components/games/MemoryGame';
import { useLang } from '@/contexts/LanguageContext';

export default function MemoryGamePage() {
  const { t } = useLang();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-screen" style={{ background: '#F8FFFE' }}>
      <div
        className="flex items-center gap-3 px-4 pb-4 flex-shrink-0 shadow-sm"
        style={{ paddingTop: '52px', background: `linear-gradient(135deg, ${theme.colors.navy} 0%, ${theme.colors.navyLight} 100%)` }}
      >
        <button onClick={() => navigate('/games')} className="text-white p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <QolLogo size={30} blend />
        <h1 className="text-xl font-black text-white">{t.memoryGameTitle}</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <MemoryGame />
      </div>
    </div>
  );
}