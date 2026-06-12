const mongoose = require('mongoose');

const calificacionSchema = new mongoose.Schema({
  servicio_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', required: true },
  cliente_nombre: { type: String, required: true, trim: true },
  estrellas: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, trim: true, default: '' },
  estado: { type: String, enum: ['pendiente', 'aprobada', 'rechazada'], default: 'pendiente' },
  respuesta_admin: { type: String, default: '' },
  fecha_creacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Calificacion', calificacionSchema);
