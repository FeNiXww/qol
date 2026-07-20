import { base44 } from '@/api/base44Client';

// TTS via the generateSpeech backend function — the Inworld API key
// stays server-side (INWORLD_API_KEY env variable), never in the frontend.
export async function generateTTS(text, language) {
  if (!text?.trim()) return;
  const { data } = await base44.functions.invoke('generateSpeech', { text, language });
  if (!data?.audioContent) throw new Error(data?.error || 'TTS failed');
  const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
  await audio.play();
  await new Promise((resolve) => {
    audio.onended = resolve;
    audio.onerror = resolve;
  });
  return audio;
}

export default generateTTS;