// Servidor demo sin MongoDB - datos en memoria, para preview rápido
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret_key';
const RESERVADOS = new Set(['admin', 'api', 'crear-tienda', 'tienda', 'home', 'uploads', 'public']);

function slugify(texto) {
  return texto.toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ─── DATOS EN MEMORIA ───────────────────────────────────────────────
let tiendas = [
  {
    _id: 't1', slug: 'joyas-esmeraldas', nombre: 'Joyas Esmeraldas', whatsapp: '3001234567',
    categoria: 'Joyería', descripcion: 'Piezas artesanales con esmeraldas colombianas',
    passwordHash: bcrypt.hashSync('demo1234', 10), logoEmoji: '💎', activa: true
  },
  {
    _id: 't2', slug: 'ropa-linda', nombre: 'Ropa Linda', whatsapp: '3007654321',
    categoria: 'Ropa', descripcion: 'Moda femenina a la medida de tu estilo',
    passwordHash: bcrypt.hashSync('demo1234', 10), logoEmoji: '👗', activa: true
  }
];

let productos = [
  { _id: 'p1', tiendaId: 't1', nombre: 'Conjunto Floral Aretes + Dije', descripcion: 'Set completo en plata 925 con esmeralda central', precio: 195000, categoria: 'Conjuntos', imagen: 'https://images.unsplash.com/photo-1599459183200-59c7687a0275?w=400', visible: true },
  { _id: 'p2', tiendaId: 't1', nombre: 'Pulsera Triple Estación', descripcion: 'Plata 925 con 3 estaciones de esmeraldas', precio: 245000, categoria: 'Pulseras', imagen: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400', visible: true },
  { _id: 'p3', tiendaId: 't1', nombre: 'Aretes Lazo Plata 925', descripcion: 'Diseño delicado en forma de lazo con esmeralda', precio: 125000, categoria: 'Aretes', imagen: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', visible: true },
  { _id: 'p4', tiendaId: 't1', nombre: 'Aretes Corazón Abierto', descripcion: 'Aretes en plata con esmeralda incrustada', precio: 165000, categoria: 'Aretes', imagen: 'https://images.unsplash.com/photo-1602751584547-8564cfcb5b1d?w=400', visible: true },
  { _id: 'p5', tiendaId: 't1', nombre: 'Dije Minimalista Oro Laminado', descripcion: 'Dije delicado bañado en oro con esmeralda', precio: 175000, categoria: 'Dijes', imagen: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400', visible: true },
  { _id: 'p6', tiendaId: 't2', nombre: 'Vestido Midi Floral', descripcion: 'Vestido midi estampado, tela fresca ideal para el día', precio: 89000, categoria: 'Vestidos', imagen: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', visible: true },
  { _id: 'p7', tiendaId: 't2', nombre: 'Blusa Manga Larga Satinada', descripcion: 'Blusa elegante en tela satinada, varios colores', precio: 65000, categoria: 'Blusas', imagen: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400', visible: true },
  { _id: 'p8', tiendaId: 't2', nombre: 'Jean Tiro Alto Clásico', descripcion: 'Jean tiro alto, corte recto, en denim resistente', precio: 95000, categoria: 'Jeans', imagen: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400', visible: true }
];

let nextId = 100;

function firmarToken(tienda) {
  return jwt.sign({ tiendaId: tienda._id, slug: tienda.slug, nombre: tienda.nombre }, JWT_SECRET, { expiresIn: '8h' });
}

function tenantAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try { req.tienda = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}

function verifyTenantSlug(req, res, next) {
  if (req.tienda.slug !== req.params.slug) return res.status(403).json({ error: 'No autorizado para esta tienda' });
  next();
}

function publicaTienda(t) {
  return { slug: t.slug, nombre: t.nombre, categoria: t.categoria, descripcion: t.descripcion, whatsapp: t.whatsapp, logoEmoji: t.logoEmoji };
}

// ─── TIENDAS ───────────────────────────────────────────────
app.post('/api/tiendas', async (req, res) => {
  const { nombre, whatsapp, categoria, descripcion, password } = req.body;
  if (!nombre || !whatsapp || !password) return res.status(400).json({ error: 'Nombre, WhatsApp y contraseña son requeridos' });
  if (password.length < 4) return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });

  let base = slugify(nombre) || 'tienda';
  let slug = base;
  let intentos = 0;
  while (RESERVADOS.has(slug) || tiendas.some(t => t.slug === slug)) {
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (++intentos > 5) break;
  }

  const tienda = {
    _id: String(++nextId), nombre, whatsapp, categoria: categoria || 'General', descripcion: descripcion || '',
    slug, passwordHash: bcrypt.hashSync(password, 10), logoEmoji: '🏪', activa: true
  };
  tiendas.push(tienda);
  res.status(201).json({ token: firmarToken(tienda), tienda: publicaTienda(tienda) });
});

app.post('/api/tiendas/login', async (req, res) => {
  const { slug, password } = req.body;
  const tienda = tiendas.find(t => t.slug === slug);
  if (!tienda || !bcrypt.compareSync(password, tienda.passwordHash)) return res.status(401).json({ error: 'Credenciales incorrectas' });
  res.json({ token: firmarToken(tienda), tienda: publicaTienda(tienda) });
});

app.get('/api/tiendas/:slug/stats', tenantAuth, verifyTenantSlug, (req, res) => {
  const mios = productos.filter(p => p.tiendaId === req.tienda.tiendaId);
  const activos = mios.filter(p => p.visible).length;
  res.json({ totalProductos: mios.length, activos, ocultos: mios.length - activos });
});

app.get('/api/tiendas/:slug', (req, res) => {
  const tienda = tiendas.find(t => t.slug === req.params.slug && t.activa);
  if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });
  res.json(publicaTienda(tienda));
});

// ─── PRODUCTOS ───────────────────────────────────────────────
app.get('/api/tiendas/:slug/productos/admin', tenantAuth, verifyTenantSlug, (req, res) => {
  res.json(productos.filter(p => p.tiendaId === req.tienda.tiendaId));
});

app.get('/api/tiendas/:slug/productos/:id', (req, res) => {
  const p = productos.find(p => p._id === req.params.id && p.visible);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(p);
});

app.get('/api/tiendas/:slug/productos', (req, res) => {
  const tienda = tiendas.find(t => t.slug === req.params.slug);
  if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });
  let lista = productos.filter(p => p.tiendaId === tienda._id && p.visible);
  if (req.query.categoria && req.query.categoria !== 'Todos') lista = lista.filter(p => p.categoria === req.query.categoria);
  if (req.query.buscar) lista = lista.filter(p => p.nombre.toLowerCase().includes(req.query.buscar.toLowerCase()));
  res.json(lista);
});

app.post('/api/tiendas/:slug/productos', tenantAuth, verifyTenantSlug, (req, res) => {
  const { nombre, descripcion, precio, categoria, imagen } = req.body;
  if (!nombre || precio === undefined) return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  const nuevo = {
    _id: String(++nextId), tiendaId: req.tienda.tiendaId, nombre, descripcion: descripcion || '',
    precio: parseFloat(precio), categoria: categoria || 'General', imagen: imagen || '', visible: true
  };
  productos.push(nuevo);
  res.status(201).json(nuevo);
});

app.put('/api/tiendas/:slug/productos/:id', tenantAuth, verifyTenantSlug, (req, res) => {
  const idx = productos.findIndex(p => p._id === req.params.id && p.tiendaId === req.tienda.tiendaId);
  if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  const { nombre, descripcion, precio, categoria, imagen, visible } = req.body;
  productos[idx] = { ...productos[idx], nombre, descripcion, precio: parseFloat(precio), categoria, imagen, visible: visible !== undefined ? visible : productos[idx].visible };
  res.json(productos[idx]);
});

app.patch('/api/tiendas/:slug/productos/:id/visibilidad', tenantAuth, verifyTenantSlug, (req, res) => {
  const p = productos.find(p => p._id === req.params.id && p.tiendaId === req.tienda.tiendaId);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  p.visible = !p.visible;
  res.json(p);
});

app.delete('/api/tiendas/:slug/productos/:id', tenantAuth, verifyTenantSlug, (req, res) => {
  const antes = productos.length;
  productos = productos.filter(p => !(p._id === req.params.id && p.tiendaId === req.tienda.tiendaId));
  if (productos.length === antes) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json({ mensaje: 'Eliminado' });
});

// ─── PÁGINAS ───────────────────────────────────────────────
app.get('/crear-tienda', (req, res) => res.sendFile(path.join(__dirname, 'public', 'crear-tienda.html')));
app.get('/tienda/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tienda.html')));
app.get('/admin/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-tienda.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor demo corriendo en http://localhost:${PORT}`));
