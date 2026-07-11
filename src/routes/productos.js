const express = require('express');
const Tienda = require('../models/Tienda');
const Producto = require('../models/Producto');
const tenantAuth = require('../middleware/tenantAuth');
const verifyTenantSlug = require('../middleware/verifyTenantSlug');

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const tienda = await Tienda.findOne({ slug: req.params.slug });
  if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });

  const filtro = { tiendaId: tienda._id, visible: true };
  if (req.query.categoria && req.query.categoria !== 'Todos') filtro.categoria = req.query.categoria;
  if (req.query.buscar) filtro.nombre = { $regex: req.query.buscar, $options: 'i' };

  const productos = await Producto.find(filtro).sort({ createdAt: -1 });
  res.json(productos);
});

router.get('/admin', tenantAuth, verifyTenantSlug, async (req, res) => {
  const productos = await Producto.find({ tiendaId: req.tienda.tiendaId }).sort({ createdAt: -1 });
  res.json(productos);
});

router.get('/:id', async (req, res) => {
  const producto = await Producto.findById(req.params.id);
  if (!producto || !producto.visible) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

router.post('/', tenantAuth, verifyTenantSlug, async (req, res) => {
  const { nombre, descripcion, precio, categoria, imagen } = req.body;
  if (!nombre || precio === undefined) return res.status(400).json({ error: 'Nombre y precio son requeridos' });

  const producto = await Producto.create({
    tiendaId: req.tienda.tiendaId, nombre, descripcion: descripcion || '', precio: parseFloat(precio),
    categoria: categoria || 'General', imagen: imagen || ''
  });
  res.status(201).json(producto);
});

router.put('/:id', tenantAuth, verifyTenantSlug, async (req, res) => {
  const { nombre, descripcion, precio, categoria, imagen, visible } = req.body;
  const producto = await Producto.findOneAndUpdate(
    { _id: req.params.id, tiendaId: req.tienda.tiendaId },
    { nombre, descripcion, precio: parseFloat(precio), categoria, imagen, visible },
    { new: true }
  );
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

router.patch('/:id/visibilidad', tenantAuth, verifyTenantSlug, async (req, res) => {
  const producto = await Producto.findOne({ _id: req.params.id, tiendaId: req.tienda.tiendaId });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  producto.visible = !producto.visible;
  await producto.save();
  res.json(producto);
});

router.delete('/:id', tenantAuth, verifyTenantSlug, async (req, res) => {
  const producto = await Producto.findOneAndDelete({ _id: req.params.id, tiendaId: req.tienda.tiendaId });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json({ mensaje: 'Eliminado' });
});

module.exports = router;
