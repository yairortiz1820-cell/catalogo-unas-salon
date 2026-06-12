const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  nombre: { type: String, required: true },
  fecha_creacion: { type: Date, default: Date.now }
});

adminSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = mongoose.model('Admin', adminSchema);
