const mongoose = require('mongoose');

const servicioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true },
  precio: { type: Number, required: true, min: 0 },
  duracion: { type: Number, required: true, min: 0 },
  categoria: {
    type: String,
    required: true,
    enum: ['Acrílicas', 'Manicure', 'Pedicure', 'Gel', 'Diseño', 'Spa']
  },
  imagen: { type: String, default: '' },
  calificacion_promedio: { type: Number, default: 0, min: 0, max: 5 },
  total_calificaciones: { type: Number, default: 0 },
  activo: { type: Boolean, default: true },
  fecha_creacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Servicio', servicioSchema);
