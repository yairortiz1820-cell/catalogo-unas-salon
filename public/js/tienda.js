const slug = location.pathname.split('/tienda/')[1];
const CART_KEY = `carrito_${slug}`;

let tienda = null;
let productos = [];
let categoriaActiva = 'Todos';
let busqueda = '';

function fmt(precio) {
  return '$ ' + Number(precio).toLocaleString('es-CO');
}

function leerCarrito() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function guardarCarrito(carrito) {
  localStorage.setItem(CART_KEY, JSON.stringify(carrito));
  actualizarContador();
}

function actualizarContador() {
  const total = leerCarrito().reduce((a, i) => a + i.cantidad, 0);
  const el = document.getElementById('cartCount');
  el.textContent = total;
  el.hidden = total === 0;
}

function mostrarToast(msg) {
  const toast = document.getElementById('cartToast');
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(mostrarToast._t);
  mostrarToast._t = setTimeout(() => { toast.hidden = true; }, 2500);
}

function agregarAlCarrito(producto) {
  const carrito = leerCarrito();
  const existente = carrito.find(i => i.productoId === producto._id);
  if (existente) existente.cantidad++;
  else carrito.push({ productoId: producto._id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen, cantidad: 1 });
  guardarCarrito(carrito);
  mostrarToast(`✅ ${producto.nombre} agregado`);
}

function cambiarCantidad(productoId, delta) {
  let carrito = leerCarrito();
  const item = carrito.find(i => i.productoId === productoId);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) carrito = carrito.filter(i => i.productoId !== productoId);
  guardarCarrito(carrito);
  renderCarrito();
}

function renderCarrito() {
  const carrito = leerCarrito();
  const cont = document.getElementById('cartItems');
  cont.innerHTML = carrito.length
    ? carrito.map(i => `
      <div class="cart-item">
        <img src="${i.imagen || ''}" alt="" onerror="this.style.display='none'">
        <div class="cart-item-info">
          <p class="cart-item-nombre">${i.nombre}</p>
          <p class="cart-item-precio">${fmt(i.precio)} c/u</p>
        </div>
        <div class="qty-control">
          <button data-id="${i.productoId}" data-delta="-1">−</button>
          <span>${i.cantidad}</span>
          <button data-id="${i.productoId}" data-delta="1">+</button>
        </div>
      </div>`).join('')
    : '<p class="vacio">Tu carrito está vacío</p>';

  cont.querySelectorAll('.qty-control button').forEach(btn => {
    btn.addEventListener('click', () => cambiarCantidad(btn.dataset.id, parseInt(btn.dataset.delta)));
  });

  const total = carrito.reduce((a, i) => a + i.precio * i.cantidad, 0);
  document.getElementById('cartTotal').textContent = fmt(total);
}

function abrirCarrito() {
  renderCarrito();
  document.getElementById('cartDrawer').classList.add('activo');
  document.getElementById('cartOverlay').classList.add('activo');
}

function cerrarCarrito() {
  document.getElementById('cartDrawer').classList.remove('activo');
  document.getElementById('cartOverlay').classList.remove('activo');
}

function renderCategorias() {
  const cats = ['Todos', ...new Set(productos.map(p => p.categoria))];
  const cont = document.getElementById('chipsCategorias');
  cont.innerHTML = cats.map(c => `<button class="chip ${c === categoriaActiva ? 'activo' : ''}" data-cat="${c}">${c}</button>`).join('');
  cont.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      categoriaActiva = chip.dataset.cat;
      cargarProductos();
    });
  });
}

function renderProductos(lista) {
  const grid = document.getElementById('productosGrid');
  const vacio = document.getElementById('vacioMsg');
  vacio.hidden = lista.length > 0;
  grid.innerHTML = lista.map(p => `
    <article class="producto-card">
      <img src="${p.imagen || ''}" alt="${p.nombre}" onerror="this.src='';this.classList.add('sin-imagen')">
      <div class="producto-info">
        <p class="producto-categoria">${p.categoria.toUpperCase()}</p>
        <h3 class="producto-nombre">${p.nombre}</h3>
        <p class="producto-desc">${p.descripcion || ''}</p>
        <div class="producto-footer">
          <span class="producto-precio">${fmt(p.precio)}</span>
          <button class="btn btn-primary-sm" data-id="${p._id}">+ Agregar</button>
        </div>
      </div>
    </article>`).join('');

  grid.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const producto = productos.find(p => p._id === btn.dataset.id);
      if (producto) agregarAlCarrito(producto);
    });
  });
}

async function cargarProductos() {
  const params = new URLSearchParams();
  if (categoriaActiva !== 'Todos') params.set('categoria', categoriaActiva);
  if (busqueda) params.set('buscar', busqueda);
  const res = await fetch(`/api/tiendas/${slug}/productos?${params}`);
  productos = await res.json();
  renderCategorias();
  renderProductos(productos);
}

function construirMensajePedido() {
  const carrito = leerCarrito();
  const lineas = [`Hola! Quiero hacer un pedido en *${tienda.nombre}*:`, ''];
  carrito.forEach(i => lineas.push(`• ${i.nombre} x${i.cantidad} — ${fmt(i.precio * i.cantidad)}`));
  const total = carrito.reduce((a, i) => a + i.precio * i.cantidad, 0);
  lineas.push('', `*Total: ${fmt(total)}*`);
  return lineas.join('\n');
}

async function compartirTienda() {
  const url = window.location.href;
  const data = { title: tienda.nombre, text: `Mira los productos de ${tienda.nombre}`, url };
  if (navigator.share) {
    try { await navigator.share(data); } catch { /* cancelado */ }
  } else {
    await navigator.clipboard.writeText(url);
    mostrarToast('🔗 Link copiado al portapapeles');
  }
}

async function init() {
  const res = await fetch(`/api/tiendas/${slug}`);
  if (!res.ok) {
    document.getElementById('tiendaNombre').textContent = 'Tienda no encontrada';
    return;
  }
  tienda = await res.json();
  document.getElementById('tiendaLogo').textContent = tienda.logoEmoji;
  document.getElementById('tiendaNombre').textContent = tienda.nombre;
  document.getElementById('tiendaCategoria').textContent = tienda.categoria;
  document.getElementById('bannerNombre').textContent = tienda.nombre;
  document.getElementById('bannerDescripcion').textContent = tienda.descripcion;
  document.title = `${tienda.nombre} — CatalogoYa`;

  await cargarProductos();
  actualizarContador();

  document.getElementById('btnCarrito').addEventListener('click', abrirCarrito);
  document.getElementById('btnCerrarCarrito').addEventListener('click', cerrarCarrito);
  document.getElementById('cartOverlay').addEventListener('click', cerrarCarrito);
  document.getElementById('btnVaciar').addEventListener('click', () => { guardarCarrito([]); renderCarrito(); });
  document.getElementById('btnWhatsapp').addEventListener('click', () => {
    if (!leerCarrito().length) return mostrarToast('Tu carrito está vacío');
    const url = `https://wa.me/57${tienda.whatsapp}?text=${encodeURIComponent(construirMensajePedido())}`;
    window.open(url, '_blank');
  });
  document.getElementById('btnCompartir').addEventListener('click', compartirTienda);

  let debounce;
  document.getElementById('buscarInput').addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { busqueda = e.target.value.trim(); cargarProductos(); }, 300);
  });
}

init();
