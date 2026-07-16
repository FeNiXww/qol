export async function translateText(text, fromLang, toLang) {
  if (!text?.trim()) return text;
  if (fromLang === toLang) return text;

  const langPair = `${fromLang}|${toLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    throw new Error('Bad response from MyMemory');
  } catch (err) {
    console.warn('Translation failed, using original:', err.message);
    return text; // fallback: never block sending
  }
}

export function getNativeLang(nationality) {
  return nationality === 'israeli' ? 'he' : 'ar';
}