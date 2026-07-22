import { base44 } from '@/api/base44Client';

export default async function generateTTS(text, language) {
  const { data } = await base44.functions.generateSpeech({ text, language });

  if (data?.error) {
    throw new Error(data.error);
  }

  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
    audio.addEventListener("ended", resolve);
    audio.addEventListener("error", reject);
    audio.play().catch(reject);
  });
}