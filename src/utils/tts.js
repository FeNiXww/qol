import { base44 } from '@/api/base44Client';

export default async function generateTTS(text, language) {
  // Map language codes to BCP-47 for GenerateSpeech
  const langCodeMap = { he: 'he', ar: 'ar' };
  const langCode = langCodeMap[language] || 'en';

  const { url } = await base44.integrations.Core.GenerateSpeech({
    text,
    language_code: langCode,
    voice: 'river',
  });

  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.addEventListener('ended', resolve);
    audio.addEventListener('error', reject);
    audio.play().catch(reject);
  });
}