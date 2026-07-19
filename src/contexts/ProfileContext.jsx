import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const ProfileContext = createContext(null);

export function ProfileProvider({ children, currentUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!currentUser?.id) { setLoading(false); return; }
    try {
      // First try to find by user_id (real user profiles)
      const byUserId = await base44.entities.Profile.filter({ user_id: currentUser.id });
      if (byUserId.length > 0) {
        setProfile(byUserId[0]);
        return;
      }
      // Fall back: profiles created by this user but without a demo user_id
      const byCreator = await base44.entities.Profile.filter({ created_by_id: currentUser.id });
      const realProfile = byCreator.find(p => !p.user_id || p.user_id === currentUser.id);
      setProfile(realProfile || null);
    } catch (e) {
      console.error('Failed to fetch profile:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Presence heartbeat — mark this profile online while the app is open
  useEffect(() => {
    if (!profile?.id) return;
    const beat = () => {
      base44.entities.Profile.update(profile.id, { last_seen_at: new Date().toISOString() }).catch(() => {});
    };
    beat();
    const interval = setInterval(beat, 60_000);
    const onVisible = () => { if (!document.hidden) beat(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [profile?.id]);

  const updateProfile = useCallback(async (data) => {
    if (!profile?.id) {
      if (!currentUser?.id) throw new Error('No authenticated user');
      const created = await base44.entities.Profile.create({ display_name: currentUser.full_name, user_id: currentUser.id, ...data, created_by_id: currentUser.id });
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