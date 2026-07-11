# 🏬 CatalogoYa — Plataforma multi-tienda

Crea tu tienda virtual en minutos: sube tus productos, comparte el link y recibe pedidos por WhatsApp.

## Requisitos

- Node.js 18+
- MongoDB (para la versión de producción con `server.js`/`api/index.js`)

## Instalación

```
npm install
```

## Configuración

Copia `.env.example` a `.env` y define:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`

## Ejecución

- `node server.js` — servidor real con MongoDB.
- `node server-demo.js` — servidor de preview con datos en memoria (sin necesidad de MongoDB), incluye 2 tiendas de ejemplo.

## Estructura

- `public/home.html` — landing con CTA a crear tienda.
- `public/crear-tienda.html` — formulario de registro de una tienda nueva.
- `public/tienda.html` — storefront público (`/tienda/:slug`), con carrito y checkout por WhatsApp.
- `public/admin-tienda.html` — panel de administración de una tienda (`/admin/:slug`).
- `src/models` — modelos Mongoose (`Tienda`, `Producto`).
- `src/routes` — rutas de la API (`tiendas`, `productos`).
- `src/middleware` — autenticación por tienda y aislamiento multi-tenant.

## Despliegue

Configurado para Vercel vía `vercel.json` (`api/index.js`).
