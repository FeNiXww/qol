// Text-to-speech via the Base44 Core.GenerateSpeech integration.
//
// Returns an MP3 URL and plays it through an <audio> element, which produces
// reliable audio on every device — unlike the browser SpeechSynthesis API,
// which silently does nothing when the device has no Hebrew/Arabic voice
// installed.
//
// Language handling:
//  - Arabic / English: pass an explicit language_code (supported by the
//    service).
//  - Hebrew: the service rejects 'he', so we omit language_code and rely on
//    its multilingual auto-detection (Hebrew script is detected reliably).

import { base44 } from '@/api/base44Client';

const VOICE = 'river';
const LANG_CODE = {
  ar: 'ar',
  en: 'en',
  // he intentionally omitted -> auto-detect
};

let currentAudio = null;

export default async function generateTTS(text, language) {
  if (!text) return;

  // Stop anything currently playing so repeated taps replay cleanly.
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const payload = { text, voice: VOICE };
  if (LANG_CODE[language]) payload.language_code = LANG_CODE[language];

  const res = await base44.integrations.Core.GenerateSpeech(payload);
  const url = res?.url;
  if (!url) throw new Error('No audio URL returned');

  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      reject(new Error('Audio playback failed'));
    };
    audio.play().catch((e) => {
      if (currentAudio === audio) currentAudio = null;
      reject(e);
    });
  });
}