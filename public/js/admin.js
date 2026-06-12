const API = '';
let token = localStorage.getItem('salon_token');
let adminNombre = localStorage.getItem('salon_admin_nombre') || '';

// INIT
document.addEventListener('DOMContentLoaded', () => {
  if (token) mostrarAdmin();
});

// AUTH
async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  if (!email || !password) { errorEl.textContent = 'Completa todos los campos'; return; }

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.error || 'Error al iniciar sesión'; return; }

    token = data.token;
    adminNombre = data.nombre;
    localStorage.setItem('salon_token', token);
    localStorage.setItem('salon_admin_nombre', adminNombre);
    mostrarAdmin();
  } catch {
    errorEl.textContent = 'Error de conexión con el servidor';
  }
}

function mostrarAdmin() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  document.getElementById('adminNombre').textContent = adminNombre;
  document.getElementById('topbarNombre').textContent = `👋 Hola, ${adminNombre}`;
  cargarDashboard();
  cargarServicios();
  cargarCalificaciones();
}

function logout() {
  token = null;
  localStorage.removeItem('salon_token');
  localStorage.removeItem('salon_admin_nombre');
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('adminLayout').style.display = 'none';
}

// NAVEGACIÓN
function mostrarPagina(pagina, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('activa'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('activo'));
  document.getElementById(`page${pagina.charAt(0).toUpperCase() + pagina.slice(1)}`).classList.add('activa');
  btn.classList.add('activo');
}

// DASHBOARD
async function cargarDashboard() {
  try {
    const res = await fetch(`${API}/api/stats`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card"><div class="stat-icon">💅</div><div class="stat-num">${data.totalServicios}</div><div class="stat-label">Total servicios</div></div>
      <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-num">${data.serviciosActivos}</div><div class="stat-label">Servicios activos</div></div>
      <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-num">${data.totalCalificaciones}</div><div class="stat-label">Calificaciones aprobadas</div></div>
      <div class="stat-card"><div class="stat-icon">🕐</div><div class="stat-num">${data.calificacionesPendientes}</div><div class="stat-label">Pendientes de revisar</div></div>
    `;

    const res2 = await fetch(`${API}/api/servicios/admin/todos`, { headers: { Authorization: `Bearer ${token}` } });
    const servicios = await res2.json();
    document.getElementById('dashboardServicios').innerHTML = servicios.slice(0, 5).map(s => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.7rem 0;border-bottom:1px solid #f0f0f0">
        <div>
          <strong>${s.nombre}</strong>
          <span style="margin-left:0.5rem;font-size:0.8rem;color:var(--texto-claro)">${s.categoria}</span>
        </div>
        <div style="display:flex;gap:1rem;align-items:center">
          <span style="font-weight:700;color:var(--rosa)">${formatPrecio(s.precio)}</span>
          <span class="badge badge-${s.activo ? 'activo' : 'inactivo'}">${s.activo ? 'Activo' : 'Inactivo'}</span>
        </div>
      </div>
    `).join('') || '<p style="color:var(--texto-claro)">Sin servicios aún</p>';
  } catch (err) {
    console.error('Error dashboard:', err);
  }
}

