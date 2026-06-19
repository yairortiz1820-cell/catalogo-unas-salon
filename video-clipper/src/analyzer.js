const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function findViralMoments(transcript) {
  const segments = transcript.segments
    .map(s => `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s] ${s.text.trim()}`)
    .join('\n');

  const totalDuration = transcript.segments[transcript.segments.length - 1]?.end || 0;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Eres un experto en contenido viral para redes sociales. Analiza esta transcripción de un video de YouTube y encuentra los 3-5 mejores momentos con alto potencial viral para TikTok, YouTube Shorts e Instagram Reels.

Criterios de selección:
- Gancho fuerte en los primeros 3 segundos del clip
- Contenido autónomo (se entiende sin ver el resto del video)
- Duración entre 30 y 90 segundos
- Genera emoción: sorpresa, humor, valor práctico, inspiración o curiosidad
- Tiene un final satisfactorio o que deja con ganas de más

TRANSCRIPCIÓN (${totalDuration.toFixed(0)}s total):
${segments}

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra:
{
  "momentos": [
    {
      "inicio": 12.5,
      "fin": 78.3,
      "titulo": "Título corto e impactante",
      "razon": "Por qué tiene potencial viral",
      "gancho": "Primeras palabras del clip que enganchan al espectador"
    }
  ]
}`
    }]
  });

  const text = message.content[0].text.trim();
  const jsonText = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(jsonText);
  return parsed.momentos;
}

module.exports = { findViralMoments };
