# Despliegue en Render (plan gratis)

FanRangers se despliega como **UN solo servicio web**: el backend Express sirve
la API **y** el build estático del frontend (React/Vite), más una base de datos
**PostgreSQL** gratis. Todo está descrito en [`render.yaml`](./render.yaml)
(Blueprint), así que el despliegue es reproducible.

## Cómo encaja todo

| Pieza | Configuración |
|---|---|
| Servidor | Escucha en `process.env.PORT` y host `0.0.0.0`. |
| Build | `npm ci && npm run build` (backend) + build del frontend, que se copia a `backend/public`. |
| Arranque | `npm run start:prod` → `prisma migrate deploy && node dist/index.js` (las migraciones se aplican solas en cada deploy). |
| BD | PostgreSQL. La conexión llega por `DATABASE_URL`, inyectada desde la BD del Blueprint (`fromDatabase`). |
| Frontend → API | Mismo origen: el bundle llama a `/api/...` con rutas relativas (`VITE_API_URL` vacío en `frontend/.env.production`). |
| Health check | `GET /health`. |

## Variables de entorno

Casi todas las gestiona `render.yaml` automáticamente. Solo tienes que rellenar
a mano las marcadas con **✍️** (en Render: *Service → Environment*).

| Variable | Origen | Notas |
|---|---|---|
| `DATABASE_URL` | Automática (`fromDatabase`) | Cadena de conexión PostgreSQL. |
| `JWT_SECRET` | Automática (`generateValue`) | Secreto JWT (≥32 chars). |
| `NODE_ENV` | Automática (`production`) | Activa las guardas de seguridad. |
| `COOKIE_SECURE` | Automática (`true`) | Cookie de sesión solo HTTPS. |
| `TRUST_PROXY` | Automática (`1`) | 1 proxy inverso (Render). |
| `ALLOWED_ORIGIN` | Automática (`fromService` host) | URL propia del servicio. Si el login fallara por CORS, ponla a mano: `https://TU-SERVICIO.onrender.com`. |
| `SHORTENER_SERVICE` | Automática (`tinyurl`) | Acortador de descargas. |
| `ADMIN_EMAIL` | **✍️ A mano** | Email del admin inicial (para el seed). |
| `ADMIN_PASSWORD` | **✍️ A mano** | Contraseña del admin inicial. Cámbiala tras el primer login. |
| `SHORTENER_API_KEY` | **✍️ A mano** (opcional) | Token de TinyURL. Vacío = acortado desactivado. |

### Variables del frontend (build-time, opcionales)

Se incrustan en el bundle **al compilar**. Edita `frontend/.env.production` o
defínelas en Render **antes** del build:
`VITE_APP_NAME`, `VITE_HERO_IMAGE`, `VITE_KOFI_USERNAME`, `VITE_CONTACT_EMAIL`.
(`VITE_API_URL` se deja vacío a propósito: la API es del mismo origen.)

## Pasos manuales (en orden)

1. **Sube el repo a GitHub**
   ```bash
   git add -A
   git commit -m "chore: configuración de despliegue en Render"
   git remote add origin https://github.com/TU-USUARIO/FanRangers.git
   git push -u origin master
   ```
2. **Crea el Blueprint en Render**: New → *Blueprint* → conecta el repo. Render
   detecta `render.yaml` y crea el servicio web + la base de datos PostgreSQL.
3. **Rellena las variables ✍️**: `ADMIN_EMAIL`, `ADMIN_PASSWORD` (y
   `SHORTENER_API_KEY` si la usas). Guarda → se dispara un deploy.
4. **Espera al primer deploy.** En el arranque se ejecuta `prisma migrate deploy`
   y se crean todas las tablas en PostgreSQL.
5. **Crea el usuario admin** (una sola vez): en Render abre la *Shell* del
   servicio y ejecuta:
   ```bash
   npm run db:seed
   ```
   Crea el contenido de ejemplo y el admin a partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
   > ⚠️ El seed borra el contenido (colecciones/temporadas/episodios/vídeos) antes
   > de insertar. Ejecútalo **solo la primera vez**, no en cada deploy.
6. **Comprueba**: abre `https://TU-SERVICIO.onrender.com`, entra en `/login` con
   el admin y verifica el panel `/admin`.

## Avisos importantes (revisión humana)

- **Disco efímero**: en el plan gratis no hay almacenamiento persistente. Los
  datos (usuarios, colecciones, progreso) viven en PostgreSQL → seguros. Pero las
  **miniaturas que subas desde el panel admin** se guardan en disco
  (`uploads/`) y **se borran en cada redeploy**. Recomendado: usar **URLs de
  miniatura externas** (el campo acepta `http(s)://`), o añadir almacenamiento de
  objetos (S3/Cloudinary) si necesitas subirlas. Los vídeos son IDs de YouTube,
  así que no se ven afectados.
- **Cold starts**: el servicio gratis se suspende tras inactividad; la primera
  petición tras dormir tarda unos segundos.
- **CSP desactivada**: para servir la SPA con YouTube/Fuentes/Ko-fi se desactivó
  la Content-Security-Policy de Helmet. Definir una CSP a medida es una mejora
  recomendada.
- Revisa manualmente el código de **auth, formularios y pagos/donaciones** antes
  de exponerlo a usuarios reales.
