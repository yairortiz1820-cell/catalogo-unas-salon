const WA = '573001234567';
let servicioActual = null, stars = 0, catActual = 'Todos', busqueda = '';

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initCursor();
  initNavbar();
  initReveal();
  initParticles();
  initHeroParallax();
  cargarServicios();
  cargarResenas();
  setWALinks();
});

/* ── PARTÍCULAS ── */
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 35; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left:${Math.random()*100}%;
      width:${Math.random()*2+1}px;
      height:${Math.random()*2+1}px;
      animation-duration:${Math.random()*12+8}s;
      animation-delay:${Math.random()*10}s;
      opacity:${Math.random()*.5+.1};
    `;
    container.appendChild(p);
  }
}

/* ── PARALLAX HERO ── */
function initHeroParallax() {
  const img = document.getElementById('heroBgImg');
  if (!img) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) img.style.transform = `scale(1.05) translateY(${y * 0.25}px)`;
  }, { passive: true });
}

/* ── PRELOADER ── */
function initPreloader() {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('hide');
    setTimeout(() => document.getElementById('preloader').remove(), 800);
  }, 2000);
}

/* ── CURSOR ── */
function initCursor() {
  const cur = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');
  if (!cur) return;
  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; });
  function animCursor() {
    cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12;
    cur.style.left = cx + 'px'; cur.style.top = cy + 'px';
    cur.style.transform = `translate(-50%,-50%)`;
    requestAnimationFrame(animCursor);
  }
  animCursor();
  document.querySelectorAll('a,button,.serv-card,.filtro-pill,.gal-item').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('hover'));
    el.addEventListener('mouseleave', () => cur.classList.remove('hover'));
  });
}

/* ── NAVBAR ── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60));
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });
}

/* ── REVEAL ── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => { e.target.classList.add('visible'); obs.unobserve(e.target); }, i * 80);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── WA LINKS ── */
function setWALinks() {
  const msg = encodeURIComponent('Hola! Me gustaría información sobre sus servicios de uñas 💅');
  const url = `https://wa.me/${WA}?text=${msg}`;
  ['waFloat','footerWA','btnWaContacto','ctaBannerWA'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = url;
  });
}

/* ── SERVICIOS ── */
async function cargarServicios() {
  const grid = document.getElementById('serviciosGrid');
  grid.innerHTML = '<div class="loading-state">Cargando servicios...</div>';
  try {
    const p = new URLSearchParams();
    if (catActual !== 'Todos') p.append('categoria', catActual);
    if (busqueda) p.append('buscar', busqueda);
    const data = await (await fetch(`/api/servicios?${p}`)).json();
    if (!data.length) { grid.innerHTML = '<div class="empty-state"><p style="font-size:2rem">🔍</p><p>Sin resultados</p></div>'; return; }
    grid.innerHTML = data.map(renderCard).join('');
    grid.querySelectorAll('.serv-card').forEach((el, i) => {
      el.style.opacity = '0'; el.style.transform = 'translateY(30px)';
      setTimeout(() => { el.style.transition = 'opacity .5s ease, transform .5s ease'; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, i * 80);
    });
  } catch { grid.innerHTML = '<div class="empty-state"><p>Error al cargar. Verifica la conexión.</p></div>'; }
}

function renderCard(s) {
  return `<div class="serv-card" onclick="abrirModal('${s._id}')">
    <div class="serv-img-wrap">
      ${s.imagen ? `<img src="${s.imagen}" alt="${s.nombre}" loading="lazy" onerror="this.outerHTML='<div class=serv-img-placeholder>${ico(s.categoria)}</div>'">` : `<div class="serv-img-placeholder">${ico(s.categoria)}</div>`}
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

/* ── MODAL ── */
async function abrirModal(id) {
  try {
    const s = await (await fetch(`/api/servicios/${id}`)).json();
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
    const msg = encodeURIComponent(`Hola! Me interesa: *${s.nombre}* — ${fmt(s.precio)}. ¿Tienen disponibilidad?`);
    document.getElementById('modalWA').href = `https://wa.me/${WA}?text=${msg}`;
    stars = 0; document.getElementById('calNombre').value = ''; document.getElementById('calTexto').value = ''; paintStars(0);
    await loadCals(id);
    document.getElementById('modalOverlay').classList.add('activo');
    document.body.style.overflow = 'hidden';
  } catch(e) { console.error(e); }
}

async function loadCals(id) {
  const el = document.getElementById('modalCalsLista');
  try {
    const cals = await (await fetch(`/api/calificaciones/servicio/${id}`)).json();
    if (!cals.length) { el.innerHTML = '<p style="color:var(--texto-claro);font-size:.85rem;margin-bottom:1rem">¡Sé la primera en calificar este servicio! 🌟</p>'; return; }
    el.innerHTML = `<div class="cal-grid">${cals.map(c => `
      <div class="cal-card">
        <div class="cal-card-header"><span class="cal-card-nombre">${c.cliente_nombre}</span><span class="cal-card-stars">${'★'.repeat(c.estrellas)}</span></div>
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

function pickStar(n) { stars = n; paintStars(n); }
function paintStars(n) { document.querySelectorAll('#starRow span').forEach((s,i) => s.classList.toggle('on', i < n)); }

async function enviarCal() {
  const nombre = document.getElementById('calNombre').value.trim();
  const texto = document.getElementById('calTexto').value.trim();
  if (!nombre) return alert('Ingresa tu nombre');
  if (!stars) return alert('Selecciona una calificación');
  try {
    const r = await fetch('/api/calificaciones', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ servicio_id: servicioActual._id, cliente_nombre: nombre, estrellas: stars, comentario: texto }) });
    if (r.ok) { alert('¡Gracias! Tu reseña está pendiente 🌟'); document.getElementById('calNombre').value=''; document.getElementById('calTexto').value=''; stars=0; paintStars(0); }
    else { const d=await r.json(); alert(d.error||'Error'); }
  } catch { alert('Error de conexión'); }
}

/* ── RESEÑAS ── */
async function cargarResenas() {
  const grid = document.getElementById('resenasGrid');
  try {
    const servs = await (await fetch('/api/servicios')).json();
    let all = [];
    for (const s of servs.slice(0,5)) {
      const cals = await (await fetch(`/api/calificaciones/servicio/${s._id}`)).json();
      cals.forEach(c => c._sn = s.nombre);
      all = all.concat(cals);
    }
    all = all.filter(c => c.comentario).slice(0,6);
    if (!all.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = all.map(c => `
      <div class="resena-card">
        <div class="resena-stars">${'★'.repeat(c.estrellas)}</div>
        <div class="resena-texto">"${c.comentario}"</div>
        <div class="resena-autor">
          <div class="resena-avatar">${c.cliente_nombre[0]}</div>
          <div><div class="resena-nombre">${c.cliente_nombre}</div><div class="resena-serv">${c._sn}</div></div>
        </div>
      </div>`).join('');
    const promedio = (all.reduce((a,c)=>a+c.estrellas,0)/all.length).toFixed(1);
    const rg = document.getElementById('ratingGlobal');
    if (rg) rg.innerHTML = `<span style="font-size:1.3rem">★★★★★</span><span style="color:white;font-weight:700">${promedio}</span><span style="color:rgba(255,255,255,.3);font-size:.82rem">promedio general</span>`;
  } catch { grid.innerHTML = ''; }
}

/* ── UTILS ── */
function fmt(n) { return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0}).format(n); }
function ico(cat) { return {'Acrílicas':'💅','Manicure':'✨','Pedicure':'🦶','Gel':'💎','Diseño':'🎨','Spa':'🌸'}[cat]||'💅'; }
