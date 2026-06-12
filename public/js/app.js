const WA = '573001234567';
let servicioActual = null;
let stars = 0;
let catActual = 'Todos';
let busqueda = '';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initReveal();
  cargarServicios();
  cargarResenas();
  setWA();
});

/* NAVBAR scroll */
function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60));
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });
}

/* Reveal on scroll */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* WA links */
function setWA() {
  const msg = encodeURIComponent('Hola! Me gustaría información sobre sus servicios de uñas 💅');
  const url = `https://wa.me/${WA}?text=${msg}`;
  document.getElementById('waFloat').href = url;
  const fw = document.getElementById('footerWA');
  if (fw) fw.href = url;
}

/* ── SERVICIOS ──────────────────────────────────────── */
async function cargarServicios() {
  const grid = document.getElementById('serviciosGrid');
  grid.innerHTML = '<div class="loading-state">Cargando servicios...</div>';
  try {
    const p = new URLSearchParams();
    if (catActual !== 'Todos') p.append('categoria', catActual);
    if (busqueda) p.append('buscar', busqueda);
    const r = await fetch(`/api/servicios?${p}`);
    const data = await r.json();
    if (!data.length) { grid.innerHTML = '<div class="empty-state"><p style="font-size:2rem">🔍</p><p>Sin resultados</p></div>'; return; }
    grid.innerHTML = data.map(renderCard).join('');
    // Re-observe nuevas cards
    grid.querySelectorAll('.serv-card').forEach((el, i) => {
      el.style.opacity = '0'; el.style.transform = 'translateY(30px)';
      setTimeout(() => { el.style.transition = 'opacity .5s ease, transform .5s ease'; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, i * 80);
    });
  } catch { grid.innerHTML = '<div class="empty-state"><p>Error al cargar. Verifica la conexión.</p></div>'; }
}

function renderCard(s) {
  return `
  <div class="serv-card" onclick="abrirModal('${s._id}')">
    <div class="serv-img-wrap">
      ${s.imagen
        ? `<img src="${s.imagen}" alt="${s.nombre}" loading="lazy" onerror="this.outerHTML='<div class=serv-img-placeholder>${ico(s.categoria)}</div>'">`
        : `<div class="serv-img-placeholder">${ico(s.categoria)}</div>`}
      <div class="serv-overlay"><div class="serv-overlay-text">Ver detalles →</div></div>
      <div class="serv-badge">${s.categoria}</div>
    </div>
    <div class="serv-body">
      <div class="serv-nombre">${s.nombre}</div>
      <div class="serv-desc">${s.descripcion}</div>
      <div class="serv-footer">
        <div class="serv-precio">${fmt(s.precio)}</div>
        <div class="serv-meta">
          <div class="serv-estrellas">${s.calificacion_promedio > 0 ? '★'.repeat(Math.round(s.calificacion_promedio)) + ' ' + s.calificacion_promedio.toFixed(1) : 'Nuevo'}</div>
          <div class="serv-duracion">⏱ ${s.duracion} min</div>
        </div>
      </div>
    </div>
  </div>`;
}

function filtrar(cat, btn) {
  catActual = cat;
  document.querySelectorAll('.filtro-pill').forEach(b => b.classList.remove('activo'));
  btn.classList.add('activo');
  cargarServicios();
}

function buscarServicios() {
  busqueda = document.getElementById('buscador').value;
  clearTimeout(window._bt);
  window._bt = setTimeout(cargarServicios, 380);
}

/* ── MODAL ──────────────────────────────────────────── */
async function abrirModal(id) {
  try {
    const r = await fetch(`/api/servicios/${id}`);
    const s = await r.json();
    servicioActual = s;

    document.getElementById('modalImgWrap').innerHTML = s.imagen
      ? `<img class="modal-img" src="${s.imagen}" alt="${s.nombre}" onerror="this.outerHTML='<div class=modal-img-placeholder>${ico(s.categoria)}</div>'"><button class="modal-close-btn" onclick="cerrarModal()">✕</button>`
      : `<div class="modal-img-placeholder">${ico(s.categoria)}</div><button class="modal-close-btn" onclick="cerrarModal()">✕</button>`;

    document.getElementById('modalTag').textContent = s.categoria;
    document.getElementById('modalTitulo').textContent = s.nombre;
    document.getElementById('modalPrecio').textContent = fmt(s.precio);
    document.getElementById('modalDesc').textContent = s.descripcion;
    document.getElementById('modalDuracion').textContent = `${s.duracion} minutos`;
    document.getElementById('modalCal').textContent = s.calificacion_promedio > 0 ? `${s.calificacion_promedio.toFixed(1)} (${s.total_calificaciones} reseñas)` : 'Sé la primera en calificar';

    const msg = encodeURIComponent(`Hola! Me interesa el servicio: *${s.nombre}* — Precio: ${fmt(s.precio)}. ¿Tienen disponibilidad?`);
    document.getElementById('modalWA').href = `https://wa.me/${WA}?text=${msg}`;

    stars = 0; document.getElementById('calNombre').value = ''; document.getElementById('calTexto').value = '';
    paintStars(0);
    await loadCals(id);

    document.getElementById('modalOverlay').classList.add('activo');
    document.body.style.overflow = 'hidden';
  } catch(e) { console.error(e); }
}

async function loadCals(id) {
  const el = document.getElementById('modalCalsLista');
  try {
    const r = await fetch(`/api/calificaciones/servicio/${id}`);
    const cals = await r.json();
    if (!cals.length) { el.innerHTML = '<p style="color:var(--texto-claro);font-size:.85rem;margin-bottom:1rem">Aún sin calificaciones — ¡sé la primera! 🌟</p>'; return; }
    el.innerHTML = `<div class="cal-grid">${cals.map(c => `
      <div class="cal-card">
        <div class="cal-card-header">
          <span class="cal-card-nombre">${c.cliente_nombre}</span>
          <span class="cal-card-stars">${'★'.repeat(c.estrellas)}</span>
        </div>
        ${c.comentario ? `<div class="cal-card-texto">"${c.comentario}"</div>` : ''}
        ${c.respuesta_admin ? `<div class="cal-respuesta">Respuesta: ${c.respuesta_admin}</div>` : ''}
      </div>`).join('')}</div>`;
  } catch { el.innerHTML = ''; }
}

function cerrarModal() {
  document.getElementById('modalOverlay').classList.remove('activo');
  document.body.style.overflow = '';
  servicioActual = null;
}
function cerrarModalClick(e) { if (e.target === document.getElementById('modalOverlay')) cerrarModal(); }

/* Estrellas */
function pickStar(n) { stars = n; paintStars(n); }
function paintStars(n) {
  document.querySelectorAll('#starRow span').forEach((s, i) => s.classList.toggle('on', i < n));
}

async function enviarCal() {
  const nombre = document.getElementById('calNombre').value.trim();
  const texto = document.getElementById('calTexto').value.trim();
  if (!nombre) return alert('Ingresa tu nombre');
  if (!stars) return alert('Selecciona una calificación');
  try {
    const r = await fetch('/api/calificaciones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ servicio_id: servicioActual._id, cliente_nombre: nombre, estrellas: stars, comentario: texto })
    });
    if (r.ok) { alert('¡Gracias! Tu reseña está pendiente de aprobación 🌟'); document.getElementById('calNombre').value = ''; document.getElementById('calTexto').value = ''; stars = 0; paintStars(0); }
    else { const d = await r.json(); alert(d.error || 'Error'); }
  } catch { alert('Error de conexión'); }
}

