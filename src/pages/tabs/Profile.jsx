import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import HobbyChip from '@/components/qol/HobbyChip';
import { Camera, LogOut, Edit2, Check, X, Globe } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { differenceInYears, parseISO } from 'date-fns';

const HOBBIES = [
  'Music', 'Art', 'Cooking', 'Reading', 'Football', 'Basketball', 'Tennis', 'Swimming',
  'Hiking', 'Photography', 'Gaming', 'Dancing', 'Travel', 'Yoga', 'Fitness',
  'Cinema', 'Theatre', 'Poetry', 'Chess', 'Cycling', 'Painting', 'Volunteering',
  'Languages', 'History', 'Technology'
];

export default function ProfileTab() {
  const { profile, updateProfile } = useProfile();
  const { lang, chooseLang, t } = useLang();
  const [currentUser, setCurrentUser] = useState(null);
  const [editingBio, setEditingBio] = useState(false);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);
  const [bio, setBio] = useState(profile?.bio || '');
  const [editingHobbies, setEditingHobbies] = useState(false);
  const [hobbies, setHobbies] = useState(profile?.hobbies || []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  if (!profile) return null;

  const name = profile.display_name || currentUser?.full_name || currentUser?.email?.split('@')[0] || 'You';
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
    <div className="flex flex-col min-h-full overflow-y-auto" style={{ background: '#F8FFFE' }}>
      {/* Header */}
      <div
        className="px-6 pb-5 flex-shrink-0 shadow-sm flex items-center justify-between"
        style={{ paddingTop: '52px', background: `linear-gradient(135deg, ${theme.colors.navy} 0%, ${theme.colors.navyLight} 100%)` }}
      >
        <h1 className="text-2xl font-black text-white">{t.profileTitle}</h1>
        <button
          onClick={() => base44.auth.logout('/sign-in')}
          className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> {t.signOut}
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
            {age && <p className="text-xs text-gray-400">{age} {t.yearsOld}{profile.gender ? ` · ${profile.gender}` : ''}</p>}
            {profile.age_band && (
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${profile.age_band === 'minor' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-700'}`}>
                {profile.age_band === 'minor' ? t.minor : t.adult}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">{t.aboutMe}</h3>
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
                placeholder={t.writeSomething}
                className="w-full text-sm text-gray-700 resize-none rounded-xl p-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/300</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 leading-relaxed">
              {profile.bio || <span className="text-gray-300 italic">{t.noBio}</span>}
            </p>
          )}
        </div>

        {/* App Language */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-800">{t.appLanguage}</h3>
          </div>
          <div className="flex gap-3">
            {[
              { code: 'he', label: 'עברית', flag: '🇮🇱' },
              { code: 'ar', label: 'العربية', flag: '🇵🇸' },
            ].map(opt => (
              <button
                key={opt.code}
                onClick={() => chooseLang(opt.code)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all"
                style={lang === opt.code
                  ? { borderColor: theme.colors.teal, backgroundColor: `${theme.colors.teal}15`, color: theme.colors.teal }
                  : { borderColor: '#E5E7EB', color: '#6B7280', backgroundColor: 'white' }
                }
              >
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hobbies */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">{t.interests}</h3>
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
                {hobbies.length} {t.selected} {hobbies.length < 3 && `(${t.needThreeMore} ${3 - hobbies.length})`}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.hobbies || []).length === 0
                ? <p className="text-sm text-gray-300 italic">{t.noInterests}</p>
                : (profile.hobbies || []).map(h => <HobbyChip key={h} label={h} selected disabled />)
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}