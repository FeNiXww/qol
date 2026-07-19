import { base44 } from '@/api/base44Client';

const LANG_NAMES = { he: 'Hebrew', ar: 'Arabic', en: 'English' };

export async function translateText(text, fromLang, toLang) {
  if (!text?.trim()) return text;
  if (fromLang === toLang) return text;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a strict translator between ${LANG_NAMES[fromLang] || fromLang} and ${LANG_NAMES[toLang] || toLang}.

Translate the following message from ${LANG_NAMES[fromLang] || fromLang} to ${LANG_NAMES[toLang] || toLang}:

"""${text}"""

Rules:
- If the message is meaningful text (in ${LANG_NAMES[fromLang] || fromLang} or any recognizable language), set "translatable" to true and provide an accurate translation in ${LANG_NAMES[toLang] || toLang}.
- If the message is gibberish, random keyboard characters, or has no recognizable meaning in any language, set "translatable" to false and leave "translation" empty. Do NOT transliterate gibberish.`,
    response_json_schema: {
      type: 'object',
      properties: {
        translatable: { type: 'boolean' },
        translation: { type: 'string' },
      },
      required: ['translatable'],
    },
  });

  if (!result?.translatable || !result.translation?.trim()) {
    throw new Error('TRANSLATION_FAILED');
  }
  return result.translation.trim();
}

export function getNativeLang(nationality) {
  return nationality === 'israeli' ? 'he' : 'ar';
}