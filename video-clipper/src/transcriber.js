const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeVideo(audioPath) {
  const stats = fs.statSync(audioPath);
  const fileSizeMB = stats.size / (1024 * 1024);

  if (fileSizeMB > 24) {
    throw new Error(`El audio pesa ${fileSizeMB.toFixed(1)}MB. El video es muy largo (máximo ~2 horas). Intenta con un video más corto.`);
  }

  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment']
  });

  return response;
}

module.exports = { transcribeVideo };
