require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/servicios', require('./src/routes/servicios'));
app.use('/api/calificaciones', require('./src/routes/calificaciones'));
app.use('/api/stats', require('./src/routes/stats'));

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

async function seedDatabase() {
  const Admin = require('./src/models/Admin');
  const Servicio = require('./src/models/Servicio');
  const Calificacion = require('./src/models/Calificacion');

  const adminExiste = await Admin.findOne({ email: 'admin@salon.com' });
  if (!adminExiste) {
    const hash = await bcrypt.hash('admin123', 10);
    await Admin.create({ email: 'admin@salon.com', password_hash: hash, nombre: 'Administrador' });
    console.log('✅ Admin creado: admin@salon.com / admin123');
  }

  const count = await Servicio.countDocuments();
  if (count === 0) {
    const servicios = await Servicio.insertMany([
      {
        nombre: 'Uñas Acrílicas Clásicas',
        descripcion: 'Extensión de uñas acrílicas con acabado natural o con color. Resistentes y duraderas por hasta 3 semanas.',
        precio: 65000,
        duracion: 90,
        categoria: 'Acrílicas',
        calificacion_promedio: 4.8,
        total_calificaciones: 24,
        imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'
      },
      {
        nombre: 'Manicure Tradicional',
        descripcion: 'Limpieza, corte, limado y esmaltado de uñas naturales. Incluye exfoliación de manos.',
        precio: 25000,
        duracion: 45,
        categoria: 'Manicure',
        calificacion_promedio: 4.5,
        total_calificaciones: 18,
        imagen: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400'
      },
      {
        nombre: 'Pedicure Spa Completo',
        descripcion: 'Baño de pies, exfoliación, hidratación profunda, corte y esmaltado. El mejor relax para tus pies.',
        precio: 45000,
        duracion: 60,
        categoria: 'Pedicure',
        calificacion_promedio: 4.9,
        total_calificaciones: 31,
        imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400'
      },
      {
        nombre: 'Uñas en Gel UV',
        descripcion: 'Aplicación de gel UV para mayor resistencia y brillo. Duración de hasta 4 semanas sin astillarse.',
        precio: 55000,
        duracion: 75,
        categoria: 'Gel',
        calificacion_promedio: 4.7,
        total_calificaciones: 15,
        imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'
      },
      {
        nombre: 'Nail Art & Diseños',
        descripcion: 'Diseños artísticos personalizados: flores, líneas, glitter, degradados y mucho más. Cada uña una obra de arte.',
        precio: 80000,
        duracion: 120,
        categoria: 'Diseño',
        calificacion_promedio: 5.0,
        total_calificaciones: 12,
        imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'
      },
      {
        nombre: 'Spa de Manos Premium',
        descripcion: 'Tratamiento completo: exfoliación, baño de parafina, masaje con aceites esenciales y manicure.',
        precio: 70000,
        duracion: 90,
        categoria: 'Spa',
        calificacion_promedio: 4.6,
        total_calificaciones: 9,
        imagen: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400'
      }
    ]);

    await Calificacion.insertMany([
      { servicio_id: servicios[0]._id, cliente_nombre: 'María García', estrellas: 5, comentario: '¡Quedé encantada! Muy profesional y duradero.', estado: 'aprobada' },
      { servicio_id: servicios[0]._id, cliente_nombre: 'Laura P.', estrellas: 5, comentario: 'El mejor servicio de la ciudad, súper recomendado.', estado: 'aprobada' },
      { servicio_id: servicios[1]._id, cliente_nombre: 'Ana Rodríguez', estrellas: 4, comentario: 'Muy buen servicio, precios justos y ambiente agradable.', estado: 'aprobada' },
      { servicio_id: servicios[2]._id, cliente_nombre: 'Carolina M.', estrellas: 5, comentario: 'El pedicure spa es una experiencia increíble. Mis pies quedaron perfectos.', estado: 'aprobada' },
      { servicio_id: servicios[4]._id, cliente_nombre: 'Valentina L.', estrellas: 5, comentario: 'Los diseños son únicos y creativos. Siempre recibo cumplidos.', estado: 'aprobada' }
    ]);

    await Servicio.findByIdAndUpdate(servicios[0]._id, { calificacion_promedio: 5, total_calificaciones: 2 });
    await Servicio.findByIdAndUpdate(servicios[1]._id, { calificacion_promedio: 4, total_calificaciones: 1 });
    await Servicio.findByIdAndUpdate(servicios[2]._id, { calificacion_promedio: 5, total_calificaciones: 1 });
    await Servicio.findByIdAndUpdate(servicios[4]._id, { calificacion_promedio: 5, total_calificaciones: 1 });

    console.log('✅ Datos de ejemplo insertados');
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB conectado');
    await seedDatabase();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`👑 Panel admin: http://localhost:${PORT}/admin`);
    });
  })
  .catch(err => {
    console.error('❌ Error MongoDB:', err.message);
    process.exit(1);
  });
