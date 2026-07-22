const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export default async function generateTTS(text, language) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.detail?.message || "ElevenLabs TTS failed");
  }

  // response is raw audio binary, not JSON
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);

  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    audio.addEventListener("ended", () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    });
    audio.addEventListener("error", reject);
    audio.play().catch(reject);
  });
}

export default generateTTS;