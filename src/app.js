const express = require('express');
const cors = require('cors');
const path = require('path');
const tiendasRouter = require('./routes/tiendas');
const productosRouter = require('./routes/productos');

const app = express();
app.use(cors());
app.use(express.json());

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.use('/api/tiendas/:slug/productos', productosRouter);
app.use('/api/tiendas', tiendasRouter);

app.get('/crear-tienda', (req, res) => res.sendFile(path.join(publicDir, 'crear-tienda.html')));
app.get('/tienda/:slug', (req, res) => res.sendFile(path.join(publicDir, 'tienda.html')));
app.get('/admin/:slug', (req, res) => res.sendFile(path.join(publicDir, 'admin-tienda.html')));
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'home.html')));

module.exports = app;
