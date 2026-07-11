const slug = location.pathname.split('/admin/')[1];
const TOKEN_KEY = `token_${slug}`;

let tienda = null;
let productos = [];

function fmt(precio) {
  return '$ ' + Number(precio).toLocaleString('es-CO');
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}`, ...(options.headers || {}) }
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    mostrarLogin();
    throw new Error('No autorizado');
  }
  return res;
}

function mostrarLogin() {
  document.getElementById('loginView').hidden = false;
  document.getElementById('adminView').hidden = true;
}

function mostrarAdmin() {
  document.getElementById('loginView').hidden = true;
  document.getElementById('adminView').hidden = false;
}

async function cargarStats() {
  const res = await apiFetch(`/api/tiendas/${slug}/stats`);
  const stats = await res.json();
  document.getElementById('statTotal').textContent = stats.totalProductos;
  document.getElementById('statActivos').textContent = stats.activos;
  document.getElementById('statOcultos').textContent = stats.ocultos;
}

function renderProductos() {
  const cont = document.getElementById('listaProductos');
  cont.innerHTML = productos.map(p => `
    <div class="producto-admin-row">
      <img src="${p.imagen || ''}" alt="" onerror="this.style.visibility='hidden'">
      <div class="producto-admin-info">
        <p class="producto-admin-nombre">${p.nombre}</p>
        <p class="producto-admin-precio">${fmt(p.precio)}</p>
        <p class="producto-admin-meta">${p.categoria} · ${p.visible ? '<span class="visible-si">✓ Visible</span>' : '<span class="visible-no">Oculto</span>'}</p>
      </div>
      <div class="producto-admin-acciones">
        <button class="btn-accion btn-editar" data-id="${p._id}">✏️ Editar</button>
        <button class="btn-accion btn-ocultar" data-id="${p._id}">${p.visible ? '🚫 Ocultar' : '👁 Mostrar'}</button>
        <button class="btn-accion btn-borrar" data-id="${p._id}">🗑️ Borrar</button>
      </div>
    </div>`).join('') || '<p class="vacio">Aún no tienes productos</p>';

  cont.querySelectorAll('.btn-editar').forEach(b => b.addEventListener('click', () => abrirModal(b.dataset.id)));
  cont.querySelectorAll('.btn-ocultar').forEach(b => b.addEventListener('click', () => toggleVisibilidad(b.dataset.id)));
  cont.querySelectorAll('.btn-borrar').forEach(b => b.addEventListener('click', () => borrarProducto(b.dataset.id)));
}

async function cargarProductos() {
  const res = await apiFetch(`/api/tiendas/${slug}/productos/admin`);
  productos = await res.json();
  renderProductos();
}

async function toggleVisibilidad(id) {
  await apiFetch(`/api/tiendas/${slug}/productos/${id}/visibilidad`, { method: 'PATCH' });
  await Promise.all([cargarProductos(), cargarStats()]);
}

async function borrarProducto(id) {
  if (!confirm('¿Borrar este producto?')) return;
  await apiFetch(`/api/tiendas/${slug}/productos/${id}`, { method: 'DELETE' });
  await Promise.all([cargarProductos(), cargarStats()]);
}

function abrirModal(id) {
  const producto = id ? productos.find(p => p._id === id) : null;
  document.getElementById('modalTitulo').textContent = producto ? 'Editar producto' : 'Agregar producto';
  document.getElementById('productoId').value = producto ? producto._id : '';
  document.getElementById('pNombre').value = producto ? producto.nombre : '';
  document.getElementById('pDescripcion').value = producto ? producto.descripcion : '';
  document.getElementById('pPrecio').value = producto ? producto.precio : '';
  document.getElementById('pCategoria').value = producto ? producto.categoria : '';
  document.getElementById('pImagen').value = producto ? producto.imagen : '';
  document.getElementById('modalOverlay').classList.add('activo');
  document.getElementById('modalProducto').classList.add('activo');
}

function cerrarModal() {
  document.getElementById('modalOverlay').classList.remove('activo');
  document.getElementById('modalProducto').classList.remove('activo');
}

async function guardarProducto(e) {
  e.preventDefault();
  const id = document.getElementById('productoId').value;
  const body = {
    nombre: document.getElementById('pNombre').value.trim(),
    descripcion: document.getElementById('pDescripcion').value.trim(),
    precio: parseFloat(document.getElementById('pPrecio').value),
    categoria: document.getElementById('pCategoria').value.trim() || 'General',
    imagen: document.getElementById('pImagen').value.trim()
  };
  const path = id ? `/api/tiendas/${slug}/productos/${id}` : `/api/tiendas/${slug}/productos`;
  await apiFetch(path, { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
  cerrarModal();
  await Promise.all([cargarProductos(), cargarStats()]);
}

function copiarAlPortapapeles(texto) {
  navigator.clipboard.writeText(texto);
}

async function init() {
  const token = getToken();
  document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';
    const res = await fetch('/api/tiendas/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, password: document.getElementById('loginPassword').value })
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.error || 'Credenciales incorrectas'; return; }
    localStorage.setItem(TOKEN_KEY, data.token);
    await iniciarPanel();
  });

  if (token) {
    try { await iniciarPanel(); } catch { mostrarLogin(); }
  } else {
    mostrarLogin();
  }
}

async function iniciarPanel() {
  const infoRes = await fetch(`/api/tiendas/${slug}`);
  tienda = await infoRes.json();
  document.getElementById('adminTiendaNombre').textContent = tienda.nombre;

  const link = `${window.location.origin}/tienda/${slug}`;
  document.getElementById('verTiendaLink').href = link;
  document.getElementById('tiendaLinkTexto').textContent = link;

  document.getElementById('btnCopiarLink').addEventListener('click', () => copiarAlPortapapeles(link));
  document.getElementById('btnCompartirLink').addEventListener('click', () => {
    const msg = `Visita mi tienda ${tienda.nombre}: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  });
  document.getElementById('btnAgregarProducto').addEventListener('click', () => abrirModal(null));
  document.getElementById('btnCancelarModal').addEventListener('click', cerrarModal);
  document.getElementById('modalOverlay').addEventListener('click', cerrarModal);
  document.getElementById('formProducto').addEventListener('submit', guardarProducto);

  mostrarAdmin();
  await Promise.all([cargarProductos(), cargarStats()]);
}

init();
