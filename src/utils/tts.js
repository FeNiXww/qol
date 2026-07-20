import { base44 } from '@/api/base44Client';

export default async function generateTTS(text, lang) {
  if (!text?.trim()) return;
  const { data } = await base44.functions.invoke('generateSpeech', { text, lang });
  if (!data?.audio) throw new Error(data?.error || 'TTS failed');
  const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
  await audio.play();
  await new Promise((resolve) => {
    audio.onended = resolve;
    audio.onerror = resolve;
  });
}