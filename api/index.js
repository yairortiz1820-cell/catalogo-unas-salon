const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || 'glamour_nails_secret_2024';
const WA_NUMBER = process.env.WHATSAPP_NUMBER || '573001234567';

// ─── SALON DATA ───────────────────────────────────────────────────────────────
let servicios = [
  { _id: '1', nombre: 'Uñas Acrílicas Clásicas', descripcion: 'Extensión de uñas acrílicas con acabado natural o con color. Resistentes y duraderas por hasta 3 semanas.', precio: 65000, duracion: 90, categoria: 'Acrílicas', imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80', calificacion_promedio: 4.8, total_calificaciones: 24, activo: true },
  { _id: '2', nombre: 'Manicure Tradicional', descripcion: 'Limpieza, corte, limado y esmaltado de uñas naturales. Incluye exfoliación de manos.', precio: 25000, duracion: 45, categoria: 'Manicure', imagen: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80', calificacion_promedio: 4.5, total_calificaciones: 18, activo: true },
  { _id: '3', nombre: 'Pedicure Spa Completo', descripcion: 'Baño de pies, exfoliación, hidratación profunda, corte y esmaltado. El mejor relax para tus pies.', precio: 45000, duracion: 60, categoria: 'Pedicure', imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80', calificacion_promedio: 4.9, total_calificaciones: 31, activo: true },
  { _id: '4', nombre: 'Uñas en Gel UV', descripcion: 'Aplicación de gel UV para mayor resistencia y brillo. Duración de hasta 4 semanas sin astillarse.', precio: 55000, duracion: 75, categoria: 'Gel', imagen: 'https://images.unsplash.com/photo-1604923701-2a38cfe3f91d?w=500&q=80', calificacion_promedio: 4.7, total_calificaciones: 15, activo: true },
  { _id: '5', nombre: 'Nail Art & Diseños', descripcion: 'Diseños artísticos personalizados: flores, líneas, glitter, degradados y mucho más. Cada uña una obra de arte.', precio: 80000, duracion: 120, categoria: 'Diseño', imagen: 'https://images.unsplash.com/photo-1604654894578-f15a3edfbe7a?w=500&q=80', calificacion_promedio: 5.0, total_calificaciones: 12, activo: true },
  { _id: '6', nombre: 'Spa de Manos Premium', descripcion: 'Tratamiento completo: exfoliación, baño de parafina, masaje con aceites esenciales y manicure.', precio: 70000, duracion: 90, categoria: 'Spa', imagen: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80', calificacion_promedio: 4.6, total_calificaciones: 9, activo: true }
];
let calificaciones = [
  { _id: 'c1', servicio_id: '1', cliente_nombre: 'María García', estrellas: 5, comentario: '¡Quedé encantada! Muy profesional y duradero.', estado: 'aprobada', respuesta_admin: '' },
  { _id: 'c2', servicio_id: '1', cliente_nombre: 'Laura P.', estrellas: 5, comentario: 'El mejor servicio de la ciudad, súper recomendado.', estado: 'aprobada', respuesta_admin: '' },
  { _id: 'c3', servicio_id: '2', cliente_nombre: 'Ana Rodríguez', estrellas: 4, comentario: 'Muy buen servicio, precios justos y ambiente agradable.', estado: 'aprobada', respuesta_admin: '' },
  { _id: 'c4', servicio_id: '3', cliente_nombre: 'Carolina M.', estrellas: 5, comentario: 'El pedicure spa es una experiencia increíble. Mis pies quedaron perfectos.', estado: 'aprobada', respuesta_admin: '' },
  { _id: 'c5', servicio_id: '5', cliente_nombre: 'Valentina L.', estrellas: 5, comentario: 'Los diseños son únicos y creativos. Siempre recibo cumplidos.', estado: 'aprobada', respuesta_admin: '' }
];
const adminUser = { email: 'admin@salon.com', password: 'admin123', nombre: 'Administrador' };
let nextId = 20;

// ─── SALON AUTH ────────────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}

// ─── TIENDAS VIRTUALES ─────────────────────────────────────────────────────────
let tiendas = [];
let productos = [];
let tId = 1000;
let pId = 2000;

function slugify(str) {
  return (str || '').toLowerCase()
    .replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i')
    .replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/ñ/g,'n')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'tienda';
}

function tiendaAuthMW(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try { req.storeData = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}

// ─── SALON ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === adminUser.email && password === adminUser.password) {
    const token = jwt.sign({ email, nombre: adminUser.nombre }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, nombre: adminUser.nombre });
  }
  res.status(401).json({ error: 'Credenciales incorrectas' });
});

