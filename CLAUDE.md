# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run without MongoDB (in-memory data, resets on restart)
node server-demo.js

# Run with MongoDB (production mode, requires .env)
npm start          # node server.js
npm run dev        # nodemon server.js (hot reload)
```

There is no test runner or linter configured in this project.

The `.claude/launch.json` configures the default run target as `server-demo.js` on port 3000.

After starting either server:
- Customer catalog: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin` (credentials: `admin@salon.com` / `admin123`)

## Architecture

This app has **three parallel server implementations** that expose the same REST API:

| File | Persistence | Use case |
|------|-------------|----------|
| `server.js` | MongoDB via Mongoose | Production |
| `server-demo.js` | In-memory arrays | Local dev without DB |
| `api/index.js` | In-memory arrays | Vercel serverless (exports Express app as a module) |

`server.js` seeds the database with sample services and an admin user on first run. `server-demo.js` and `api/index.js` carry identical hardcoded seed data in module-level `let` arrays that reset on restart.

### Request flow

All three servers implement the same route surface:

- `POST /api/auth/login` → returns a JWT (8h expiry)
- `GET /api/servicios` → public; supports `?categoria=` and `?buscar=` query params
- `GET /api/servicios/admin/todos` → admin; includes inactive services
- `POST|PUT|DELETE /api/servicios/:id` → admin; PUT/POST accept `multipart/form-data` for image upload
- `GET /api/calificaciones/servicio/:id` → public; returns only `estado: 'aprobada'`
- `POST /api/calificaciones` → public; new ratings enter as `estado: 'pendiente'`
- `GET /api/calificaciones/admin/todas` → admin; all ratings with populated service name
- `PUT /api/calificaciones/:id` → admin; approving a rating triggers recalculation of `calificacion_promedio` and `total_calificaciones` on the parent `Servicio`
- `GET /api/stats` → admin

Admin routes require `Authorization: Bearer <token>` header. In `server.js` this is handled by `src/middleware/auth.js`; the demo servers use an equivalent inline function.

### Frontend

Vanilla HTML/CSS/JS — no build step, no framework.

- `public/index.html` + `public/js/app.js` + `public/css/styles.css` — customer-facing catalog
- `public/admin.html` + `public/js/admin.js` + `public/css/admin.css` — admin panel

The frontend stores the JWT in `localStorage` and attaches it to every admin API call as a Bearer token.

### MongoDB models (`src/models/`)

- `Servicio` — the catalog entry; `categoria` is enum-constrained to `['Acrílicas', 'Manicure', 'Pedicure', 'Gel', 'Diseño', 'Spa']`; `calificacion_promedio` and `total_calificaciones` are denormalized and recomputed on every rating approval/deletion
- `Calificacion` — customer review; references `Servicio` by ObjectId; `estado` is `pendiente | aprobada | rechazada`
- `Admin` — single admin user seeded on startup; password stored as bcrypt hash; `comparePassword()` instance method handles verification

### Image uploads

In `server.js`, multer stores uploaded images in the local `uploads/` directory (served as `/uploads/*`). The path is saved in `Servicio.imagen`. On Vercel, the `uploads/` directory is ephemeral and not shared across instances — use external URLs (e.g. Unsplash) for persistent images in that environment.

## Environment variables

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/salon_unas
JWT_SECRET=<secret>
WHATSAPP_NUMBER=573001234567   # Used in the WhatsApp booking link on the frontend
SALON_NAME=Salón de Uñas Glamour
```

Copy `.env.example` to `.env` before running `server.js`. `server-demo.js` and `api/index.js` work without a `.env` file.

## Vercel deployment

`vercel.json` routes all traffic through `api/index.js`, which exports the Express app. Data is in-memory and resets on each cold start. The admin password is hardcoded as `admin123` in that file — not bcrypt-hashed.
