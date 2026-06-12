const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

const JWT_SECRET = process.env.JWT_SECRET || 'glamour_nails_secret_2024';
const WA_NUMBER = process.env.WHATSAPP_NUMBER || '573001234567';

// ─── DATOS EN MEMORIA ─────────────────────────────────────────────
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

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}

// AUTH
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === adminUser.email && password === adminUser.password) {
    const token = jwt.sign({ email, nombre: adminUser.nombre }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, nombre: adminUser.nombre });
  }
  res.status(401).json({ error: 'Credenciales incorrectas' });
});

// SERVICIOS
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

// CALIFICACIONES
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

// STATS
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

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

module.exports = app;