app.get('/api/servicios', (req, res) => {
  let lista = servicios.filter(s => s.activo);
  if (req.query.categoria && req.query.categoria !== 'Todos') lista = lista.filter(s => s.categoria === req.query.categoria);
  if (req.query.buscar) lista = lista.filter(s => s.nombre.toLowerCase().includes(req.query.buscar.toLowerCase()));
  res.json(lista);
});
app.get('/api/servicios/admin/todos', authMiddleware, (req, res) => res.json(servicios));
app.get('/api/servicios/:id', (req, res) => {
  const s = servicios.find(s => s._id === req.params.id);
  if (!s) return res.status(404).json({ error: 'No encontrado' });
  res.json(s);
});
app.post('/api/servicios', authMiddleware, (req, res) => {
  const { nombre, descripcion, precio, duracion, categoria, imagen } = req.body;
  if (!nombre || !descripcion || !precio || !duracion || !categoria) return res.status(400).json({ error: 'Campos requeridos' });
  const nuevo = { _id: String(++nextId), nombre, descripcion, precio: parseFloat(precio), duracion: parseInt(duracion), categoria, imagen: imagen || '', calificacion_promedio: 0, total_calificaciones: 0, activo: true };
  servicios.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/api/servicios/:id', authMiddleware, (req, res) => {
  const idx = servicios.findIndex(s => s._id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  const { nombre, descripcion, precio, duracion, categoria, activo, imagen } = req.body;
  servicios[idx] = { ...servicios[idx], nombre, descripcion, precio: parseFloat(precio), duracion: parseInt(duracion), categoria, activo: activo !== 'false' };
  if (imagen) servicios[idx].imagen = imagen;
  res.json(servicios[idx]);
});
app.delete('/api/servicios/:id', authMiddleware, (req, res) => {
  servicios = servicios.filter(s => s._id !== req.params.id);
  res.json({ mensaje: 'Eliminado' });
});

app.get('/api/calificaciones/servicio/:id', (req, res) => {
  res.json(calificaciones.filter(c => c.servicio_id === req.params.id && c.estado === 'aprobada'));
});
app.get('/api/calificaciones/admin/todas', authMiddleware, (req, res) => {
  const cals = calificaciones.map(c => {
    const s = servicios.find(s => s._id === c.servicio_id);
    return { ...c, servicio_id: { _id: c.servicio_id, nombre: s?.nombre || '–' } };
  });
  res.json(cals);
});
app.post('/api/calificaciones', (req, res) => {
  const { servicio_id, cliente_nombre, estrellas, comentario } = req.body;
  if (!servicio_id || !cliente_nombre || !estrellas) return res.status(400).json({ error: 'Campos requeridos' });
  calificaciones.push({ _id: String(++nextId), servicio_id, cliente_nombre, estrellas: parseInt(estrellas), comentario: comentario || '', estado: 'pendiente', respuesta_admin: '' });
  res.status(201).json({ mensaje: 'Calificación enviada' });
});
app.put('/api/calificaciones/:id', authMiddleware, (req, res) => {
  const idx = calificaciones.findIndex(c => c._id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
  calificaciones[idx] = { ...calificaciones[idx], estado: req.body.estado, respuesta_admin: req.body.respuesta_admin || '' };
  const sid = calificaciones[idx].servicio_id;
  const aprobadas = calificaciones.filter(c => c.servicio_id === sid && c.estado === 'aprobada');
  const sIdx = servicios.findIndex(s => s._id === sid);
  if (sIdx !== -1) {
    servicios[sIdx].calificacion_promedio = aprobadas.length ? Math.round(aprobadas.reduce((a, c) => a + c.estrellas, 0) / aprobadas.length * 10) / 10 : 0;
    servicios[sIdx].total_calificaciones = aprobadas.length;
  }
  res.json(calificaciones[idx]);
});
app.delete('/api/calificaciones/:id', authMiddleware, (req, res) => {
  calificaciones = calificaciones.filter(c => c._id !== req.params.id);
  res.json({ mensaje: 'Eliminada' });
});

app.get('/api/stats', authMiddleware, (req, res) => {
  const aprobadas = calificaciones.filter(c => c.estado === 'aprobada');
  res.json({
    totalServicios: servicios.length,
    serviciosActivos: servicios.filter(s => s.activo).length,
    totalCalificaciones: aprobadas.length,
    calificacionesPendientes: calificaciones.filter(c => c.estado === 'pendiente').length,
    promedioGeneral: aprobadas.length ? (aprobadas.reduce((a, c) => a + c.estrellas, 0) / aprobadas.length).toFixed(1) : 0
  });
});

// ─── TIENDAS VIRTUALES ROUTES ──────────────────────────────────────────────────

// Crear tienda
app.post('/api/tiendas', (req, res) => {
  const { nombre, whatsapp, categoria, descripcion, password } = req.body;
  if (!nombre || !whatsapp || !password) {
    return res.status(400).json({ error: 'Nombre, WhatsApp y contraseña son requeridos' });
  }
  let slug = slugify(nombre);
  const base = slug;
  let n = 2;
  while (tiendas.find(t => t.slug === slug)) slug = base + '-' + n++;
  const tienda = {
    _id: String(++tId),
    slug, nombre,
    whatsapp: whatsapp.replace(/\D/g, ''),
    categoria: categoria || 'General',
    descripcion: descripcion || '',
    password_hash: bcrypt.hashSync(password, 8),
    logo: '',
    activa: true,
    fecha: new Date().toISOString()
  };
  tiendas.push(tienda);
  res.status(201).json({ slug, nombre, _id: tienda._id, link: `/tienda/${slug}` });
});

// Info pública de la tienda + productos visibles
app.get('/api/tiendas/:slug', (req, res) => {
  const tienda = tiendas.find(t => t.slug === req.params.slug && t.activa);
  if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });
  res.json({
    nombre: tienda.nombre,
    slug: tienda.slug,
    whatsapp: tienda.whatsapp,
    categoria: tienda.categoria,
    descripcion: tienda.descripcion,
    logo: tienda.logo,
    productos: productos.filter(p => p.tienda_id === tienda._id && p.disponible)
  });
});

