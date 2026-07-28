import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';

// Notifications trigger button, styled identically to the header Settings button.
export default function NotificationsBell() {
  const { pendingCount, openPanel } = useNotifications();
  return (
    <button
      onClick={openPanel}
      className="relative w-9 h-9 rounded-full flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
    >
      <Bell className="w-4 h-4 text-white/80" />
      {pendingCount > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ background: '#FA7C27' }}
        >
          {pendingCount}
        </span>
      )}
    </button>
  );
}