import { base44 } from '@/api/base44Client';

const LANG_NAMES = { he: 'Hebrew', ar: 'Arabic' };

export async function translateText(text, fromLang, toLang) {
  if (!text?.trim()) return text;
  if (fromLang === toLang) return text;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following ${LANG_NAMES[fromLang]} text to ${LANG_NAMES[toLang]}. Return only the translated text, nothing else, no explanations.\n\nText: ${text}`,
      model: 'gemini_3_flash',
    });
    return typeof result === 'string' ? result.trim() : text;
  } catch (err) {
    console.warn('AI translation failed, using original:', err.message);
    return text;
  }
}

export function getNativeLang(nationality) {
  return nationality === 'israeli' ? 'he' : 'ar';
}