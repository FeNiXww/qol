// Browser-based text-to-speech using the Web Speech API (SpeechSynthesis).
//
// Why not the server GenerateSpeech integration?
//  - Its language_code enum rejects Hebrew ('he' / 'iw' / 'he-IL' all fail
//    validation), so Hebrew had no working path.
//  - It consumes integration credits and trips rate limits under load.
// The browser SpeechSynthesis API natively supports Hebrew (he-IL), Arabic
// (ar), and English, works offline, and is the recommended approach for
// in-page playback.
//
// IMPORTANT for iOS: speechSynthesis.speak() must run synchronously inside
// the user-gesture call stack. Any `await` before .speak() can break the
// gesture chain and the utterance never plays. Kant off voice resolution —
// it doesn't block playback; the browser will pick a default voice if none
// is matched yet.

const LANG_MAP = {
  he: 'he-IL',
  ar: 'ar-SA',
  en: 'en-US',
};

let cachedVoices = null;

export function getVoices() {
  if (cachedVoices && cachedVoices.length) return cachedVoices;
  const v = window.speechSynthesis?.getVoices?.() || [];
  if (v.length) cachedVoices = v;
  return v;
}

// Voices load asynchronously in some browsers.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

function pickVoice(lang) {
  const voices = getVoices();
  if (!voices.length) return null;
  const base = lang.slice(0, 2).toLowerCase();
  return (
    voices.find((x) => x.lang === lang) ||
    voices.find((x) => x.lang?.toLowerCase().startsWith(base)) ||
    null
  );
}

export default function generateTTS(text, language) {
  if (!text) return Promise.resolve();
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return Promise.reject(new Error('Speech synthesis not supported'));
  }

  const targetLang = LANG_MAP[language] || LANG_MAP.en;

  // Synchronously build + speak so we stay inside the tap's gesture stack.
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = targetLang;
  const voice = pickVoice(targetLang);
  if (voice) utter.voice = voice;
  utter.rate = 0.95;
  utter.pitch = 1;

  return new Promise((resolve) => {
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    // Some browsers pause the queue if not resumed; resume defensively.
    try { window.speechSynthesis.resume(); } catch {}
    window.speechSynthesis.speak(utter);
  });
}