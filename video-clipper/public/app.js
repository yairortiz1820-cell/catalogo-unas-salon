let pollInterval = null;

async function startProcessing() {
  const urlInput = document.getElementById('url-input');
  const url = urlInput.value.trim();

  if (!url) {
    urlInput.focus();
    return;
  }

  document.getElementById('process-btn').disabled = true;
  show('progress-section');
  hide('input-section');
  hide('error-section');
  hide('clips-section');
  setActiveStep(1);

  try {
    const res = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    pollInterval = setInterval(() => checkStatus(data.jobId), 2500);
  } catch (err) {
    showError(err.message);
  }
}

async function checkStatus(jobId) {
  try {
    const res = await fetch(`/api/status/${jobId}`);
    const job = await res.json();

    document.getElementById('progress-message').textContent = job.message || '';
    setActiveStep(job.step || 0);

    if (job.status === 'listo') {
      clearInterval(pollInterval);
      showClips(job.clips, jobId);
    } else if (job.status === 'error') {
      clearInterval(pollInterval);
      showError(job.error);
    }
  } catch {
    clearInterval(pollInterval);
    showError('Error de conexión con el servidor. Recarga la página e intenta de nuevo.');
  }
}

function setActiveStep(current) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step-${i}`);
    el.classList.remove('active', 'done');
    if (i < current) el.classList.add('done');
    else if (i === current) el.classList.add('active');
  }
}

function showClips(clips, jobId) {
  hide('progress-section');
  show('clips-section');

  document.getElementById('clips-grid').innerHTML = clips.map((clip, i) => `
    <div class="clip-card">
      <div class="clip-header">
        <span class="clip-num">Clip ${i + 1}</span>
        <span class="clip-title">${escapeHtml(clip.titulo)}</span>
        <span class="clip-duration">⏱ ${clip.duracion}s</span>
      </div>
      <div class="clip-hook">🎯 "${escapeHtml(clip.gancho)}"</div>
      <p class="clip-reason">💡 ${escapeHtml(clip.razon)}</p>
      <a class="clip-download" href="/download/${jobId}/${encodeURIComponent(clip.filename)}">
        ⬇️ Descargar Clip ${i + 1}
      </a>
    </div>
  `).join('');
}

function showError(message) {
  hide('progress-section');
  show('error-section');
  document.getElementById('error-message').textContent = `❌ ${message}`;
}

function reset() {
  clearInterval(pollInterval);
  document.getElementById('url-input').value = '';
  document.getElementById('process-btn').disabled = false;
  show('input-section');
  hide('progress-section');
  hide('error-section');
  hide('clips-section');
  document.getElementById('progress-message').textContent = 'Iniciando...';
  setActiveStep(0);
}

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