/* ── RESEÑAS ────────────────────────────────────────── */
async function cargarResenas() {
  const grid = document.getElementById('resenasGrid');
  try {
    const r = await fetch('/api/servicios');
    const servs = await r.json();
    let all = [];
    for (const s of servs.slice(0, 5)) {
      const rc = await fetch(`/api/calificaciones/servicio/${s._id}`);
      const cals = await rc.json();
      cals.forEach(c => { c._servNombre = s.nombre; });
      all = all.concat(cals);
    }
    all = all.filter(c => c.comentario).slice(0, 6);
    if (!all.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = all.map(c => `
      <div class="resena-card">
        <div class="resena-stars">${'★'.repeat(c.estrellas)}</div>
        <div class="resena-texto">"${c.comentario}"</div>
        <div class="resena-autor">
          <div class="resena-avatar">${c.cliente_nombre[0]}</div>
          <div>
            <div class="resena-nombre">${c.cliente_nombre}</div>
            <div class="resena-serv">${c._servNombre}</div>
          </div>
        </div>
      </div>`).join('');
  } catch { grid.innerHTML = ''; }
}

/* ── UTILS ──────────────────────────────────────────── */
function fmt(n) { return new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(n); }
function ico(cat) { return { 'Acrílicas':'💅','Manicure':'✨','Pedicure':'🦶','Gel':'💎','Diseño':'🎨','Spa':'🌸' }[cat] || '💅'; }
