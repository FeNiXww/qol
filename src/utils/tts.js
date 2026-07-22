// Text-to-speech with a language split:
//  - Arabic / English: Base44 Core.GenerateSpeech integration -> returns an
//    MP3 played via <audio>. Reliable audio on every device.
//  - Hebrew: the server integration rejects every Hebrew language code and its
//    auto-detect misreads Hebrew, so there is no server path for Hebrew. We
//    use the browser SpeechSynthesis API instead, which pronounces Hebrew
//    natively when the device has a Hebrew voice installed (most phones do;
//    a desktop without a Hebrew voice will be silent).

import { base44 } from '@/api/base44Client';

const VOICE = 'river';
const SERVER_LANG = { ar: 'ar', en: 'en' };

let currentAudio = null;

function playServerAudio(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => { if (currentAudio === audio) currentAudio = null; resolve(); };
    audio.onerror = () => { if (currentAudio === audio) currentAudio = null; reject(new Error('Audio playback failed')); };
    audio.play().catch((e) => { if (currentAudio === audio) currentAudio = null; reject(e); });
  });
}

function speakHebrewInBrowser(text) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'he-IL';
  const voices = synth.getVoices() || [];
  const heVoice =
    voices.find((v) => v.lang?.toLowerCase() === 'he-il') ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('he'));
  if (heVoice) utter.voice = heVoice;
  utter.rate = 0.95;
  utter.pitch = 1;
  return new Promise((resolve) => {
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    synth.speak(utter);
  });
}

export default async function generateTTS(text, language) {
  if (!text) return;

  // Stop any currently playing audio/speech so repeated taps replay cleanly.
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (window.speechSynthesis) window.speechSynthesis.cancel();

  if (language === 'he') {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      throw new Error('Hebrew TTS requires browser speech support');
    }
    return speakHebrewInBrowser(text);
  }

  const res = await base44.integrations.Core.GenerateSpeech({
    text,
    voice: VOICE,
    language_code: SERVER_LANG[language] || 'en',
  });
  const url = res?.url;
  if (!url) throw new Error('No audio URL returned');
  return playServerAudio(url);
}