// Login de propietario
app.post('/api/tiendas/:slug/login', (req, res) => {
  const tienda = tiendas.find(t => t.slug === req.params.slug);
  if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });
  if (!bcrypt.compareSync(req.body.password || '', tienda.password_hash)) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  const token = jwt.sign({ tienda_id: tienda._id, slug: tienda.slug }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, nombre: tienda.nombre, slug: tienda.slug, whatsapp: tienda.whatsapp });
});

// Actualizar info de la tienda
app.put('/api/tiendas/:slug', tiendaAuthMW, (req, res) => {
  const idx = tiendas.findIndex(t => t.slug === req.params.slug);
  if (idx === -1 || tiendas[idx]._id !== req.storeData.tienda_id) return res.status(403).json({ error: 'Sin acceso' });
  const { nombre, descripcion, logo, whatsapp } = req.body;
  if (nombre) tiendas[idx].nombre = nombre;
  if (descripcion !== undefined) tiendas[idx].descripcion = descripcion;
  if (logo !== undefined) tiendas[idx].logo = logo;
  if (whatsapp) tiendas[idx].whatsapp = whatsapp.replace(/\D/g, '');
  const t = tiendas[idx];
  res.json({ nombre: t.nombre, slug: t.slug, descripcion: t.descripcion, logo: t.logo, whatsapp: t.whatsapp });
});

