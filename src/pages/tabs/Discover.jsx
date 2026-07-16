import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { fetchDiscoverBatch, recordSwipe, createMatchIfMutual } from '@/lib/discovery';
import SwipeDeck from '@/components/qol/SwipeDeck';
import MatchModal from '@/components/qol/MatchModal';
import { theme } from '@/lib/theme';
import { base44 } from '@/api/base44Client';
import { SlidersHorizontal } from 'lucide-react';

export default function Discover() {
  const { profile } = useProfile();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [matchData, setMatchData] = useState(null); // { id, otherProfile }
  const [currentUser, setCurrentUser] = useState(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const loadMore = useCallback(async () => {
    if (!profile || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const batch = await fetchDiscoverBatch({ myProfile: profile, genderFilter, limit: 10 });
      setProfiles(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newOnes = batch.filter(p => !existingIds.has(p.id));
        return [...prev, ...newOnes];
      });
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [profile, genderFilter]);

  useEffect(() => {
    setProfiles([]);
    setLoading(true);
    loadMore();
  }, [profile?.id, genderFilter]);

  const handleSwipe = async (targetProfile, direction) => {
    if (!currentUser || !profile) return;
    const result = await recordSwipe({
      swiperId: currentUser.id,
      targetId: targetProfile.created_by_id,
      direction,
    });
    if (result.matched) {
      await createMatchIfMutual({
        userAId: currentUser.id,
        userBId: targetProfile.created_by_id,
        ageBand: profile.age_band,
      });
      // Find the match
      const matches = await base44.entities.Match.filter({ user_a_id: currentUser.id, user_b_id: targetProfile.created_by_id });
      const matchesB = await base44.entities.Match.filter({ user_a_id: targetProfile.created_by_id, user_b_id: currentUser.id });
      const match = matches[0] || matchesB[0];
      if (match) {
        setMatchData({ ...match, otherProfile: targetProfile });
      }
    }
  };

  if (!profile || profile.onboarding_step !== 'complete') return null;

  const oppositeNationality = profile.nationality === 'israeli' ? 'Palestinians' : 'Israelis';

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-black" style={{ color: theme.colors.navy }}>Discover</h1>
          <p className="text-xs text-gray-400 mt-0.5">Meeting {oppositeNationality}</p>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
            genderFilter ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'
          }`}
          style={genderFilter ? { backgroundColor: theme.colors.teal } : {}}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {genderFilter ? genderFilter.charAt(0).toUpperCase() + genderFilter.slice(1) : 'Filter'}
        </button>
      </div>

      {/* Gender filter dropdown */}
      {showFilter && (
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex gap-2">
          {['all', 'male', 'female', 'other'].map(g => (
            <button
              key={g}
              onClick={() => { setGenderFilter(g === 'all' ? null : g); setShowFilter(false); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                (g === 'all' && !genderFilter) || genderFilter === g ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'
              }`}
              style={(g === 'all' && !genderFilter) || genderFilter === g ? { backgroundColor: theme.colors.teal } : {}}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Swipe deck */}
      <div className="flex-1 flex flex-col pt-6">
        <SwipeDeck
          profiles={profiles}
          onSwipe={handleSwipe}
          onLoadMore={loadMore}
          loading={loading}
          empty={!loading && profiles.length === 0}
        />
      </div>

      {/* Match modal */}
      {matchData && (
        <MatchModal
          match={matchData}
          myProfile={profile}
          onClose={() => setMatchData(null)}
        />
      )}
    </div>
  );
}