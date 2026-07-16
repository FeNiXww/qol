import React from 'react';
import { theme } from '@/lib/theme';

export default function PrimaryButton({ children, onClick, disabled, loading, variant = 'teal', className = '' }) {
  const bg = variant === 'orange' ? theme.colors.orange : variant === 'navy' ? theme.colors.navy : theme.colors.teal;
  const hoverBg = variant === 'orange' ? theme.colors.orangeLight : variant === 'navy' ? theme.colors.navyLight : theme.colors.tealLight;

  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={`w-full py-4 rounded-2xl font-semibold text-white text-base transition-all duration-200 shadow-md active:scale-95 flex items-center justify-center gap-2 ${
        disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
      } ${className}`}
      style={{ backgroundColor: disabled || loading ? undefined : bg }}
    >
      {loading && (
        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}