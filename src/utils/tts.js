import { base44 } from '@/api/base44Client';

export async function generateTTS(text, language) {
  const { data } = await base44.functions.invoke('generateSpeech', { text, language });

  if (data?.error) {
    throw new Error(data.error);
  }

  const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
  await audio.play();

  return audio;
}

export default generateTTS;