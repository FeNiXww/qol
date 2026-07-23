import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { fetchDiscoverBatch, recordSwipe, createMatchIfMutual, sendConnectionRequest } from '@/lib/discovery';
import ScrollDeck from '@/components/qol/ScrollDeck';
import SearchUsers from '@/components/qol/SearchUsers';
import MatchModal from '@/components/qol/MatchModal';
import { theme } from '@/lib/theme';
import { base44 } from '@/api/base44Client';
import { SlidersHorizontal, Settings, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QolLogo from '@/components/qol/QolLogo';
import { useLang } from '@/contexts/LanguageContext';

export default function Discover() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { t } = useLang();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const fetchingRef = useRef(false);
  const swipedIdsRef = useRef(new Set());

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Listen for matches created by the OTHER user (when they complete the mutual like)
  useEffect(() => {
    if (!currentUser || !profile) return;
    const myId = profile.user_id || currentUser.id;
    const unsub = base44.entities.Match.subscribe(async (event) => {
      if (event.type !== 'create') return;
      const match = event.data;
      // Only care if we're user_b (we already swiped, they just completed the match)
      if (match.user_b_id !== myId) return;
      // Fetch the other user's profile to show the modal
      const otherId = match.user_a_id;
      const profiles = await base44.entities.Profile.filter({ user_id: otherId });
      const otherProfile = profiles[0] || null;
      if (otherProfile) setMatchData({ ...match, otherProfile });
    });
    return unsub;
  }, [currentUser?.id, profile?.id]);

  const loadMore = useCallback(async () => {
    if (!profile || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const batch = await fetchDiscoverBatch({ myProfile: profile, genderFilter, limit: 10 });
      setProfiles(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newOnes = batch.filter(p => {
          const pUserId = p.user_id || p.created_by_id;
          return !existingIds.has(p.id)
            && !swipedIdsRef.current.has(pUserId)
            && !swipedIdsRef.current.has(p.id);
        });
        return [...prev, ...newOnes];
      });
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [profile, genderFilter]);

  const resetAndLoad = useCallback(async () => {
    setProfiles([]);
    swipedIdsRef.current = new Set();
    fetchingRef.current = false;
    setLoading(true);
    if (!profile) return;
    fetchingRef.current = true;
    try {
      const batch = await fetchDiscoverBatch({ myProfile: profile, genderFilter, limit: 10 });
      setProfiles(batch);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [profile, genderFilter]);

  useEffect(() => {
    if (!profile) return;
    resetAndLoad();
  }, [profile?.id, genderFilter]);

  const handleSwipe = async (targetProfile, direction) => {
    if (!currentUser || !profile) return;
    const myId = profile.user_id || currentUser.id;
    const targetId = targetProfile.user_id || targetProfile.created_by_id;
    // Track locally (both user ID and profile ID) so refetched batches never re-include this profile
    swipedIdsRef.current.add(targetId);
    swipedIdsRef.current.add(targetProfile.id);
    const result = await recordSwipe({ swiperId: myId, targetId, direction });
    if (result.matched) {
      await createMatchIfMutual({ userAId: myId, userBId: targetId, ageBand: profile.age_band });
      const matches = await base44.entities.Match.filter({ user_a_id: myId, user_b_id: targetId });
      const matchesB = await base44.entities.Match.filter({ user_a_id: targetId, user_b_id: myId });
      const match = matches[0] || matchesB[0];
      if (match) setMatchData({ ...match, otherProfile: targetProfile });
    }
  };

  const handleSearchConnect = async (targetProfile) => {
    if (!currentUser || !profile) return;
    const myId = profile.user_id || currentUser.id;
    const targetId = targetProfile.user_id || targetProfile.created_by_id;
    try {
      const res = await sendConnectionRequest({ myId, targetId, ageBand: profile.age_band });
      if (res.matched && res.match) {
        setShowSearch(false);
        setMatchData({ ...res.match, otherProfile: targetProfile });
      } else {
        setShowSearch(false);
        setToast(t.requestSent);
        setTimeout(() => setToast(null), 2500);
      }
    } catch {
      setToast(t.requestSent);
      setTimeout(() => setToast(null), 2500);
    }
  };

  // Show loading while profile is being fetched
  if (profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Profile not complete — shouldn't reach here normally but safeguard
  if (!profile || profile.onboarding_step !== 'complete') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-8">
        <div className="text-center">
          <div className="text-5xl mb-4">👋</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Complete your profile first</h3>
          <p className="text-gray-400 text-sm">Finish onboarding to start discovering connections.</p>
        </div>
      </div>
    );
  }

  const oppositeNationality = profile.nationality === 'israeli' ? t.palestinians : t.israelis;

  return (
    <div className="flex flex-col h-full" style={{ background: '#E6E2D8' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pb-4 flex-shrink-0"
        style={{
          paddingTop: '52px',
          background: `linear-gradient(145deg, #132E4C 0%, #0D6470 100%)`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <QolLogo size={38} />
          <div>
            <h1 className="text-xl font-black text-white leading-tight">{t.discoverTitle}</h1>
            <p className="text-xs font-medium" style={{ color: '#268ECE' }}>
              {t.meeting} {oppositeNationality}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Search className="w-4 h-4 text-white/80" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Settings className="w-4 h-4 text-white/80" />
          </button>
          <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all"
          style={
            genderFilter
              ? { background: 'linear-gradient(135deg, #FA7C27, #E8651A)', color: 'white', boxShadow: '0 4px 12px rgba(250,124,39,0.4)' }
              : { backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }
          }
        >
            <SlidersHorizontal className="w-4 h-4" />
            {genderFilter ? t[genderFilter] : t.filter}
          </button>
        </div>
      </div>

      {/* Gender filter dropdown */}
      {showFilter && (
        <div className="px-4 py-3 flex gap-2 flex-wrap" style={{ background: '#132E4C', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {['all', 'male', 'female', 'other'].map(g => (
            <button
              key={g}
              onClick={() => { setGenderFilter(g === 'all' ? null : g); setShowFilter(false); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                (g === 'all' && !genderFilter) || genderFilter === g
                  ? { background: 'linear-gradient(135deg, #16A499, #0D6470)', color: 'white', boxShadow: '0 4px 12px rgba(22,164,153,0.4)' }
                  : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.12)' }
              }
            >
              {g === 'all' ? t.all : t[g]}
            </button>
          ))}
        </div>
      )}

      {/* Scroll deck */}
      <div style={{ background: '#E6E2D8' }}>
        <ScrollDeck
          profiles={profiles}
          onSwipe={handleSwipe}
          onLoadMore={loadMore}
          onRefresh={resetAndLoad}
          loading={loading}
          empty={!loading && profiles.length === 0}
        />
      </div>

      {matchData && (
        <MatchModal
          match={matchData}
          myProfile={profile}
          onClose={() => setMatchData(null)}
        />
      )}

      {showSearch && (
        <SearchUsers
          myId={profile.user_id || currentUser?.id}
          onClose={() => setShowSearch(false)}
          onConnect={handleSearchConnect}
        />
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg" style={{ bottom: 100, background: theme.colors.teal }}>
          {toast}
        </div>
      )}
    </div>
  );
}