import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { theme } from '@/lib/theme';
import PrimaryButton from '@/components/qol/PrimaryButton';
import { Camera, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { updateProfile, profile } = useProfile();
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatar(file_url);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateProfile({
        bio,
        avatar_url: avatar || null,
        onboarding_step: 'complete',
      });
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-white">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.teal }} />
        </div>
        <h1 className="text-3xl font-black mt-6" style={{ color: theme.colors.navy }}>Your profile</h1>
        <p className="text-gray-400 mt-2 text-sm">Add a photo and bio so people can get to know you.</p>
      </div>

      <div className="flex-1 space-y-6">
        {/* Avatar upload */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-32 h-32 rounded-full flex items-center justify-center border-4 border-dashed border-gray-300 bg-gray-50">
                <Camera className="w-10 h-10 text-gray-300" />
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: theme.colors.teal }}
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <p className="text-sm text-gray-400">Tap to add a profile photo</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="A few words about yourself — your interests, your city, what you're looking for in a connection…"
            rows={5}
            maxLength={300}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/300</p>
        </div>
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={handleComplete} loading={loading || uploading}>
          Complete profile
        </PrimaryButton>
        <button onClick={handleComplete} className="w-full py-3 mt-3 text-gray-400 text-sm">
          Skip for now
        </button>
      </div>
    </div>
  );
}