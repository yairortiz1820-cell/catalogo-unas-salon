const router = require('express').Router();
const Calificacion = require('../models/Calificacion');
const Servicio = require('../models/Servicio');
const auth = require('../middleware/auth');

// Público: obtener calificaciones aprobadas de un servicio
router.get('/servicio/:id', async (req, res) => {
  try {
    const calificaciones = await Calificacion.find({
      servicio_id: req.params.id,
      estado: 'aprobada'
    }).sort({ fecha_creacion: -1 });
    res.json(calificaciones);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Público: enviar calificación
router.post('/', async (req, res) => {
  try {
    const { servicio_id, cliente_nombre, estrellas, comentario } = req.body;
    if (!servicio_id || !cliente_nombre || !estrellas) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }
    if (estrellas < 1 || estrellas > 5) {
      return res.status(400).json({ error: 'Estrellas debe ser entre 1 y 5' });
    }

    const cal = new Calificacion({ servicio_id, cliente_nombre, estrellas: parseInt(estrellas), comentario });
    await cal.save();
    res.status(201).json({ mensaje: 'Calificación enviada, pendiente de aprobación' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Admin: ver todas las calificaciones
router.get('/admin/todas', auth, async (req, res) => {
  try {
    const cals = await Calificacion.find()
      .populate('servicio_id', 'nombre')
      .sort({ fecha_creacion: -1 });
    res.json(cals);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Admin: aprobar/rechazar + responder
router.put('/:id', auth, async (req, res) => {
  try {
    const { estado, respuesta_admin } = req.body;
    const cal = await Calificacion.findByIdAndUpdate(
      req.params.id,
      { estado, respuesta_admin: respuesta_admin || '' },
      { new: true }
    );
    if (!cal) return res.status(404).json({ error: 'Calificación no encontrada' });

    // Recalcular promedio del servicio
    const aprobadas = await Calificacion.find({ servicio_id: cal.servicio_id, estado: 'aprobada' });
    const promedio = aprobadas.length
      ? aprobadas.reduce((a, c) => a + c.estrellas, 0) / aprobadas.length
      : 0;

    await Servicio.findByIdAndUpdate(cal.servicio_id, {
      calificacion_promedio: Math.round(promedio * 10) / 10,
      total_calificaciones: aprobadas.length
    });

    res.json(cal);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Admin: eliminar calificación
router.delete('/:id', auth, async (req, res) => {
  try {
    await Calificacion.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Calificación eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
