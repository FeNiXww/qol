import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Compass, MessageCircle, User } from 'lucide-react';
import { theme } from '@/lib/theme';

const navItems = [
  { path: '/', label: 'Discover', icon: Compass },
  { path: '/matches', label: 'Matches', icon: MessageCircle },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Layout() {
  const location = useLocation();
  // Don't show tab bar on chat screens
  const hideTabs = location.pathname.startsWith('/chat/');

  return (
    <div className="flex flex-col max-w-md mx-auto bg-gray-50" style={{ minHeight: '100dvh' }}>
      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${hideTabs ? '' : 'pb-20'}`}>
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
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                    style={isActive ? { background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.tealDark})`, boxShadow: `0 4px 12px ${theme.colors.teal}40` } : {}}
                  >
                    <Icon
                      className="w-5 h-5 transition-colors"
                      style={{ color: isActive ? 'white' : '#9CA3AF' }}
                    />
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