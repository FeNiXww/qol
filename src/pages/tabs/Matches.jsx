import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getMatches, isProfileOnline } from '@/lib/matchesApi';
import { getUnreadMatchIds } from '@/lib/unread';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { Link } from 'react-router-dom';
import { MessageCircle, ChevronRight, UserCheck, Moon, Settings, Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { he, ar } from 'date-fns/locale';
import { useLang } from '@/contexts/LanguageContext';
import NotificationsBell from '@/components/qol/NotificationsBell';
import CreateGroupModal from '@/components/qol/CreateGroupModal';

export default function Matches() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const dateFnsLocale = lang === 'ar' ? ar : he;
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [unreadIds, setUnreadIds] = useState(new Set());
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const loadInFlight = useRef(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    base44.entities.Profile.filter({ user_id: currentUser.id })
      .then(rows => setProfile(rows[0] || null))
      .catch(() => {});
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    const debounceRef = { timer: null };

    const load = async () => {
      if (loadInFlight.current) return;
      loadInFlight.current = true;
      try {
        const data = await getMatches(currentUser.id);
        setMatches(data);
        setLoading(false);
        setUnreadIds(data.length ? await getUnreadMatchIds(data, currentUser.id) : new Set());
      } catch (e) {
        setLoading(false);
      } finally {
        loadInFlight.current = false;
      }
    };

    const debouncedLoad = () => {
      clearTimeout(debounceRef.timer);
      debounceRef.timer = setTimeout(load, 2000);
    };

    setLoading(true);
    load();

    const unsub = base44.entities.Match.subscribe(debouncedLoad);
    const unsubMsg = base44.entities.Message.subscribe(debouncedLoad);
    return () => {
      clearTimeout(debounceRef.timer);
      unsub();
      unsubMsg();
    };
  }, [currentUser?.id]);

  return (
    <div className="flex flex-col h-full" style={{ background: '#E6E2D8' }}>
      {/* Header */}
      <div
        className="px-5 pb-5 flex-shrink-0"
        style={{
          paddingTop: '52px',
          background: 'linear-gradient(145deg, #132E4C 0%, #0D6470 100%)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">{t.connectionsTitle || t.matchesTitle || 'Connections'}</h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#268ECE' }}>
              {matches.length} {matches.length !== 1 ? t.connections : t.connection}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <button
              onClick={() => setShowCreateGroup(true)}
              className="h-9 px-3 rounded-full flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #16A499, #0D6470)', boxShadow: '0 4px 12px rgba(22,164,153,0.35)' }}
              title="New group"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">
                {lang === 'he' ? 'קבוצה חדשה' : lang === 'ar' ? 'مجموعة جديدة' : 'New group'}
              </span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Settings className="w-4 h-4 text-white/80" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: '#E6E2D8' }}>
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
              <UserCheck className="w-10 h-10" style={{ color: theme.colors.teal }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.navy }}>{t.noMatchesYet}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t.noMatchesMsg}</p>
            <div className="flex flex-col gap-3 items-center w-full mt-6 max-w-xs mx-auto">
              <Link
                to="/"
                className="w-full px-6 py-3 rounded-2xl text-white font-semibold text-sm shadow-md text-center"
                style={{ background: `linear-gradient(135deg, #132E4C, #1E4870)` }}
              >
                {t.goToDiscover}
              </Link>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full px-6 py-3 rounded-2xl font-semibold text-sm shadow-md text-center"
                style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, #0D6470)`, color: 'white' }}
              >
                {lang === 'he' ? 'צור קבוצה' : lang === 'ar' ? 'أنشئ مجموعة' : 'Create a group'}
              </button>
            </div>
          </div>
        ) : (
          matches.map(match => {
            const timeAgo = match.last_message_at
              ? formatDistanceToNow(new Date(match.last_message_at), { addSuffix: true, locale: dateFnsLocale })
              : (match.is_group ? 'New group' : t.newMatch);

            if (match.is_group) {
              const gname = match.group?.name || 'Group';
              const gavatar = match.group?.avatar_url;
              const memberCount = (match.participant_ids || []).length || 1;
              return (
                <Link
                  key={match.id}
                  to={`/chat/${match.id}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl transition-all active:scale-[0.98]"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}
                >
                  <div className="relative flex-shrink-0">
                    {gavatar ? (
                      <img src={gavatar} alt={gname} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, #132E4C, #1E4870)` }}>
                        <Users className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-base">👥</span>
                      <p className="font-bold text-gray-900 truncate">{gname}</p>
                      {unreadIds.has(match.id) && (
                        <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: theme.colors.orange }} />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 flex-shrink-0" />
                      {memberCount} members · {timeAgo}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: theme.colors.teal }} />
                </Link>
              );
            }

            const other = match.otherProfile;
            const name = other?.display_name || 'Connection';
            const flag = other ? (other.nationality === 'israeli' ? '🇮🇱' : '🇵🇸') : '🌍';

            return (
              <Link
                key={match.id}
                to={`/chat/${match.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl transition-all active:scale-[0.98]"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {other?.avatar_url ? (
                    <img src={other.avatar_url} alt={name} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                      style={{ background: `linear-gradient(135deg, #132E4C, #1E4870)` }}
                    >
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                  {/* Online / idle status */}
                  {isProfileOnline(other) ? (
                    <div
                      className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: theme.colors.teal }}
                    />
                  ) : (
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                      style={{ backgroundColor: '#94A3B8' }}
                    >
                      <Moon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-base">{flag}</span>
                    <p className="font-bold text-gray-900 truncate">{name}</p>
                    {unreadIds.has(match.id) && (
                      <span
                        className="flex-shrink-0 w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: theme.colors.orange }}
                      />
                    )}
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
                          {t.hobbyTranslations?.[h] || h}
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

      {showCreateGroup && profile && (
        <CreateGroupModal
          myId={profile.user_id || currentUser?.id}
          ageBand={profile.age_band}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
    </div>
  );
}