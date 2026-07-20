import { InworldTTS } from '@inworld/tts';


export default async function generateTTS(text, lang) {
  const tts = InworldTTS();
  const audio = await tts.generate({
    text: text,
    voice: 'Ashley',
    language: lang
  });
  return audio;
}