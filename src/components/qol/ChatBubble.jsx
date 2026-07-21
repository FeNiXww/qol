import React, { useState, useRef } from 'react';
import { theme } from '@/lib/theme';
import { format } from 'date-fns';
import { Languages, Flag, X, BookPlus, Loader2, Mic, MoreHorizontal } from 'lucide-react';
import { useDictT } from '@/lib/dictionaryI18n';
import generateTTS from '@/utils/tts';

function isImageUrl(text) {
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(text?.trim());
}

export default function ChatBubble({ message, isMine, onReport, onAddWord, translationOn = true }) {
  const dt = useDictT();
  const [showOriginal, setShowOriginal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bubbleRef = useRef(null);

  const handleSpeak = async (e) => {
  e?.stopPropagation();
  if (speaking) return;
  setSpeaking(true);
  try {
    await generateTTS(message.original_text, message.original_lang);
  } catch (err) {
    console.error("TTS failed:", err);
  } finally {
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

  const actionColor = '#6B7280'; 

  return (
    <>
      {/* lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <img
            src={message.original_text}
            alt="sent image"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
        </div>
      )}

      {/* actions modal anchored next to bubble */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowModal(false)}
          />
          <div

            className={`fixed z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 min-w-[180px] ${
              isMine ? (bubbleRef.current ? bubbleRef.current.offsetWidth + 16 : 16 ): (bubbleRef.current ? window.innerWidth - bubbleRef.current.getBoundingClientRect().right + 16 : 16)
            }`}
            style={{
              top: bubbleRef.current
                ? bubbleRef.current.getBoundingClientRect().top + window.scrollY + bubbleRef.current.offsetHeight / 2
                : '50%',

            }}
          >
            {/* TTS */}
            <button
              onClick={() => { setShowModal(false); handleSpeak(); }}
              disabled={speaking}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {speaking
                ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: actionColor }} />
                : <Mic className="w-4 h-4" style={{ color: actionColor }} />
              }
              <span className="text-sm" style={{ color: actionColor }}>
                {speaking ? 'Playing...' : 'Listen'}
              </span>
            </button>

            {/* Translation toggle */}
            {!isMine && subText && (
              <button
                onClick={() => { setShowOriginal(p => !p); setShowModal(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <Languages className="w-4 h-4" style={{ color: actionColor }} />
                <span className="text-sm" style={{ color: actionColor }}>
                  {showOriginal ? 'Hide original' : 'See original'}
                </span>
              </button>
            )}

            {/* Add to dictionary */}
            {message.translated_text && (
              <>
                <div className="h-px bg-gray-100 mx-2" />
                <button
                  onClick={() => { setShowModal(false); onAddWord?.(message); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <BookPlus className="w-4 h-4" style={{ color: actionColor }} />
                  <span className="text-sm" style={{ color: actionColor }}>{dt.addToDictionary}</span>
                </button>
              </>
            )}

            {/* Report */}
            {!isMine && (
              <>
                <div className="h-px bg-gray-100 mx-2" />
                <button
                  onClick={() => { setShowModal(false); onReport?.(message); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-red-50 transition-colors"
                >
                  <Flag className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">Report</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
      
      {/* bubble */}
      <div className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[78%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          <div
            ref={bubbleRef}
            className={`rounded-2xl shadow-sm cursor-pointer overflow-hidden ${
              isMine
                ? 'rounded-br-sm text-white'
                : 'rounded-bl-sm bg-white text-gray-800 border border-gray-100'
            } ${isFailed ? 'opacity-60' : ''} ${isImage ? 'p-1' : 'px-4 py-3'}`}
            style={
              isMine && !isImage
                ? { backgroundColor: isFailed ? '#9CA3AF' : theme.colors.teal }
                : isMine && isImage
                ? { backgroundColor: theme.colors.teal }
                : {}
            }
            onClick={() => isImage ? setLightbox(true) : setShowModal(p => !p)}
          >
            {isImage ? (
              <img
                src={message.original_text}
                alt="sent image"
                className="rounded-xl max-w-[200px] max-h-[200px] object-cover"
              />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-sm leading-relaxed flex-1" dir={isRTL ? 'rtl' : 'ltr'}>
                    {isSending ? <span className="opacity-70">{mainText}</span> : mainText}
                  </p>
                  {/* subtle indicator that message is tappable */}
                  <MoreHorizontal
                    className={`w-4 h-4 flex-shrink-0 opacity-40 ${isMine ? 'text-white' : 'text-gray-400'}`}
                  />
                </div>

                {/* original text shown inline when toggled */}
                {!isMine && subText && showOriginal && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p
                      className="text-xs text-gray-400 leading-relaxed italic"
                      dir={message.original_lang === 'he' || message.original_lang === 'ar' ? 'rtl' : 'ltr'}
                    >
                      {subText}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* time + status */}
            <div
              className={`flex items-center gap-1 mt-1.5 ${isMine ? 'justify-end' : 'justify-start'} ${isImage ? 'px-2 pb-1' : ''}`}
            >
              {isFailed && <span className="text-xs text-red-300">Failed</span>}
              {isSending && (
                <span className={`text-xs ${isMine ? 'text-white/50' : 'text-gray-300'}`}>Sending…</span>
              )}
              {!isFailed && !isSending && (
                <span className={`text-xs opacity-50 ${isMine ? 'text-white' : 'text-gray-400'}`}>{time}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}