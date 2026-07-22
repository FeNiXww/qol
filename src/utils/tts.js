// Browser Web Speech API TTS — free, no API key, works for Hebrew & Arabic
export default async function generateTTS(text, language) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    // Cancel any currently playing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Map language codes to BCP-47 locales
    if (language === 'he') {
      utterance.lang = 'he-IL';
    } else if (language === 'ar') {
      utterance.lang = 'ar-SA';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(new Error(e.error));

    window.speechSynthesis.speak(utterance);
  });
}