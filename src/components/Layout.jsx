import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Compass, MessageCircle, User } from 'lucide-react';
import { theme } from '@/lib/theme';
import { base44 } from '@/api/base44Client';

const navItems = [
  { path: '/', label: 'Discover', icon: Compass },
  { path: '/matches', label: 'Matches', icon: MessageCircle },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Layout() {
  const location = useLocation();
  const hideTabs = location.pathname.startsWith('/chat/');
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // Check for new messages by comparing last_message_at on matches
    const checkUnread = async () => {
      try {
        const user = await base44.auth.me();
        const [matchesA, matchesB] = await Promise.all([
          base44.entities.Match.filter({ user_a_id: user.id }),
          base44.entities.Match.filter({ user_b_id: user.id }),
        ]);
        const allMatches = [...matchesA, ...matchesB];
        // Consider unread if any match has a recent message (last 5 min) and we're not on matches page
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        const hasNew = allMatches.some(m => m.last_message_at && new Date(m.last_message_at).getTime() > fiveMinAgo);
        setHasUnread(hasNew && !location.pathname.startsWith('/matches'));
      } catch {}
    };
    checkUnread();
    // Subscribe to new messages
    const unsub = base44.entities.Message.subscribe(() => checkUnread());
    return unsub;
  }, [location.pathname]);

  return (
    <div className="flex flex-col max-w-md mx-auto" style={{ minHeight: '100dvh', background: '#F8FFFE' }}>
      {/* Main content */}
      <div className={`flex-1 flex flex-col ${hideTabs ? 'overflow-hidden' : 'overflow-hidden pb-20'}`}>
        <Outlet />
      </div>

      {/* Bottom tab bar */}
      {!hideTabs && (
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 safe-area-bottom z-40"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}
        >
          <div className="flex">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
              return (
                <NavLink
                  key={path}
                  to={path}
                  className="flex-1 flex flex-col items-center py-3 gap-1 transition-colors"
                >
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                      style={isActive ? { background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.tealDark})`, boxShadow: `0 4px 12px ${theme.colors.teal}40` } : {}}
                    >
                      <Icon
                        className="w-5 h-5 transition-colors"
                        style={{ color: isActive ? 'white' : '#9CA3AF' }}
                      />
                    </div>
                    {path === '/matches' && hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" />
                    )}
                  </div>
                  <span
                    className="text-xs font-semibold transition-colors"
                    style={{ color: isActive ? theme.colors.teal : '#9CA3AF' }}
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