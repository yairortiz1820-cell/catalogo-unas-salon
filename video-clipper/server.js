require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { downloadVideo, extractAudio } = require('./src/downloader');
const { transcribeVideo } = require('./src/transcriber');
const { findViralMoments } = require('./src/analyzer');
const { createClips } = require('./src/editor');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const jobs = {};

function setJob(id, data) {
  jobs[id] = { ...jobs[id], ...data };
}

app.post('/api/process', (req, res) => {
  const { url } = req.body;

  if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
    return res.status(400).json({ error: 'Pega una URL válida de YouTube' });
  }

  const jobId = uuidv4();
  jobs[jobId] = {
    id: jobId,
    status: 'iniciando',
    step: 0,
    totalSteps: 4,
    message: 'Iniciando...',
    clips: [],
    error: null
  };

  res.json({ jobId });

  processVideo(jobId, url).catch(err => {
    setJob(jobId, { status: 'error', error: err.message });
    console.error(`[Job ${jobId}]`, err.message);
  });
});

app.get('/api/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  res.json(job);
});

app.get('/download/:jobId/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(OUTPUT_DIR, req.params.jobId, safeName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado' });
  res.download(filePath);
});

async function processVideo(jobId, url) {
  const jobDir = path.join(OUTPUT_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  setJob(jobId, { status: 'descargando', step: 1, message: '⬇️ Descargando video de YouTube...' });
  const videoPath = await downloadVideo(url, jobDir);

  setJob(jobId, { status: 'transcribiendo', step: 2, message: '🎙️ Extrayendo y transcribiendo audio...' });
  const audioPath = await extractAudio(videoPath, jobDir);
  const transcript = await transcribeVideo(audioPath);

  setJob(jobId, { status: 'analizando', step: 3, message: '🤖 IA detectando momentos virales...' });
  const moments = await findViralMoments(transcript);

  setJob(jobId, {
    status: 'editando',
    step: 4,
    message: `✂️ Creando ${moments.length} clips en formato vertical 9:16...`
  });
  const clips = await createClips(videoPath, moments, jobDir);

  setJob(jobId, {
    status: 'listo',
    step: 4,
    message: `✅ ¡${clips.length} clips listos para descargar!`,
    clips
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🎬 Video Clipper corriendo en http://localhost:${PORT}\n`);
  console.log(`Variables de entorno:`);
  console.log(`  OPENAI_API_KEY     ${process.env.OPENAI_API_KEY ? '✅' : '❌ faltante'}`);
  console.log(`  ANTHROPIC_API_KEY  ${process.env.ANTHROPIC_API_KEY ? '✅' : '❌ faltante'}`);
});
