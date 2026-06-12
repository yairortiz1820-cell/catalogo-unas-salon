const router = require('express').Router();
const Servicio = require('../models/Servicio');
const Calificacion = require('../models/Calificacion');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [totalServicios, serviciosActivos, totalCalificaciones, pendientes] = await Promise.all([
      Servicio.countDocuments(),
      Servicio.countDocuments({ activo: true }),
      Calificacion.countDocuments({ estado: 'aprobada' }),
      Calificacion.countDocuments({ estado: 'pendiente' })
    ]);

    const promedioGeneral = await Calificacion.aggregate([
      { $match: { estado: 'aprobada' } },
      { $group: { _id: null, promedio: { $avg: '$estrellas' } } }
    ]);

    res.json({
      totalServicios,
      serviciosActivos,
      totalCalificaciones,
      calificacionesPendientes: pendientes,
      promedioGeneral: promedioGeneral[0]?.promedio?.toFixed(1) || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
