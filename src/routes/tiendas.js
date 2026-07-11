const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Tienda = require('../models/Tienda');
const Producto = require('../models/Producto');
const { generarSlugUnico } = require('../utils/slug');
const tenantAuth = require('../middleware/tenantAuth');
const verifyTenantSlug = require('../middleware/verifyTenantSlug');

const router = express.Router();

function firmarToken(tienda) {
  return jwt.sign(
    { tiendaId: tienda._id.toString(), slug: tienda.slug, nombre: tienda.nombre },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

router.post('/', async (req, res) => {
  const { nombre, whatsapp, categoria, descripcion, password } = req.body;
  if (!nombre || !whatsapp || !password) {
    return res.status(400).json({ error: 'Nombre, WhatsApp y contraseña son requeridos' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
  }

  const slug = await generarSlugUnico(nombre, Tienda);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const tienda = await Tienda.create({
      nombre, whatsapp, categoria: categoria || 'General', descripcion: descripcion || '', slug, passwordHash
    });
    const token = firmarToken(tienda);
    res.status(201).json({ token, tienda: { slug: tienda.slug, nombre: tienda.nombre, categoria: tienda.categoria, descripcion: tienda.descripcion, whatsapp: tienda.whatsapp, logoEmoji: tienda.logoEmoji } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya existe una tienda con ese nombre, intenta de nuevo' });
    res.status(500).json({ error: 'Error creando la tienda' });
  }
});

router.post('/login', async (req, res) => {
  const { slug, password } = req.body;
  const tienda = await Tienda.findOne({ slug });
  if (!tienda || !(await tienda.comparePassword(password))) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  const token = firmarToken(tienda);
  res.json({ token, tienda: { slug: tienda.slug, nombre: tienda.nombre, categoria: tienda.categoria, descripcion: tienda.descripcion, whatsapp: tienda.whatsapp, logoEmoji: tienda.logoEmoji } });
});

router.get('/:slug', async (req, res) => {
  const tienda = await Tienda.findOne({ slug: req.params.slug, activa: true });
  if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });
  res.json({ slug: tienda.slug, nombre: tienda.nombre, categoria: tienda.categoria, descripcion: tienda.descripcion, whatsapp: tienda.whatsapp, logoEmoji: tienda.logoEmoji });
});

router.get('/:slug/stats', tenantAuth, verifyTenantSlug, async (req, res) => {
  const [totalProductos, activos] = await Promise.all([
    Producto.countDocuments({ tiendaId: req.tienda.tiendaId }),
    Producto.countDocuments({ tiendaId: req.tienda.tiendaId, visible: true })
  ]);
  res.json({ totalProductos, activos, ocultos: totalProductos - activos });
});

module.exports = router;
