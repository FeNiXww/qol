import { base44 } from '@/api/base44Client';

// The speech service only accepts a limited set of explicit language_code
// values (e.g. 'ar', 'en'). 'he' / 'iw' / 'he-IL' are all rejected with a
// validation error, so Hebrew must rely on the service's multilingual
// auto-detection (omit language_code entirely).
const SUPPORTED_CODES = { ar: 'ar', en: 'en' };

export default async function generateTTS(text, language) {
  const lang = SUPPORTED_CODES[language];

  const params = { text };
  if (lang) {
    params.language_code = lang;
    params.voice = 'river';
  }
  // Hebrew (and any other unsupported code) → let the service auto-detect.

  const { url } = await base44.integrations.Core.GenerateSpeech(params);

  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.addEventListener('ended', resolve);
    audio.addEventListener('error', reject);
    audio.play().catch(reject);
  });
}