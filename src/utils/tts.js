import { base44 } from '@/api/base44Client';

export default async function generateTTS(text) {
  if (!text?.trim()) return;
  const { url } = await base44.integrations.Core.GenerateSpeech({ text });
  const audio = new Audio(url);
  await audio.play();
}