# 💅 Salón de Uñas Glamour — App Web Completa

## Requisitos previos
- Node.js 18+
- MongoDB (local o Atlas)

## Instalación

```bash
cd catalogo_unas
npm install
```

## Configuración

Edita el archivo `.env` con tus datos:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/salon_unas
JWT_SECRET=tu_clave_secreta
WHATSAPP_NUMBER=573001234567   ← Cambia por tu número
SALON_NAME=Glamour Nails
```

## Ejecutar

```bash
node server.js
```

- 🌐 App cliente: http://localhost:3000
- 👑 Panel admin: http://localhost:3000/admin
- 📧 Admin: admin@salon.com
- 🔑 Contraseña: admin123

## Estructura
```
catalogo_unas/
├── server.js              ← Servidor principal
├── .env                   ← Variables de entorno
├── src/
│   ├── models/            ← Modelos MongoDB
│   ├── routes/            ← Rutas API
│   └── middleware/        ← Auth JWT
├── public/
│   ├── index.html         ← Página cliente
│   ├── admin.html         ← Panel admin
│   ├── css/               ← Estilos
│   └── js/                ← JavaScript
└── uploads/               ← Imágenes subidas
```

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Login admin |
| GET | /api/servicios | Servicios activos (público) |
| POST | /api/servicios | Crear servicio (admin) |
| PUT | /api/servicios/:id | Editar servicio (admin) |
| DELETE | /api/servicios/:id | Eliminar servicio (admin) |
| GET | /api/calificaciones/servicio/:id | Calificaciones de servicio |
| POST | /api/calificaciones | Enviar calificación |
| GET | /api/stats | Estadísticas (admin) |

## Personalización
- Cambia `WHATSAPP_NUMBER` en `.env` por tu número real
- Actualiza los datos de contacto en `public/index.html` (footer)
- Modifica colores en `public/css/styles.css` (variables CSS)
