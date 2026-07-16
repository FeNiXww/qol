import React, { useState, useEffect } from 'react';
import { getMatches } from '@/lib/matchesApi';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { Link } from 'react-router-dom';
import { MessageCircle, ChevronRight, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Matches() {
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
    const unsub = base44.entities.Match.subscribe(() => load());
    return unsub;
  }, [currentUser?.id]);

  return (
    <div className="flex flex-col h-full" style={{ background: '#F8FFFE' }}>
      {/* Header */}
      <div
        className="px-6 pb-5 flex-shrink-0 shadow-sm"
        style={{
          paddingTop: '52px',
          background: `linear-gradient(135deg, ${theme.colors.navy} 0%, ${theme.colors.navyLight} 100%)`,
        }}
      >
        <h1 className="text-2xl font-black text-white">Matches</h1>
        <p className="text-xs mt-1" style={{ color: theme.colors.tealLight }}>
          {matches.length} connection{matches.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: theme.colors.teal }} />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.colors.teal}20, ${theme.colors.orange}20)` }}
            >
              <Heart className="w-10 h-10" style={{ color: theme.colors.teal }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.navy }}>No matches yet</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Start swiping on the Discover tab to find your first cross-cultural connection!
            </p>
            <Link
              to="/"
              className="mt-6 px-6 py-3 rounded-2xl text-white font-semibold text-sm shadow-md"
              style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
            >
              Go to Discover
            </Link>
          </div>
        ) : (
          matches.map(match => {
            const other = match.otherProfile;
            const name = other?.display_name || 'Connection';
            const flag = other?.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
            const timeAgo = match.last_message_at
              ? formatDistanceToNow(new Date(match.last_message_at), { addSuffix: true })
              : 'New match!';

            return (
              <Link
                key={match.id}
                to={`/chat/${match.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md"
                style={{ borderColor: '#F0FDFA' }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {other?.avatar_url ? (
                    <img src={other.avatar_url} alt={name} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                      style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
                    >
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                  {/* Online dot */}
                  <div
                    className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                    style={{ backgroundColor: theme.colors.teal }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-base">{flag}</span>
                    <p className="font-bold text-gray-900 truncate">{name}</p>
                  </div>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 flex-shrink-0" />
                    {timeAgo}
                  </p>
                  {(other?.hobbies || []).length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {(other.hobbies || []).slice(0, 2).map(h => (
                        <span
                          key={h}
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${theme.colors.teal}15`, color: theme.colors.teal }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: theme.colors.teal }} />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}