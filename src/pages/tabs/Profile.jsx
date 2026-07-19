import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import HobbyChip from '@/components/qol/HobbyChip';
import { Camera, LogOut, Edit2, Check, X, Settings } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { differenceInYears, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const HOBBIES = [
  'Music', 'Art', 'Cooking', 'Reading', 'Football', 'Basketball', 'Tennis', 'Swimming',
  'Hiking', 'Photography', 'Gaming', 'Dancing', 'Travel', 'Yoga', 'Fitness',
  'Cinema', 'Theatre', 'Poetry', 'Chess', 'Cycling', 'Painting', 'Volunteering',
  'Languages', 'History', 'Technology'
];

const HOBBY_EMOJIS = {
  Music: '🎵', Art: '🎨', Cooking: '🍳', Reading: '📚', Football: '⚽', Basketball: '🏀',
  Tennis: '🎾', Swimming: '🏊', Hiking: '🥾', Photography: '📸', Gaming: '🎮', Dancing: '💃',
  Travel: '✈️', Yoga: '🧘', Fitness: '💪', Cinema: '🎬', Theatre: '🎭', Poetry: '✍️',
  Chess: '♟️', Cycling: '🚴', Painting: '🖌️', Volunteering: '🤝', Languages: '🗣️',
  History: '🏛️', Technology: '💻',
};

export default function ProfileTab() {
  const { profile, updateProfile } = useProfile();
  const { t } = useLang();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(profile?.bio || '');
  const [editingHobbies, setEditingHobbies] = useState(false);
  const [hobbies, setHobbies] = useState(profile?.hobbies || []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  if (!profile) return null;

  const name = profile.display_name || currentUser?.full_name || currentUser?.email?.split('@')[0] || 'You';
  const flag = profile.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const natLabel = profile.nationality === 'israeli' ? t.israeli : t.palestinian;
  const age = profile.birthdate ? differenceInYears(new Date(), parseISO(profile.birthdate)) : null;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

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
    <div className="flex flex-col min-h-full overflow-y-auto" style={{ background: '#E6E2D8' }}>
      {/* Hero Header */}
      <div
        className="relative flex-shrink-0 pb-8"
        style={{ paddingTop: '52px', background: 'linear-gradient(145deg, #132E4C 0%, #0D6470 100%)' }}
      >
        {/* Top bar actions */}
        <div className="flex items-center justify-between px-5 mb-6">
          <h1 className="text-xl font-black text-white">{t.profileTitle}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Settings className="w-4 h-4 text-white/80" />
            </button>
            <button
              onClick={() => base44.auth.logout('/sign-in')}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(207,46,38,0.25)', border: '1px solid rgba(207,46,38,0.4)' }}
            >
              <LogOut className="w-4 h-4 text-red-300" />
            </button>
          </div>
        </div>

        {/* Avatar centered */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: '3px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white"
                style={{
                  background: 'linear-gradient(135deg, #16A499, #FA7C27)',
                  border: '3px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                }}
              >
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: '#FA7C27', border: '2px solid white' }}
            >
              {uploading
                ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <h2 className="text-2xl font-black text-white mt-3">{name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{flag}</span>
            <span className="text-white/70 text-sm font-medium">{natLabel}</span>
            {age && <span className="text-white/50 text-sm">· {age} {t.yearsOld}</span>}
          </div>
          {profile.age_band && (
            <span
              className="mt-2 text-xs px-3 py-1 rounded-full font-semibold"
              style={profile.age_band === 'minor'
                ? { background: 'rgba(38,142,206,0.25)', color: '#268ECE' }
                : { background: 'rgba(22,164,153,0.25)', color: '#16A499' }
              }
            >
              {profile.age_band === 'minor' ? t.minor : t.adult}
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="px-5 pt-5 space-y-4 pb-8">
        {/* Bio card */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 20px rgba(19,46,76,0.10)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#0D6470' }}>{t.aboutMe}</h3>
            {editingBio ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { setBio(profile.bio || ''); setEditingBio(false); }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={saveBio}
                  disabled={saving}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ background: '#16A499' }}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingBio(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(22,164,153,0.1)' }}
              >
                <Edit2 className="w-4 h-4" style={{ color: '#16A499' }} />
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
                placeholder={t.writeSomething}
                className="w-full text-sm text-gray-700 resize-none rounded-xl p-3 border focus:outline-none focus:ring-2"
                style={{ borderColor: '#E6E2D8', focusRingColor: '#16A499' }}
              />
              <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/300</p>
            </div>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: profile.bio ? '#374151' : '#C4B9A8' }}>
              {profile.bio || <em>{t.noBio}</em>}
            </p>
          )}
        </div>

        {/* Hobbies card */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 20px rgba(19,46,76,0.10)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#0D6470' }}>{t.interests}</h3>
            {editingHobbies ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { setHobbies(profile.hobbies || []); setEditingHobbies(false); }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={saveHobbies}
                  disabled={hobbies.length < 3 || saving}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-40"
                  style={{ background: '#16A499' }}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingHobbies(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(22,164,153,0.1)' }}
              >
                <Edit2 className="w-4 h-4" style={{ color: '#16A499' }} />
              </button>
            )}
          </div>

          {editingHobbies ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {HOBBIES.map(h => (
                  <button
                    key={h}
                    onClick={() => setHobbies(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={hobbies.includes(h)
                      ? { background: '#16A499', color: 'white' }
                      : { background: '#F5F3EF', color: '#6B7280', border: '1px solid #E6E2D8' }
                    }
                  >
                    <span>{HOBBY_EMOJIS[h] || '✨'}</span>
                    {t.hobbyTranslations?.[h] || h}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center font-medium" style={{ color: hobbies.length < 3 ? '#FA7C27' : '#16A499' }}>
                {hobbies.length} {t.selected} {hobbies.length < 3 && `· ${3 - hobbies.length} ${t.needThreeMore}`}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.hobbies || []).length === 0
                ? <p className="text-sm italic" style={{ color: '#C4B9A8' }}>{t.noInterests}</p>
                : (profile.hobbies || []).map(h => (
                  <span
                    key={h}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(22,164,153,0.1)', color: '#0D6470', border: '1px solid rgba(22,164,153,0.2)' }}
                  >
                    <span>{HOBBY_EMOJIS[h] || '✨'}</span>
                    {t.hobbyTranslations?.[h] || h}
                  </span>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}