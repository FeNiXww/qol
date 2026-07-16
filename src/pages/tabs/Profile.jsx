import React, { useState, useRef } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import HobbyChip from '@/components/qol/HobbyChip';
import { Camera, LogOut, Edit2, Check, X, Calendar } from 'lucide-react';
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

  return (
    <div className="flex flex-col min-h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-black" style={{ color: theme.colors.navy }}>Profile</h1>
        <button
          onClick={() => base44.auth.logout('/sign-in')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Avatar + Identity */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white"
                style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
              >
                {name[0]?.toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white"
              style={{ backgroundColor: theme.colors.orange }}
            >
              {uploading
                ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">{name}</h2>
            <p className="text-sm text-gray-500">{flag} {natLabel}</p>
            {age && <p className="text-xs text-gray-400">{age} years old{profile.gender ? ` · ${profile.gender}` : ''}</p>}
            {profile.age_band && (
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${profile.age_band === 'minor' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-700'}`}>
                {profile.age_band === 'minor' ? '🔒 Minor' : '✓ Adult'}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">About me</h3>
            {editingBio ? (
              <div className="flex gap-2">
                <button onClick={() => { setBio(profile.bio || ''); setEditingBio(false); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={saveBio} disabled={saving} className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: theme.colors.teal }}>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingBio(true)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                <Edit2 className="w-4 h-4 text-gray-500" />
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
                className="w-full text-sm text-gray-700 resize-none rounded-xl p-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/300</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 leading-relaxed">
              {profile.bio || <span className="text-gray-300 italic">No bio yet. Tap ✏️ to add one.</span>}
            </p>
          )}
        </div>

        {/* Hobbies */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Interests</h3>
            {editingHobbies ? (
              <div className="flex gap-2">
                <button onClick={() => { setHobbies(profile.hobbies || []); setEditingHobbies(false); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={saveHobbies} disabled={hobbies.length < 3 || saving} className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-40" style={{ backgroundColor: theme.colors.teal }}>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingHobbies(true)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                <Edit2 className="w-4 h-4 text-gray-500" />
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
              {(profile.hobbies || []).length === 0
                ? <p className="text-sm text-gray-300 italic">No interests yet.</p>
                : (profile.hobbies || []).map(h => <HobbyChip key={h} label={h} selected disabled />)
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}