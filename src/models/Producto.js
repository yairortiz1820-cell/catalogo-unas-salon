const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  tiendaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tienda', required: true, index: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '' },
  precio: { type: Number, required: true, min: 0 },
  categoria: { type: String, default: 'General' },
  imagen: { type: String, default: '' },
  visible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Producto', productoSchema);
