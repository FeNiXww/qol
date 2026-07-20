import { base44 } from '@/api/base44Client';

const LANG_NAMES = { he: 'Hebrew', ar: 'Arabic', en: 'English' };

// True if the message contains no letters/words — only emojis, symbols, numbers, punctuation
function isEmojiOnly(text) {
  const withoutEmoji = text.replace(/\p{Extended_Pictographic}|\p{Emoji_Component}|\u200D|\uFE0F/gu, '');
  return !/\p{L}/u.test(withoutEmoji);
}

export async function translateText(text, fromLang, toLang) {
  if (!text?.trim()) return text;
  if (fromLang === toLang) return text;
  // Emoji-only messages (e.g. "😂😂", "👍!") need no translation
  if (isEmojiOnly(text)) return text;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a strict translator between ${LANG_NAMES[fromLang] || fromLang} and ${LANG_NAMES[toLang] || toLang}.

Translate the following message from ${LANG_NAMES[fromLang] || fromLang} to ${LANG_NAMES[toLang] || toLang}:

"""${text}"""

Rules:
- If the message is meaningful text (in ${LANG_NAMES[fromLang] || fromLang} or any recognizable language), set "translatable" to true and provide an accurate translation in ${LANG_NAMES[toLang] || toLang}.
- Emojis are always meaningful: keep every emoji exactly as-is, in its original position relative to the translated text. A message mixing text and emojis is translatable — translate the words and preserve the emojis.
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

// Phonetic transcriptions so speakers of one language can read the other aloud.
// Returns { translit_he, translit_ar } — never throws (returns empty strings on failure).
export async function getTransliterations(textHe, textAr) {
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Given this Hebrew word/phrase and its Arabic translation:
Hebrew: """${textHe}"""
Arabic: """${textAr}"""

Provide phonetic transcriptions so each side can pronounce the other's word:
- "translit_he": the pronunciation of the HEBREW word "${textHe}", written ONLY in ARABIC letters (so an Arabic speaker can read it aloud). It must NOT contain any Hebrew letters.
- "translit_ar": the pronunciation of the ARABIC word "${textAr}", written ONLY in HEBREW letters (so a Hebrew speaker can read it aloud). It must NOT contain any Arabic letters.

Example: Hebrew "שלום" → translit_he: "شالوم". Arabic "مرحبا" → translit_ar: "מרחבא".
Keep them short and phonetic, no explanations.`,
      response_json_schema: {
        type: 'object',
        properties: {
          translit_he: { type: 'string' },
          translit_ar: { type: 'string' },
        },
        required: ['translit_he', 'translit_ar'],
      },
    });
    let translitHe = result?.translit_he?.trim() || '';
    let translitAr = result?.translit_ar?.trim() || '';
    // Validate scripts: translit_he must be Arabic letters, translit_ar must be Hebrew letters
    if (/[\u0590-\u05FF]/.test(translitHe)) translitHe = '';
    if (/[\u0600-\u06FF]/.test(translitAr)) translitAr = '';
    return {
      translit_he: translitHe,
      translit_ar: translitAr,
    };
  } catch {
    return { translit_he: '', translit_ar: '' };
  }
}

export function getNativeLang(nationality) {
  return nationality === 'israeli' ? 'he' : 'ar';
}