# FanRangers

Plataforma de streaming de contenido de dominio público y licencias Creative Commons.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Base de datos | SQLite (dev) · PostgreSQL (prod) + Prisma ORM |
| Auth | JWT en cookie HttpOnly (`sv_token`) |

## Estructura

```
FanRangers/
├── frontend/   # React SPA
└── backend/    # API REST + Prisma
```

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
# Backend
cd backend
npm install
cp .env.example .env   # edita las variables (ver sección de abajo)
npx prisma migrate dev
npx prisma db seed     # crea el usuario admin inicial

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

## Variables de entorno

### `backend/.env`

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión Prisma. Para SQLite local: `file:./prisma/dev.db` |
| `JWT_SECRET` | Secreto para firmar tokens JWT. Usa una cadena larga y aleatoria en producción. |
| `PORT` | Puerto del servidor (por defecto `3001`) |
| `ALLOWED_ORIGIN` | Origen permitido para CORS (URL del frontend) |
| `COOKIE_SECURE` | `true` en producción (HTTPS). `false` en desarrollo local. |
| `TRUST_PROXY` | Número de proxies inversos delante del servidor (0 si ninguno) |
| `ADMIN_EMAIL` | Email del usuario administrador creado por el seed |
| `ADMIN_PASSWORD` | Contraseña del administrador (cámbiala después del primer login) |
| `SHORTENER_SERVICE` | Servicio de acortador de URLs para descargas. Actualmente: `tinyurl` |
| `SHORTENER_API_KEY` | API key del acortador. Dejar vacío para deshabilitar. |

### `frontend/.env`

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend (e.g. `http://localhost:3001`) |
| `VITE_APP_NAME` | Nombre de la app mostrado en la UI |
| `VITE_HERO_IMAGE` | URL de imagen para el banner principal (opcional) |
| `VITE_KOFI_USERNAME` | Usuario de Ko-fi para el botón de donación (opcional) |
| `VITE_CONTACT_EMAIL` | Email de contacto para soporte Premium |

## Ejecutar en desarrollo

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

El frontend arranca en `http://localhost:5173` y proxea las llamadas API al backend en `http://localhost:3001`.

## Build de producción

```bash
# Frontend
cd frontend
npm run build   # genera dist/

# Backend
cd backend
npm run build   # compila TypeScript a dist/
node dist/index.js
```

## Roles de usuario

| Rol | Acceso |
|---|---|
| Visitante | Catálogo, colecciones, reproductor, descargas con acortador |
| `FREE` | Igual que visitante + cuenta propia |
| `PREMIUM` | Sin anuncios + descargas directas sin acortador |
| `ADMIN` | Panel de administración + gestión de usuarios |

La activación de Premium es manual: el usuario dona vía Ko-fi, escribe al email de contacto y el admin asigna el rol desde `/admin/users`.

## Panel de administración

Disponible en `/admin` para usuarios con rol `ADMIN`. Permite gestionar colecciones, temporadas, episodios, videos y usuarios.

## Licencia

El código fuente de esta plataforma es privado. El contenido publicado en la plataforma está bajo dominio público o licencias Creative Commons según se indica en cada ítem.
