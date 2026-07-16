import React, { useState } from 'react';
import { theme } from '@/lib/theme';
import { format } from 'date-fns';
import { Languages, Flag } from 'lucide-react';

export default function ChatBubble({ message, isMine, onReport }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [hovered, setHovered] = useState(false);

  const mainText = isMine ? message.original_text : (message.translated_text || message.original_text);
  const subText = !isMine && message.translated_text ? message.original_text : null;
  const mainLang = isMine ? message.original_lang : (message.translated_lang || message.original_lang);
  const isRTL = mainLang === 'he' || mainLang === 'ar';
  const time = message.created_date ? format(new Date(message.created_date), 'HH:mm') : '';
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';

  return (
    <div className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm cursor-pointer ${
            isMine
              ? 'rounded-br-sm text-white'
              : 'rounded-bl-sm bg-white text-gray-800 border border-gray-100'
          } ${isFailed ? 'opacity-60' : ''}`}
          style={isMine ? { backgroundColor: isFailed ? '#9CA3AF' : theme.colors.teal } : {}}
          onMouseEnter={() => !isMine && setHovered(true)}
          onMouseLeave={() => !isMine && setHovered(false)}
          onClick={() => !isMine && setShowActions(p => !p)}
        >
          <p className="text-sm leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
            {isSending ? <span className="opacity-70">{mainText}</span> : mainText}
          </p>

          {/* Translation toggle */}
          {!isMine && subText && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              {(hovered || showOriginal) && (
              <button
                onClick={e => { e.stopPropagation(); setShowOriginal(p => !p); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Languages className="w-3 h-3" />
                {showOriginal ? 'Hide original' : 'See original'}
              </button>
              )}
              {showOriginal && (
                <p
                  className="text-xs text-gray-400 mt-1 leading-relaxed italic"
                  dir={message.original_lang === 'he' || message.original_lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  {subText}
                </p>
              )}
            </div>
          )}

          {/* Time + status */}
          <div className={`flex items-center gap-1 mt-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {isFailed && <span className="text-xs text-red-300">Failed</span>}
            {isSending && <span className={`text-xs ${isMine ? 'text-white/50' : 'text-gray-300'}`}>Sending…</span>}
            {!isFailed && !isSending && (
              <span className={`text-xs opacity-50 ${isMine ? 'text-white' : 'text-gray-400'}`}>{time}</span>
            )}
          </div>
        </div>

        {/* Report action — appears when tapping a received message */}
        {!isMine && showActions && (
          <button
            onClick={() => { setShowActions(false); onReport?.(message); }}
            className="flex items-center gap-1 mt-1 px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-50 transition-colors"
          >
            <Flag className="w-3 h-3" /> Report
          </button>
        )}
      </div>
    </div>
  );
}