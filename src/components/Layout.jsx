import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Compass, MessageCircle, User, Gamepad2, BookOpen } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { theme } from '@/lib/theme';
import { base44 } from '@/api/base44Client';
import GameInvitePopup from '@/components/qol/GameInvitePopup';
import NewMessageNotifier from '@/components/qol/NewMessageNotifier';

export default function Layout() {
  const location = useLocation();
  const { t } = useLang();

  const navItems = [
    { path: '/', label: t.discover, icon: Compass },
    { path: '/matches', label: t.matches, icon: MessageCircle },
    { path: '/games', label: t.games, icon: Gamepad2 },
    { path: '/dictionary', label: t.dictionary || 'Dictionary', icon: BookOpen },
    { path: '/profile', label: t.profile, icon: User },
  ];
  const hideTabs = location.pathname.startsWith('/chat/') || location.pathname.startsWith('/game/') || location.pathname.startsWith('/letter-match');
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const user = await base44.auth.me();
        const [matchesA, matchesB] = await Promise.all([
          base44.entities.Match.filter({ user_a_id: user.id }),
          base44.entities.Match.filter({ user_b_id: user.id }),
        ]);
        const allMatches = [...matchesA, ...matchesB];
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        const hasNew = allMatches.some(m => m.last_message_at && new Date(m.last_message_at).getTime() > fiveMinAgo);
        setHasUnread(hasNew && !location.pathname.startsWith('/matches'));
      } catch {}
    };
    checkUnread();
    const unsub = base44.entities.Message.subscribe(() => checkUnread());
    return unsub;
  }, [location.pathname]);

  return (
    <div className="flex flex-col max-w-md mx-auto" style={{ minHeight: '100dvh', background: '#E6E2D8' }}>
      <GameInvitePopup />
      <NewMessageNotifier />
      <div className={`flex-1 flex flex-col ${hideTabs ? 'overflow-hidden' : 'overflow-hidden pb-[76px]'}`}>
        <Outlet />
      </div>

      {!hideTabs && (
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 safe-area-bottom"
          style={{
            background: 'rgba(230,226,216,0.97)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex px-2 py-2">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
              return (
                <NavLink
                  key={path}
                  to={path}
                  className="flex-1 flex flex-col items-center gap-1 py-1 transition-all"
                >
                  <div className="relative">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200"
                      style={
                        isActive
                          ? { background: `linear-gradient(135deg, #16A499, #FA7C27)`, boxShadow: `0 4px 16px rgba(22,164,153,0.35)` }
                          : { background: 'transparent' }
                      }
                    >
                      <Icon
                        className="w-5 h-5 transition-all"
                        strokeWidth={isActive ? 2.5 : 1.8}
                        style={{ color: isActive ? 'white' : '#94A3B8' }}
                      />
                    </div>
                    {path === '/matches' && hasUnread && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: '#FA7C27' }} />
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold tracking-wide transition-colors"
                    style={{ color: isActive ? '#0D6470' : '#94A3B8' }}
                  >
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}