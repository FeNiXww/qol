import React, { useState, useRef } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import HobbyChip from '@/components/qol/HobbyChip';
import { Camera, LogOut, Edit2, Check, X, User, MapPin, Calendar } from 'lucide-react';
import { differenceInYears, parseISO } from 'date-fns';

const HOBBIES = [
  'Music', 'Art', 'Cooking', 'Reading', 'Football', 'Basketball', 'Tennis', 'Swimming',
  'Hiking', 'Photography', 'Gaming', 'Dancing', 'Travel', 'Yoga', 'Fitness',
  'Cinema', 'Theatre', 'Poetry', 'Chess', 'Cycling', 'Painting', 'Volunteering',
  'Languages', 'History', 'Technology'
];

export default function ProfileTab() {
  const { profile, updateProfile } = useProfile();
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(profile?.bio || '');
  const [editingHobbies, setEditingHobbies] = useState(false);
  const [hobbies, setHobbies] = useState(profile?.hobbies || []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  if (!profile) return null;

  const name = profile.display_name || 'You';
  const flag = profile.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const natLabel = profile.nationality === 'israeli' ? 'Israeli' : 'Palestinian';
  const age = profile.birthdate ? differenceInYears(new Date(), parseISO(profile.birthdate)) : null;
  const genderEmoji = profile.gender === 'male' ? '♂️' : profile.gender === 'female' ? '♀️' : '⚧';

  const saveBio = async () => {
    setSaving(true);
    await updateProfile({ bio });
    setSaving(false);
    setEditingBio(false);
  };

  const saveHobbies = async () => {
    setSaving(true);
    await updateProfile({ hobbies });
    setSaving(false);
    setEditingHobbies(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateProfile({ avatar_url: file_url });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout('/sign-in');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#F8FFFE' }}>
      {/* Hero header with gradient */}
      <div
        className="relative flex-shrink-0 pb-16"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.navy} 0%, ${theme.colors.navyLight} 100%)`,
          paddingTop: '52px',
        }}
      >
        <div className="flex items-center justify-between px-6 mb-6">
          <h1 className="text-2xl font-black text-white">Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {/* Avatar centered */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black border-4 border-white shadow-xl text-white"
                style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
              >
                {name[0]?.toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
              style={{ backgroundColor: theme.colors.orange }}
            >
              {uploading
                ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Camera className="w-4 h-4 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">{name}</h2>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm">{flag} {natLabel}</span>
            {age && <span className="text-white/60 text-sm">· {age} yrs</span>}
            {profile.gender && <span className="text-white/60 text-sm">· {genderEmoji}</span>}
          </div>
          {profile.age_band && (
            <span
              className="mt-2 text-xs px-3 py-1 rounded-full font-semibold"
              style={
                profile.age_band === 'minor'
                  ? { backgroundColor: 'rgba(96,165,250,0.25)', color: '#BFDBFE' }
                  : { backgroundColor: `${theme.colors.teal}40`, color: theme.colors.tealLight }
              }
            >
              {profile.age_band === 'minor' ? '🔒 Minor (14-17)' : '✓ Adult (18+)'}
            </span>
          )}
        </div>
      </div>

      {/* Cards — pull up over the gradient */}
      <div className="px-4 space-y-4 pb-8" style={{ marginTop: '-40px' }}>
        {/* Bio card */}
        <div className="bg-white rounded-3xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">About me</h3>
            {editingBio ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { setBio(profile.bio || ''); setEditingBio(false); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={saveBio}
                  disabled={saving}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: theme.colors.teal }}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingBio(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.colors.teal}15` }}
              >
                <Edit2 className="w-4 h-4" style={{ color: theme.colors.teal }} />
              </button>
            )}
          </div>
          {editingBio ? (
            <div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                maxLength={300}
                placeholder="Write something about yourself…"
                className="w-full text-sm text-gray-700 resize-none rounded-xl p-3 focus:outline-none focus:ring-2 border"
                style={{ borderColor: theme.colors.teal + '40', '--tw-ring-color': theme.colors.teal }}
              />
              <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/300</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 leading-relaxed">
              {profile.bio || (
                <span className="text-gray-300 italic">No bio yet. Tap ✏️ to tell people about yourself.</span>
              )}
            </p>
          )}
        </div>

        {/* Hobbies card */}
        <div className="bg-white rounded-3xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">Interests</h3>
            {editingHobbies ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { setHobbies(profile.hobbies || []); setEditingHobbies(false); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={saveHobbies}
                  disabled={hobbies.length < 3 || saving}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-40"
                  style={{ backgroundColor: theme.colors.teal }}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingHobbies(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.colors.teal}15` }}
              >
                <Edit2 className="w-4 h-4" style={{ color: theme.colors.teal }} />
              </button>
            )}
          </div>
          {editingHobbies ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {HOBBIES.map(h => (
                  <HobbyChip
                    key={h}
                    label={h}
                    selected={hobbies.includes(h)}
                    onToggle={() => setHobbies(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
                  />
                ))}
              </div>
              <p className="text-xs text-center" style={{ color: hobbies.length < 3 ? theme.colors.orange : theme.colors.teal }}>
                {hobbies.length} selected {hobbies.length < 3 && `(need ${3 - hobbies.length} more)`}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.hobbies || []).length === 0 ? (
                <p className="text-sm text-gray-300 italic">No interests added yet.</p>
              ) : (
                (profile.hobbies || []).map(h => <HobbyChip key={h} label={h} selected disabled />)
              )}
            </div>
          )}
        </div>

        {/* Account info card */}
        <div className="bg-white rounded-3xl p-5 shadow-md">
          <h3 className="font-bold text-gray-800 mb-3">Account</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.teal}15` }}>
                <User className="w-4 h-4" style={{ color: theme.colors.teal }} />
              </div>
              <span>{flag} {natLabel} · {profile.gender || 'Not set'}</span>
            </div>
            {age && (
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.orange}15` }}>
                  <Calendar className="w-4 h-4" style={{ color: theme.colors.orange }} />
                </div>
                <span>{age} years old</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}