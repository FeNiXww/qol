import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/contexts/ProfileContext';
import { theme } from '@/lib/theme';
import PrimaryButton from '@/components/qol/PrimaryButton';

export default function YourName() {
  const navigate = useNavigate();
  const { updateProfile } = useProfile();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await base44.auth.updateMe({ full_name: name.trim() });
      await updateProfile({ display_name: name.trim() });
      navigate('/onboarding/nationality');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-white">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full bg-gray-200" />
          <div className="h-1.5 w-8 rounded-full bg-gray-200" />
          <div className="h-1.5 w-8 rounded-full bg-gray-200" />
          <div className="h-1.5 w-8 rounded-full bg-gray-200" />
        </div>
        <h1 className="text-3xl font-black mt-6" style={{ color: theme.colors.navy }}>What's your name?</h1>
        <p className="text-gray-400 mt-2 text-sm">This is how other users will see you.</p>
      </div>

      <div className="flex-1">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleContinue()}
          placeholder="Your first name"
          maxLength={40}
          autoFocus
          className="w-full px-5 py-4 rounded-2xl border-2 text-lg font-semibold text-gray-900 bg-gray-50 focus:outline-none transition-all"
          style={{ borderColor: name.trim() ? theme.colors.teal : '#E5E7EB' }}
        />
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={handleContinue} disabled={!name.trim()} loading={loading}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}