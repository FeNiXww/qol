import { InworldTTS } from '@inworld/tts';


export default async function generateTTS(text) {
  const tts = InworldTTS();
  const audio = await tts.generate({
    text: text,
    voice: 'Ashley',
});
}