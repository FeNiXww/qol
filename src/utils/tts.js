import { base44 } from '@/api/base44Client';

// Languages supported by the GenerateSpeech service (Hebrew is NOT supported)
const SUPPORTED_LANGS = ['ar', 'bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fil', 'fr', 'hi', 'hr', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'tr', 'uk', 'zh'];

function getVoices() {
  const voices = window.speechSynthesis?.getVoices() || [];
  if (voices.length) return Promise.resolve(voices);
  return new Promise(resolve => {
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
  });
}

async function speakWithBrowser(text, lang) {
  const voices = await getVoices();
  const voice = voices.find(v => v.lang?.toLowerCase().startsWith(lang));
  if (!voice) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export default async function generateTTS(text, languageCode) {
  if (!text?.trim()) return;

  // Hebrew (and other unsupported languages): prefer the device's native voice
  if (languageCode && !SUPPORTED_LANGS.includes(languageCode)) {
    const spoken = await speakWithBrowser(text, languageCode);
    if (spoken) return;
  }

  const { url } = await base44.integrations.Core.GenerateSpeech({
    text,
    voice: 'river',
    ...(languageCode && SUPPORTED_LANGS.includes(languageCode) ? { language_code: languageCode } : {}),
  });
  const audio = new Audio(url);
  await audio.play();
}