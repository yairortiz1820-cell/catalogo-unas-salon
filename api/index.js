require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../src/app');

let conexion = null;
function ensureConnection() {
  if (!conexion) conexion = mongoose.connect(process.env.MONGODB_URI);
  return conexion;
}

module.exports = async (req, res) => {
  await ensureConnection();
  app(req, res);
};
