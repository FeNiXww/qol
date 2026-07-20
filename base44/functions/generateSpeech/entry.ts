import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const VOICE_BY_LANGUAGE = {
  en: 'Dennis',
  fr: 'Alain',
  de: 'Johanna',
  es: 'Miguel',
  ja: 'Satoshi',
  zh: 'Yichen',
  ko: 'Hyunwoo',
  he: 'Oren',
  ar: 'Omar',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, language } = await req.json();
    if (!text || !text.trim()) {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    const voiceId = VOICE_BY_LANGUAGE[language] || 'Dennis';

    const response = await fetch('https://api.inworld.ai/tts/v1/voice', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Deno.env.get('INWORLD_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceId,
        modelId: 'inworld-tts-2',
        language,
        audioConfig: {
          audioEncoding: 'MP3',
          sampleRateHertz: 24000,
        },
        applyTextNormalization: 'ON',
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return Response.json({ error: `Inworld TTS failed: ${response.status} ${details}` }, { status: 502 });
    }

    const { audioContent } = await response.json();
    return Response.json({ audioContent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});