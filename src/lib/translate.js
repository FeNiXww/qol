export async function translateText(text, fromLang, toLang) {
  if (!text?.trim()) return text;
  if (fromLang === toLang) return text;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  const translated = data[0]?.map(chunk => chunk[0]).join('');
  if (!translated || !translated.trim()) {
    throw new Error('TRANSLATION_FAILED');
  }
  return translated.trim();
}

export function getNativeLang(nationality) {
  return nationality === 'israeli' ? 'he' : 'ar';
}