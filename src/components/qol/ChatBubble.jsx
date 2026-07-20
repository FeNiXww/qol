import React, { useState } from 'react';
import { theme } from '@/lib/theme';
import { format } from 'date-fns';
import { Languages, Flag, X, BookPlus, Loader2 } from 'lucide-react';
import { useDictT } from '@/lib/dictionaryI18n';
import generateTTS from '@/utils/tts';
import QolLogo from '@/components/qol/QolLogo';

function isImageUrl(text) {
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(text?.trim());
}

export default function ChatBubble({ message, isMine, onReport, onAddWord, translationOn = true }) {
  const dt = useDictT();
  const [showOriginal, setShowOriginal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = async (e) => {
    e.stopPropagation();
    if (speaking) return;
    setSpeaking(true);
    try {
      const { audioContent } = await generateTTS(message.original_text, message.original_lang);
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      await audio.play();
      return audio;
    } 
    finally {
      setSpeaking(false);
    }
  };

  const isImage = isImageUrl(message.original_text);

  const mainText = isMine
    ? message.original_text
    : (translationOn ? (message.translated_text || message.original_text) : message.original_text);
  const subText = !isMine && translationOn && message.translated_text ? message.original_text : null;
  const mainLang = isMine ? message.original_lang : (translationOn ? (message.translated_lang || message.original_lang) : message.original_lang);
  const isRTL = mainLang === 'he' || mainLang === 'ar';
  const time = message.created_date ? format(new Date(message.created_date), 'HH:mm') : '';
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';

  return (
    <>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <img src={message.original_text} alt="sent image" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
      <div className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[78%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          <div
            className={`rounded-2xl shadow-sm cursor-pointer overflow-hidden ${
              isMine
                ? 'rounded-br-sm text-white'
                : 'rounded-bl-sm bg-white text-gray-800 border border-gray-100'
            } ${isFailed ? 'opacity-60' : ''} ${isImage ? 'p-1' : 'px-4 py-3'}`}
            style={isMine && !isImage ? { backgroundColor: isFailed ? '#9CA3AF' : theme.colors.teal } : (isMine && isImage ? { backgroundColor: theme.colors.teal } : {})}
            onMouseEnter={() => !isMine && setHovered(true)}
            onMouseLeave={() => !isMine && setHovered(false)}
            onClick={() => isImage ? setLightbox(true) : setShowActions(p => !p)}
          >
            {isImage ? (
              <img src={message.original_text} alt="sent image" className="rounded-xl max-w-[200px] max-h-[200px] object-cover" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-sm leading-relaxed flex-1" dir={isRTL ? 'rtl' : 'ltr'}>
                    {isSending ? <span className="opacity-70">{mainText}</span> : mainText}
                  </p>
                  {!isMine && (
                    <button
                      onClick={handleSpeak}
                      disabled={speaking}
                      className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all disabled:opacity-70"
                      title="Listen"
                    >
                      {speaking
                        ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.colors.teal }} />
                        : <QolLogo size={16} blend />}
                    </button>
                  )}
                </div>

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
              </>
            )}

            {/* Time + status */}
            <div className={`flex items-center gap-1 mt-1.5 ${isMine ? 'justify-end' : 'justify-start'} ${isImage ? 'px-2 pb-1' : ''}`}>
              {isFailed && <span className="text-xs text-red-300">Failed</span>}
              {isSending && <span className={`text-xs ${isMine ? 'text-white/50' : 'text-gray-300'}`}>Sending…</span>}
              {!isFailed && !isSending && (
                <span className={`text-xs opacity-50 ${isMine ? 'text-white' : 'text-gray-400'}`}>{time}</span>
              )}
            </div>
          </div>

          {/* Actions — appear when tapping a message */}
          {showActions && !isImage && (
            <div className={`flex items-center gap-2 mt-1 ${isMine ? 'flex-row-reverse' : ''}`}>
              {message.translated_text && (
                <button
                  onClick={() => { setShowActions(false); onAddWord?.(message); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-teal-50 transition-colors"
                  style={{ color: theme.colors.teal }}
                >
                  <BookPlus className="w-3 h-3" /> {dt.addToDictionary}
                </button>
              )}
              {!isMine && (
                <button
                  onClick={() => { setShowActions(false); onReport?.(message); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Flag className="w-3 h-3" /> Report
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </>
  );
}