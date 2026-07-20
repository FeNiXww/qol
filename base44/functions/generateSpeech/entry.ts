import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { InworldTTS } from 'npm:@inworld/tts@1.1.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, lang } = await req.json();
    if (!text || !text.trim()) {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    const tts = InworldTTS({ apiKey: Deno.env.get('INWORLD_API_KEY') });
    const params = { text, voice: 'Ashley' };
    if (lang) params.language = lang;
    const audio = await tts.generate(params);

    // Encode audio bytes to base64
    const bytes = new Uint8Array(audio);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return Response.json({ audio: btoa(binary) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});