import { base44 } from '@/api/base44Client';

export default async function generateTTS(text, languageCode) {
  if (!text?.trim()) return;
  const { url } = await base44.integrations.Core.GenerateSpeech({
    text,
    voice: 'river',
    ...(languageCode ? { language_code: languageCode } : {}),
  });
  const audio = new Audio(url);
  await audio.play();
}