// SERVICIOS
async function cargarServicios() {
  const tbody = document.getElementById('serviciosTabla');
  try {
    const res = await fetch(`${API}/api/servicios/admin/todos`, { headers: { Authorization: `Bearer ${token}` } });
    const servicios = await res.json();
    if (!servicios.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--texto-claro)">No hay servicios</td></tr>';
      return;
    }
    tbody.innerHTML = servicios.map(s => `
      <tr>
        <td>
          ${s.imagen
            ? `<img src="${s.imagen}" class="tabla-img" alt="${s.nombre}" onerror="this.outerHTML='<div class=tabla-img>${iconoCat(s.categoria)}</div>'">`
            : `<div class="tabla-img">${iconoCat(s.categoria)}</div>`
          }
        </td>
        <td><strong>${s.nombre}</strong></td>
        <td>${s.categoria}</td>
        <td style="font-weight:700;color:var(--rosa)">${formatPrecio(s.precio)}</td>
        <td>${s.duracion} min</td>
        <td>${s.calificacion_promedio > 0 ? `⭐ ${s.calificacion_promedio.toFixed(1)}` : '–'}</td>
        <td><span class="badge badge-${s.activo ? 'activo' : 'inactivo'}">${s.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td>
          <button class="btn btn-gris btn-sm" onclick="editarServicio('${s._id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarServicio('${s._id}','${s.nombre}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:red">Error al cargar</td></tr>';
  }
}

function abrirFormServicio() {
  document.getElementById('modalServicioTitulo').textContent = 'Agregar servicio';
  document.getElementById('servicioId').value = '';
  document.getElementById('sNombre').value = '';
  document.getElementById('sCategoria').value = '';
  document.getElementById('sPrecio').value = '';
  document.getElementById('sDuracion').value = '';
  document.getElementById('sDescripcion').value = '';
  document.getElementById('sImagen').value = '';
  document.getElementById('imgPreview').innerHTML = '';
  document.getElementById('activoGroup').style.display = 'none';
  document.getElementById('modalServicioOverlay').classList.add('activo');
}

async function editarServicio(id) {
  try {
    const res = await fetch(`${API}/api/servicios/${id}`);
    const s = await res.json();
    document.getElementById('modalServicioTitulo').textContent = 'Editar servicio';
    document.getElementById('servicioId').value = s._id;
    document.getElementById('sNombre').value = s.nombre;
    document.getElementById('sCategoria').value = s.categoria;
    document.getElementById('sPrecio').value = s.precio;
    document.getElementById('sDuracion').value = s.duracion;
    document.getElementById('sDescripcion').value = s.descripcion;
    document.getElementById('sActivo').value = s.activo ? 'true' : 'false';
    document.getElementById('activoGroup').style.display = 'block';
    document.getElementById('sImagen').value = s.imagen || '';
    document.getElementById('imgPreview').innerHTML = s.imagen
      ? `<img src="${s.imagen}" style="max-height:100px;border-radius:8px;margin-top:4px">`
      : '';
    document.getElementById('modalServicioOverlay').classList.add('activo');
  } catch {
    alert('Error al cargar servicio');
  }
}

async function guardarServicio() {
  const id = document.getElementById('servicioId').value;
  const nombre = document.getElementById('sNombre').value.trim();
  const categoria = document.getElementById('sCategoria').value;
  const precio = document.getElementById('sPrecio').value;
  const duracion = document.getElementById('sDuracion').value;
  const descripcion = document.getElementById('sDescripcion').value.trim();
  const activo = document.getElementById('sActivo').value;
  const imagen = document.getElementById('sImagen').value.trim();

  if (!nombre || !categoria || !precio || !duracion || !descripcion) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }

  const body = { nombre, categoria, precio, duracion, descripcion, imagen };
  if (id) body.activo = activo;

  try {
    const res = await fetch(`${API}/api/servicios${id ? '/' + id : ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Error al guardar'); return; }

    cerrarModalServicio();
    cargarServicios();
    cargarDashboard();
    alert(id ? '✅ Servicio actualizado' : '✅ Servicio creado');
  } catch {
    alert('Error de conexión');
  }
}

async function eliminarServicio(id, nombre) {
  if (!confirm(`¿Eliminar el servicio "${nombre}"? Esta acción no se puede deshacer.`)) return;
  try {
    const res = await fetch(`${API}/api/servicios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) { cargarServicios(); cargarDashboard(); }
    else alert('Error al eliminar');
  } catch {
    alert('Error de conexión');
  }
}

function cerrarModalServicio() {
  document.getElementById('modalServicioOverlay').classList.remove('activo');
}

function previewImagenUrl(url) {
  const el = document.getElementById('imgPreview');
  el.innerHTML = url ? `<img src="${url}" style="max-height:100px;border-radius:8px;margin-top:4px" onerror="this.style.display='none'">` : '';
}

// CALIFICACIONES
async function cargarCalificaciones() {
  const tbody = document.getElementById('calsTabla');
  try {
    const res = await fetch(`${API}/api/calificaciones/admin/todas`, { headers: { Authorization: `Bearer ${token}` } });
    const cals = await res.json();
    if (!cals.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--texto-claro)">No hay calificaciones</td></tr>';
      return;
    }
    tbody.innerHTML = cals.map(c => `
      <tr>
        <td><strong>${c.cliente_nombre}</strong></td>
        <td>${c.servicio_id?.nombre || '–'}</td>
        <td style="color:var(--dorado)">${'⭐'.repeat(c.estrellas)}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.comentario || '–'}</td>
        <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="abrirModalCal('${c._id}','${c.cliente_nombre}',${c.estrellas},'${(c.comentario||'').replace(/'/g,"\\'")}','${(c.respuesta_admin||'').replace(/'/g,"\\'")}')">💬 Responder</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarCal('${c._id}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red">Error al cargar</td></tr>';
  }
}

function abrirModalCal(id, nombre, estrellas, comentario, respuesta) {
  document.getElementById('calId').value = id;
  document.getElementById('calClienteNombre').textContent = nombre + ' ';
  document.getElementById('calEstrellas').textContent = '⭐'.repeat(estrellas);
  document.getElementById('calComentarioTexto').textContent = comentario ? `"${comentario}"` : 'Sin comentario';
  document.getElementById('calRespuesta').value = respuesta || '';
  document.getElementById('modalCalOverlay').classList.add('activo');
}

function cerrarModalCal() {
  document.getElementById('modalCalOverlay').classList.remove('activo');
}

async function gestionarCal(estado) {
  const id = document.getElementById('calId').value;
  const respuesta = document.getElementById('calRespuesta').value.trim();
  try {
    const res = await fetch(`${API}/api/calificaciones/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, respuesta_admin: respuesta })
    });
    if (res.ok) {
      cerrarModalCal();
      cargarCalificaciones();
      cargarDashboard();
    } else {
      alert('Error al actualizar calificación');
    }
  } catch {
    alert('Error de conexión');
  }
}

async function eliminarCal(id) {
  if (!confirm('¿Eliminar esta calificación?')) return;
  try {
    await fetch(`${API}/api/calificaciones/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    cargarCalificaciones();
    cargarDashboard();
  } catch {
    alert('Error de conexión');
  }
}

// UTILS
function formatPrecio(precio) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio);
}
function iconoCat(cat) {
  return { 'Acrílicas':'💅','Manicure':'✨','Pedicure':'🦶','Gel':'💎','Diseño':'🎨','Spa':'🌸' }[cat] || '💅';
}
