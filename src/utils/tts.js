export async function generateTTS(text, language) {
  const { base44 } = await import('@/api/base44Client');
  const { data } = await base44.functions.invoke('generateSpeech', { text, language });
  if (!data?.audioContent) throw new Error('TTS returned no audio');
  return { audioContent: data.audioContent };
}

export default generateTTS;