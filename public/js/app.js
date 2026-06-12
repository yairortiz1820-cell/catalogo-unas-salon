const API = '';
const WA_NUMBER = '573001234567';
let servicioActual = null;
let estrellasSeleccionadas = 0;
let categoriaActual = 'Todos';
let busquedaActual = '';

// Init
document.addEventListener('DOMContentLoaded', () => {
  cargarServicios();
  cargarResenas();
  configurarWaFlotante();
  configurarHamburger();
});

function configurarWaFlotante() {
  const btn = document.getElementById('waFlotante');
  btn.href = `https://wa.me/${WA_NUMBER}?text=Hola! Me gustaría más información sobre sus servicios.`;
}

function configurarHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => navLinks.classList.toggle('abierto'));
}

// SERVICIOS
async function cargarServicios() {
  const grid = document.getElementById('serviciosGrid');
  grid.innerHTML = '<div class="loading">Cargando servicios... 💅</div>';
  try {
    const params = new URLSearchParams();
    if (categoriaActual !== 'Todos') params.append('categoria', categoriaActual);
    if (busquedaActual) params.append('buscar', busquedaActual);

    const res = await fetch(`${API}/api/servicios?${params}`);
    const servicios = await res.json();

    if (!servicios.length) {
      grid.innerHTML = '<div class="empty"><p style="font-size:2rem">🔍</p><p>No se encontraron servicios</p></div>';
      return;
    }

    grid.innerHTML = servicios.map(s => `
      <div class="servicio-card" onclick="abrirModal('${s._id}')">
        ${s.imagen
          ? `<img src="${s.imagen}" alt="${s.nombre}" class="servicio-img" onerror="this.style.display='none'">`
          : `<div class="servicio-img-placeholder">${iconoCategoria(s.categoria)}</div>`
        }
        <div class="servicio-body">
          <div class="servicio-categoria">${s.categoria}</div>
          <div class="servicio-nombre">${s.nombre}</div>
          <div class="servicio-desc">${s.descripcion}</div>
          <div class="servicio-footer">
            <div>
              <div class="servicio-precio">${formatPrecio(s.precio)}</div>
              <div class="servicio-duracion">⏱️ ${s.duracion} min</div>
            </div>
            <div class="estrellas">
              <span class="stars">${renderEstrellas(s.calificacion_promedio)}</span>
              <span>${s.calificacion_promedio > 0 ? s.calificacion_promedio.toFixed(1) : 'Nuevo'}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<div class="empty"><p>Error al cargar servicios. Verifica la conexión.</p></div>';
  }
}

function filtrar(categoria, btn) {
  categoriaActual = categoria;
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'));
  btn.classList.add('activo');
  cargarServicios();
}

function buscarServicios() {
  busquedaActual = document.getElementById('buscador').value;
  clearTimeout(window._buscarTimeout);
  window._buscarTimeout = setTimeout(cargarServicios, 400);
}

// MODAL
async function abrirModal(id) {
  try {
    const res = await fetch(`${API}/api/servicios/${id}`);
    const s = await res.json();
    servicioActual = s;

    const imgContainer = document.getElementById('modalImgContainer');
    imgContainer.innerHTML = s.imagen
      ? `<img src="${s.imagen}" alt="${s.nombre}" class="modal-img" onerror="this.outerHTML='<div class=modal-img-placeholder>${iconoCategoria(s.categoria)}</div>'">`
      : `<div class="modal-img-placeholder">${iconoCategoria(s.categoria)}</div>`;

    document.getElementById('modalCategoria').textContent = s.categoria;
    document.getElementById('modalNombre').textContent = s.nombre;
    document.getElementById('modalPrecio').textContent = formatPrecio(s.precio);
    document.getElementById('modalDesc').textContent = s.descripcion;
    document.getElementById('modalDuracion').textContent = `${s.duracion} minutos`;
    document.getElementById('modalCal').textContent = s.calificacion_promedio > 0
      ? `${s.calificacion_promedio.toFixed(1)} (${s.total_calificaciones} reseñas)`
      : 'Sin calificaciones aún';

    const msg = encodeURIComponent(`Hola! Me interesa el servicio: *${s.nombre}* - Precio: ${formatPrecio(s.precio)}. ¿Tienen disponibilidad?`);
    document.getElementById('modalWA').href = `https://wa.me/${WA_NUMBER}?text=${msg}`;

    estrellasSeleccionadas = 0;
    document.getElementById('calNombre').value = '';
    document.getElementById('calComentario').value = '';
    actualizarEstrellasSelectorUI(0);

    await cargarCalificacionesModal(id);

    document.getElementById('modalOverlay').classList.add('activo');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    console.error('Error abriendo modal:', err);
  }
}

async function cargarCalificacionesModal(servicioId) {
  const lista = document.getElementById('modalCalsLista');
  try {
    const res = await fetch(`${API}/api/calificaciones/servicio/${servicioId}`);
    const cals = await res.json();

    if (!cals.length) {
      lista.innerHTML = '<p style="color:var(--texto-claro);font-size:0.9rem">Sé la primera en calificar este servicio 🌟</p>';
      return;
    }

    lista.innerHTML = cals.map(c => `
      <div class="cal-item">
        <div class="cal-header">
          <span class="cal-nombre">${c.cliente_nombre}</span>
          <span style="color:var(--dorado)">${'⭐'.repeat(c.estrellas)}</span>
        </div>
        ${c.comentario ? `<div class="cal-comentario">"${c.comentario}"</div>` : ''}
        ${c.respuesta_admin ? `<div class="cal-respuesta">💬 ${c.respuesta_admin}</div>` : ''}
      </div>
    `).join('');
  } catch {
    lista.innerHTML = '';
  }
}

function cerrarModal(event) {
  if (event && event.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('activo');
  document.body.style.overflow = '';
  servicioActual = null;
}

// CALIFICACIONES
function seleccionarEstrellas(n) {
  estrellasSeleccionadas = n;
  actualizarEstrellasSelectorUI(n);
}

function actualizarEstrellasSelectorUI(n) {
  document.querySelectorAll('#starSelector span').forEach((s, i) => {
    s.classList.toggle('activo', i < n);
  });
}

async function enviarCalificacion() {
  const nombre = document.getElementById('calNombre').value.trim();
  const comentario = document.getElementById('calComentario').value.trim();

  if (!nombre) return alert('Por favor ingresa tu nombre');
  if (!estrellasSeleccionadas) return alert('Por favor selecciona una calificación');
  if (!servicioActual) return;

  try {
    const res = await fetch(`${API}/api/calificaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        servicio_id: servicioActual._id,
        cliente_nombre: nombre,
        estrellas: estrellasSeleccionadas,
        comentario
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert('¡Gracias por tu calificación! Será revisada pronto 🌟');
      document.getElementById('calNombre').value = '';
      document.getElementById('calComentario').value = '';
      estrellasSeleccionadas = 0;
      actualizarEstrellasSelectorUI(0);
    } else {
      alert(data.error || 'Error al enviar calificación');
    }
  } catch {
    alert('Error de conexión');
  }
}

// RESEÑAS GENERALES
async function cargarResenas() {
  const grid = document.getElementById('resenasGrid');
  try {
    // Obtener calificaciones aprobadas de todos los servicios
    const resServicios = await fetch(`${API}/api/servicios`);
    const servicios = await resServicios.json();

    let todasCals = [];
    for (const s of servicios.slice(0, 4)) {
      const res = await fetch(`${API}/api/calificaciones/servicio/${s._id}`);
      const cals = await res.json();
      cals.forEach(c => { c._servicioNombre = s.nombre; });
      todasCals = todasCals.concat(cals);
    }

    todasCals = todasCals.filter(c => c.comentario).slice(0, 6);

    if (!todasCals.length) {
      grid.innerHTML = '<div class="empty"><p>Aún no hay reseñas</p></div>';
      return;
    }

    grid.innerHTML = todasCals.map(c => `
      <div class="resena-card">
        <div class="resena-estrellas">${'⭐'.repeat(c.estrellas)}</div>
        <div class="resena-comentario">"${c.comentario}"</div>
        <div class="resena-cliente">${c.cliente_nombre}</div>
        <div class="resena-servicio">${c._servicioNombre}</div>
      </div>
    `).join('');
  } catch {
    grid.innerHTML = '<div class="empty"><p>No se pudieron cargar las reseñas</p></div>';
  }
}

// UTILS
function formatPrecio(precio) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio);
}

function renderEstrellas(promedio) {
  const llenas = Math.round(promedio);
  return '⭐'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

function iconoCategoria(cat) {
  const iconos = { 'Acrílicas': '💅', 'Manicure': '✨', 'Pedicure': '🦶', 'Gel': '💎', 'Diseño': '🎨', 'Spa': '🌸' };
  return iconos[cat] || '💅';
}
