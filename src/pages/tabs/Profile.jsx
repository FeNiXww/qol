import React, { useState, useRef } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import HobbyChip from '@/components/qol/HobbyChip';
import PrimaryButton from '@/components/qol/PrimaryButton';
import { Camera, LogOut, Edit2, Check, X } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-white border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-black" style={{ color: theme.colors.navy }}>Profile</h1>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Avatar + Identity */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white" style={{ backgroundColor: theme.colors.teal }}>
                {name[0]?.toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: theme.colors.orange }}
            >
              {uploading ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">{name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{flag} {natLabel}</p>
            {profile.gender && (
              <p className="text-xs text-gray-400 capitalize mt-0.5">{profile.gender}</p>
            )}
            {profile.age_band && (
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${profile.age_band === 'minor' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                {profile.age_band}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Bio</h3>
            {editingBio ? (
              <div className="flex gap-2">
                <button onClick={() => { setBio(profile.bio || ''); setEditingBio(false); }} className="text-gray-400"><X className="w-5 h-5" /></button>
                <button onClick={saveBio} className="text-teal-600"><Check className="w-5 h-5" /></button>
              </div>
            ) : (
              <button onClick={() => setEditingBio(true)} className="text-gray-400 hover:text-teal-600"><Edit2 className="w-4 h-4" /></button>
            )}
          </div>
          {editingBio ? (
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              maxLength={300}
              className="w-full text-sm text-gray-700 resize-none border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2"
            />
          ) : (
            <p className="text-sm text-gray-500 leading-relaxed">
              {profile.bio || <span className="text-gray-300 italic">No bio yet. Tap the edit icon to add one.</span>}
            </p>
          )}
        </div>

        {/* Hobbies */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Hobbies</h3>
            {editingHobbies ? (
              <div className="flex gap-2">
                <button onClick={() => { setHobbies(profile.hobbies || []); setEditingHobbies(false); }} className="text-gray-400"><X className="w-5 h-5" /></button>
                <button onClick={saveHobbies} disabled={hobbies.length < 3} className="text-teal-600 disabled:opacity-40"><Check className="w-5 h-5" /></button>
              </div>
            ) : (
              <button onClick={() => setEditingHobbies(true)} className="text-gray-400 hover:text-teal-600"><Edit2 className="w-4 h-4" /></button>
            )}
          </div>
          {editingHobbies ? (
            <div>
              <div className="flex flex-wrap gap-2">
                {HOBBIES.map(h => (
                  <HobbyChip
                    key={h}
                    label={h}
                    selected={hobbies.includes(h)}
                    onToggle={() => setHobbies(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">{hobbies.length} selected (min 3)</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.hobbies || []).length === 0
                ? <p className="text-sm text-gray-300 italic">No hobbies added yet.</p>
                : (profile.hobbies || []).map(h => <HobbyChip key={h} label={h} selected disabled />)
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}