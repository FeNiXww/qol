import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const ProfileContext = createContext(null);

export function ProfileProvider({ children, currentUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!currentUser?.id) { setLoading(false); return; }
    try {
      const profiles = await base44.entities.Profile.filter({ created_by_id: currentUser.id });
      setProfile(profiles[0] || null);
    } catch (e) {
      console.error('Failed to fetch profile:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (data) => {
    if (!profile?.id) {
      if (!currentUser?.id) throw new Error('No authenticated user');
      const created = await base44.entities.Profile.create({ ...data, created_by_id: currentUser.id });
      setProfile(created);
      return created;
    }
    await base44.entities.Profile.update(profile.id, data);
    setProfile(prev => ({ ...prev, ...data }));
    return { ...profile, ...data };
  }, [profile, currentUser?.id]);

  const onboardingComplete = profile?.onboarding_step === 'complete';

  return (
    <ProfileContext.Provider value={{ profile, loading, fetchProfile, updateProfile, onboardingComplete }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}