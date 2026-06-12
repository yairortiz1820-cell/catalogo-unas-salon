const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Servicio = require('../models/Servicio');
const Calificacion = require('../models/Calificacion');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  }
});

// Público: obtener servicios activos
router.get('/', async (req, res) => {
  try {
    const { categoria, buscar } = req.query;
    const filtro = { activo: true };
    if (categoria && categoria !== 'Todos') filtro.categoria = categoria;
    if (buscar) filtro.nombre = { $regex: buscar, $options: 'i' };

    const servicios = await Servicio.find(filtro).sort({ fecha_creacion: -1 });
    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// Público: obtener un servicio
router.get('/:id', async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id);
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(servicio);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Admin: crear servicio
router.post('/', auth, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, duracion, categoria } = req.body;
    if (!nombre || !descripcion || !precio || !duracion || !categoria) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const servicio = new Servicio({
      nombre, descripcion,
      precio: parseFloat(precio),
      duracion: parseInt(duracion),
      categoria,
      imagen: req.file ? `/uploads/${req.file.filename}` : ''
    });

    await servicio.save();
    res.status(201).json(servicio);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// Admin: editar servicio
router.put('/:id', auth, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, duracion, categoria, activo } = req.body;
    const update = { nombre, descripcion, precio: parseFloat(precio), duracion: parseInt(duracion), categoria };
    if (activo !== undefined) update.activo = activo === 'true';
    if (req.file) update.imagen = `/uploads/${req.file.filename}`;

    const servicio = await Servicio.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(servicio);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

// Admin: eliminar servicio
router.delete('/:id', auth, async (req, res) => {
  try {
    const servicio = await Servicio.findByIdAndDelete(req.params.id);
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
    if (servicio.imagen) {
      const filePath = path.join(__dirname, '../../', servicio.imagen);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await Calificacion.deleteMany({ servicio_id: req.params.id });
    res.json({ mensaje: 'Servicio eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
});

// Admin: todos los servicios incluyendo inactivos
router.get('/admin/todos', auth, async (req, res) => {
  try {
    const servicios = await Servicio.find().sort({ fecha_creacion: -1 });
    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
