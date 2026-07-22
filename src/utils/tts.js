// Browser-based text-to-speech using the Web Speech API (SpeechSynthesis).
//
// Why not the server GenerateSpeech integration?
//  - Its language_code enum rejects Hebrew ('he' / 'iw' / 'he-IL' all fail
//    validation), so Hebrew had no working path.
//  - It consumes integration credits and trips rate limits under load.
// The browser SpeechSynthesis API natively supports Hebrew (he-IL), Arabic
// (ar), and English, works offline, and is the recommended approach for
// in-page playback.

const LANG_MAP = {
  he: 'he-IL',
  ar: 'ar-SA',
  en: 'en-US',
};

let cachedVoices = null;

function getVoices() {
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
  // exact match first, then same-language prefix, then same base lang
  let v = voices.find((x) => x.lang === lang)
    || voices.find((x) => x.lang?.toLowerCase().startsWith(lang.slice(0, 2)))
    || voices.find((x) => x.lang?.toLowerCase().startsWith(lang.slice(0, 2)));
  return v || null;
}

export default async function generateTTS(text, language) {
  if (!text) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    throw new Error('Speech synthesis not supported');
  }

  // Cancel anything currently speaking so taps replay cleanly.
  window.speechSynthesis.cancel();

  const targetLang = LANG_MAP[language] || LANG_MAP.en;

  // Make sure voices are loaded (they may arrive after first call).
  if (!getVoices().length) {
    await new Promise((res) => setTimeout(res, 150));
  }

  return new Promise((resolve, reject) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = targetLang;
    const voice = pickVoice(targetLang);
    if (voice) utter.voice = voice;
    utter.rate = 0.95;
    utter.pitch = 1;

    utter.onend = () => resolve();
    utter.onerror = (e) => reject(new Error(e?.error || 'Speech error'));

    window.speechSynthesis.speak(utter);
  });
}