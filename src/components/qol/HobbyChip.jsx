import React from 'react';
import { theme } from '@/lib/theme';

export default function HobbyChip({ label, selected, onToggle, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 select-none ${
        selected
          ? 'border-transparent text-white shadow-md'
          : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={selected ? { backgroundColor: theme.colors.teal } : {}}
    >
      {label}
    </button>
  );
}