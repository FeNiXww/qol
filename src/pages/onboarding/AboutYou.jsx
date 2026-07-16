import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { theme } from '@/lib/theme';
import PrimaryButton from '@/components/qol/PrimaryButton';
import { isAtLeast14, getAgeBand } from '@/lib/ageUtils';
import { format, subYears } from 'date-fns';

const MAX_DATE = format(subYears(new Date(), 14), 'yyyy-MM-dd');
const MIN_DATE = '1920-01-01';

const genderOptions = [
  { value: 'male', label: 'Male', emoji: '♂️' },
  { value: 'female', label: 'Female', emoji: '♀️' },
  { value: 'other', label: 'Other', emoji: '⚧' },
];

export default function AboutYou() {
  const navigate = useNavigate();
  const { updateProfile } = useProfile();
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setError('');
    if (!gender) { setError('Please select your gender'); return; }
    if (!birthdate) { setError('Please enter your date of birth'); return; }
    if (!isAtLeast14(birthdate)) { setError('You must be at least 14 years old to join QOL.'); return; }
    setLoading(true);
    const age_band = getAgeBand(birthdate);
    await updateProfile({ gender, birthdate, age_band, onboarding_step: 'hobbies' });
    navigate('/onboarding/hobbies');
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-white">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full bg-gray-200" />
          <div className="h-1.5 w-8 rounded-full bg-gray-200" />
        </div>
        <h1 className="text-3xl font-black mt-6" style={{ color: theme.colors.navy }}>About you</h1>
        <p className="text-gray-400 mt-2 text-sm">Tell us a bit about yourself.</p>
      </div>

      <div className="space-y-6 flex-1">
        {/* Gender */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Gender</label>
          <div className="grid grid-cols-3 gap-3">
            {genderOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setGender(opt.value)}
                className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all ${
                  gender === opt.value ? 'shadow-md scale-[1.02]' : 'border-gray-200 bg-gray-50'
                }`}
                style={gender === opt.value ? { borderColor: theme.colors.teal, backgroundColor: `${theme.colors.teal}10` } : {}}
              >
                <span className="text-2xl mb-1">{opt.emoji}</span>
                <span className={`text-sm font-medium ${gender === opt.value ? 'text-teal-700' : 'text-gray-600'}`}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date of birth</label>
          <p className="text-xs text-gray-400 mb-3">You must be at least 14 years old.</p>
          <input
            type="date"
            value={birthdate}
            onChange={e => setBirthdate(e.target.value)}
            max={MAX_DATE}
            min={MIN_DATE}
            className="w-full py-3.5 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>
        )}
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={handleContinue} disabled={!gender || !birthdate} loading={loading}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}