# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Comandos

```bash
# Ejecutar sin MongoDB (datos en memoria, se reinician al reiniciar)
node server-demo.js

# Ejecutar con MongoDB (modo producción, requiere .env)
npm start          # node server.js
npm run dev        # nodemon server.js (hot reload)
```

Este proyecto no tiene test runner ni linter configurado.

`.claude/launch.json` configura el objetivo de ejecución por defecto como `server-demo.js` en el puerto 3000.

Al iniciar cualquiera de los servidores:
- Catálogo cliente: `http://localhost:3000`
- Panel admin: `http://localhost:3000/admin` (credenciales: `admin@salon.com` / `admin123`)

## Arquitectura

La app tiene **tres implementaciones de servidor en paralelo** que exponen la misma API REST:

| Archivo | Persistencia | Uso |
|---------|--------------|-----|
| `server.js` | MongoDB con Mongoose | Producción |
| `server-demo.js` | Arrays en memoria | Desarrollo local sin BD |
| `api/index.js` | Arrays en memoria | Vercel serverless (exporta la app Express como módulo) |

`server.js` siembra la base de datos con servicios y un usuario admin al primer arranque. `server-demo.js` y `api/index.js` llevan datos iniciales hardcodeados en arrays `let` a nivel de módulo que se reinician al reinicar el proceso.

### Flujo de peticiones

Los tres servidores implementan la misma superficie de rutas:

- `POST /api/auth/login` → devuelve un JWT (expiración 8h)
- `GET /api/servicios` → público; acepta `?categoria=` y `?buscar=`
- `GET /api/servicios/admin/todos` → admin; incluye servicios inactivos
- `POST|PUT|DELETE /api/servicios/:id` → admin; PUT/POST aceptan `multipart/form-data` para subir imágenes
- `GET /api/calificaciones/servicio/:id` → público; devuelve solo las de `estado: 'aprobada'`
- `POST /api/calificaciones` → público; las nuevas calificaciones entran como `estado: 'pendiente'`
- `GET /api/calificaciones/admin/todas` → admin; todas las calificaciones con el nombre del servicio populado
- `PUT /api/calificaciones/:id` → admin; aprobar una calificación dispara el recálculo de `calificacion_promedio` y `total_calificaciones` en el `Servicio` padre
- `GET /api/stats` → admin

Las rutas de admin requieren el header `Authorization: Bearer <token>`. En `server.js` esto lo gestiona `src/middleware/auth.js`; los servidores demo usan una función inline equivalente.

### Frontend

HTML/CSS/JS vanilla — sin paso de compilación ni framework.

- `public/index.html` + `public/js/app.js` + `public/css/styles.css` — catálogo para clientes
- `public/admin.html` + `public/js/admin.js` + `public/css/admin.css` — panel de administración

El frontend guarda el JWT en `localStorage` y lo adjunta como Bearer token en cada llamada a rutas de admin.

### Modelos MongoDB (`src/models/`)

- `Servicio` — entrada del catálogo; `categoria` está limitada por enum a `['Acrílicas', 'Manicure', 'Pedicure', 'Gel', 'Diseño', 'Spa']`; `calificacion_promedio` y `total_calificaciones` están desnormalizados y se recalculan en cada aprobación o eliminación de calificación
- `Calificacion` — reseña del cliente; referencia a `Servicio` por ObjectId; `estado` puede ser `pendiente | aprobada | rechazada`
- `Admin` — usuario admin único sembrado al arranque; contraseña almacenada como hash bcrypt; el método de instancia `comparePassword()` gestiona la verificación

### Subida de imágenes

En `server.js`, multer almacena las imágenes subidas en el directorio local `uploads/` (servido como `/uploads/*`). La ruta se guarda en `Servicio.imagen`. En Vercel, el directorio `uploads/` es efímero y no se comparte entre instancias — usar URLs externas (p. ej. Unsplash) para imágenes persistentes en ese entorno.

## Variables de entorno

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/salon_unas
JWT_SECRET=<clave_secreta>
WHATSAPP_NUMBER=573001234567   # Usado en el enlace de reserva por WhatsApp del frontend
SALON_NAME=Salón de Uñas Glamour
```

Copiar `.env.example` a `.env` antes de ejecutar `server.js`. `server-demo.js` y `api/index.js` funcionan sin archivo `.env`.

## Despliegue en Vercel

`vercel.json` redirige todo el tráfico a `api/index.js`, que exporta la app Express. Los datos están en memoria y se reinician en cada arranque en frío. La contraseña del admin está hardcodeada como `admin123` en ese archivo — no usa hash bcrypt.
