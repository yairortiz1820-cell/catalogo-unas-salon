const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 200 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

async function downloadVideo(url, outputDir) {
  const outputTemplate = path.join(outputDir, 'video.%(ext)s');
  await execPromise(
    `yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best[height<=1080]" --merge-output-format mp4 -o "${outputTemplate}" "${url}"`
  );

  const files = fs.readdirSync(outputDir).filter(f => f.startsWith('video.'));
  if (!files.length) throw new Error('No se pudo descargar el video. Verifica que la URL sea válida.');
  return path.join(outputDir, files[0]);
}

function extractAudio(videoPath, outputDir) {
  const audioPath = path.join(outputDir, 'audio.mp3');
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .audioCodec('libmp3lame')
      .audioBitrate('32k')
      .audioChannels(1)
      .output(audioPath)
      .on('end', () => resolve(audioPath))
      .on('error', reject)
      .run();
  });
}

module.exports = { downloadVideo, extractAudio };
