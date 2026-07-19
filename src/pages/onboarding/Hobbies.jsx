import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { theme } from '@/lib/theme';
import HobbyChip from '@/components/qol/HobbyChip';
import PrimaryButton from '@/components/qol/PrimaryButton';
import { useLang } from '@/contexts/LanguageContext';

const HOBBIES = [
  'Music', 'Art', 'Cooking', 'Reading', 'Football', 'Basketball', 'Tennis', 'Swimming',
  'Hiking', 'Photography', 'Gaming', 'Dancing', 'Travel', 'Yoga', 'Fitness',
  'Cinema', 'Theatre', 'Poetry', 'Chess', 'Cycling', 'Painting', 'Volunteering',
  'Languages', 'History', 'Technology'
];

const MIN_HOBBIES = 3;

export default function Hobbies() {
  const navigate = useNavigate();
  const { updateProfile } = useProfile();
  const { t } = useLang();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggle = (h) => {
    setSelected(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  };

  const handleContinue = async () => {
    if (selected.length < MIN_HOBBIES) return;
    setLoading(true);
    try {
      await updateProfile({ hobbies: selected, onboarding_step: 'profile' });
      navigate('/onboarding/profile-setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-white" dir={t.dir}>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full bg-gray-200" />
        </div>
        <h1 className="text-3xl font-black mt-6" style={{ color: theme.colors.navy }}>{t.interestsTitle}</h1>
        <p className="text-gray-400 mt-2 text-sm">{t.interestsSubtitle}</p>
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap gap-2.5 mb-4">
          {HOBBIES.map(h => (
            <HobbyChip key={h} label={h} selected={selected.includes(h)} onToggle={() => toggle(h)} />
          ))}
        </div>
        <p className="text-sm text-gray-400 text-center mt-4">
          {selected.length} {t.selected} {selected.length < MIN_HOBBIES && `(${t.needMore} ${MIN_HOBBIES - selected.length})`}
        </p>
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={handleContinue} disabled={selected.length < MIN_HOBBIES} loading={loading}>
          {t.continue}
        </PrimaryButton>
      </div>
    </div>
  );
}