import React from 'react';
import { theme } from '@/lib/theme';
import { format } from 'date-fns';

export default function ChatBubble({ message, isMine }) {
  const displayText = isMine ? message.original_text : (message.translated_text || message.original_text);
  const lang = isMine ? message.original_lang : message.translated_lang;
  const isRTL = lang === 'he' || lang === 'ar';
  const time = message.created_date ? format(new Date(message.created_date), 'HH:mm') : '';

  return (
    <div className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[72%] px-4 py-3 rounded-2xl shadow-sm ${
          isMine
            ? 'rounded-br-sm text-white'
            : 'rounded-bl-sm bg-white text-gray-800'
        }`}
        style={isMine ? { backgroundColor: theme.colors.teal } : {}}
      >
        <p
          className={`text-sm leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {displayText}
        </p>
        <p className={`text-xs mt-1 opacity-60 ${isMine ? 'text-right' : 'text-left'}`}>
          {time}
        </p>
      </div>
    </div>
  );
}