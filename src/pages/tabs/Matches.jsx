import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { getMatches } from '@/lib/matchesApi';
import MatchListItem from '@/components/qol/MatchListItem';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { MessageCircle } from 'lucide-react';

export default function Matches() {
  const { profile } = useProfile();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      const data = await getMatches(currentUser.id);
      setMatches(data);
      setLoading(false);
    };
    load();

    // Subscribe to match updates
    const unsub = base44.entities.Match.subscribe(() => load());
    return unsub;
  }, [currentUser?.id]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-xl font-black" style={{ color: theme.colors.navy }}>Matches</h1>
        <p className="text-xs text-gray-400 mt-0.5">{matches.length} connection{matches.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No matches yet</h3>
            <p className="text-gray-400 text-sm">Keep swiping to find your first connection!</p>
          </div>
        ) : (
          matches.map(match => (
            <MatchListItem key={match.id} match={match} />
          ))
        )}
      </div>
    </div>
  );
}