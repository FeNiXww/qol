export async function generateTTS(text, language) {
  const API_KEY = Deno.env.get("INWORLD_API_KEY");

  const VOICE_BY_LANGUAGE = {
    "en": "Dennis", "fr": "Alain", "de": "Johanna", "es": "Miguel",
    "ja": "Ryo", "zh": "Yifan", "ko": "Jimin", "he": "Etan", "ar": "Omar",
  };
  const voiceId = VOICE_BY_LANGUAGE[language] || "Dennis";

  const response = await fetch("https://api.inworld.ai/tts/v1/voice", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voiceId,
      modelId: "inworld-tts-2",
      language,
      audioConfig: { audioEncoding: "MP3", sampleRateHertz: 24000 },
      applyTextNormalization: "ON",
    }),
  });

  if (!response.ok) {
    throw new Error(`Inworld TTS request failed: ${response.status} ${await response.text()}`);
  }

  const { audioContent } = await response.json();
  return { audioContent }; 
}

export default generateTTS;