const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tiendaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  whatsapp: { type: String, required: true },
  categoria: { type: String, default: 'General' },
  descripcion: { type: String, default: '' },
  passwordHash: { type: String, required: true },
  logoEmoji: { type: String, default: '🏪' },
  activa: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

tiendaSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('Tienda', tiendaSchema);