// Listar todos los productos (admin)
app.get('/api/tiendas/:slug/productos', tiendaAuthMW, (req, res) => {
  const tienda = tiendas.find(t => t.slug === req.params.slug);
  if (!tienda || tienda._id !== req.storeData.tienda_id) return res.status(403).json({ error: 'Sin acceso' });
  res.json(productos.filter(p => p.tienda_id === tienda._id));
});

// Agregar producto
app.post('/api/tiendas/:slug/productos', tiendaAuthMW, (req, res) => {
  const tienda = tiendas.find(t => t.slug === req.params.slug);
  if (!tienda || tienda._id !== req.storeData.tienda_id) return res.status(403).json({ error: 'Sin acceso' });
  const { nombre, precio, descripcion, imagen, categoria } = req.body;
  if (!nombre || precio === undefined || precio === '') return res.status(400).json({ error: 'Nombre y precio requeridos' });
  const prod = {
    _id: String(++pId),
    tienda_id: tienda._id,
    nombre,
    precio: parseFloat(precio),
    descripcion: descripcion || '',
    imagen: imagen || '',
    categoria: categoria || '',
    disponible: true,
    fecha: new Date().toISOString()
  };
  productos.push(prod);
  res.status(201).json(prod);
});

// Subir imagen (devuelve base64 data URL)
app.post('/api/tiendas/:slug/upload', tiendaAuthMW, upload.single('imagen'), (req, res) => {
  const tienda = tiendas.find(t => t.slug === req.params.slug);
  if (!tienda || tienda._id !== req.storeData.tienda_id) return res.status(403).json({ error: 'Sin acceso' });
  if (!req.file) return res.status(400).json({ error: 'No se envió imagen' });
  const b64 = req.file.buffer.toString('base64');
  res.json({ url: `data:${req.file.mimetype};base64,${b64}` });
});

// Actualizar producto
app.put('/api/tiendas/:slug/productos/:id', tiendaAuthMW, (req, res) => {
  const tienda = tiendas.find(t => t.slug === req.params.slug);
  if (!tienda || tienda._id !== req.storeData.tienda_id) return res.status(403).json({ error: 'Sin acceso' });
  const idx = productos.findIndex(p => p._id === req.params.id && p.tienda_id === tienda._id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  const { nombre, precio, descripcion, imagen, categoria, disponible } = req.body;
  productos[idx] = {
    ...productos[idx],
    nombre: nombre ?? productos[idx].nombre,
    precio: precio !== undefined ? parseFloat(precio) : productos[idx].precio,
    descripcion: descripcion ?? productos[idx].descripcion,
    imagen: imagen ?? productos[idx].imagen,
    categoria: categoria ?? productos[idx].categoria,
    disponible: disponible !== undefined ? disponible : productos[idx].disponible
  };
  res.json(productos[idx]);
});

// Eliminar producto
app.delete('/api/tiendas/:slug/productos/:id', tiendaAuthMW, (req, res) => {
  const tienda = tiendas.find(t => t.slug === req.params.slug);
  if (!tienda || tienda._id !== req.storeData.tienda_id) return res.status(403).json({ error: 'Sin acceso' });
  const before = productos.length;
  productos = productos.filter(p => !(p._id === req.params.id && p.tienda_id === tienda._id));
  if (productos.length === before) return res.status(404).json({ error: 'No encontrado' });
  res.json({ mensaje: 'Eliminado' });
});

// ─── HTML SERVING ──────────────────────────────────────────────────────────────
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));
app.get('/catalogo-joyas', (req, res) => res.sendFile(path.join(__dirname, '../public/catalogo-joyas.html')));
app.get('/crear-tienda', (req, res) => res.sendFile(path.join(__dirname, '../public/crear-tienda.html')));
app.get('/tienda/:slug/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin-tienda.html')));
app.get('/tienda/:slug', (req, res) => res.sendFile(path.join(__dirname, '../public/tienda.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

module.exports = app;
