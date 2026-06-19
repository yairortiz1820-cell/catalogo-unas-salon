const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

async function createClips(videoPath, moments, outputDir) {
  const clips = [];

  for (let i = 0; i < moments.length; i++) {
    const moment = moments[i];
    const safeName = moment.titulo
      .replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ ]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 30);
    const filename = `clip_${i + 1}_${safeName}.mp4`;
    const outputPath = path.join(outputDir, filename);
    const duration = moment.fin - moment.inicio;

    await cutAndConvertTo916(videoPath, moment.inicio, duration, outputPath);

    clips.push({
      filename,
      titulo: moment.titulo,
      razon: moment.razon,
      gancho: moment.gancho,
      duracion: Math.round(duration)
    });
  }

  return clips;
}

function cutAndConvertTo916(inputPath, startTime, duration, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(startTime)
      .setDuration(duration)
      .complexFilter([
        // Split el video en dos copias
        '[0:v]split=2[v1][v2]',
        // Fondo: escalar para rellenar 1080x1920 y aplicar blur
        '[v1]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bg]',
        // Video principal: escalar para caber en 1080x1920 manteniendo proporción
        '[v2]scale=1080:-2[fg]',
        // Superponer video sobre fondo difuminado centrado
        '[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1[out]'
      ], 'out')
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-preset fast',
        '-crf 23',
        '-movflags +faststart',
        '-map 0:a'
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', (err) => reject(new Error(`Error FFmpeg: ${err.message}`)))
      .run();
  });
}

module.exports = { createClips };
