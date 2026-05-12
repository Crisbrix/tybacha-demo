# Tybacha Backend

Base Node.js + Express para la API RESTful de Tybacha.

Derechos de autor: Samuel Segura Vargas y Cristhian Ramírez.

## Incluye

- Registro y login con bcrypt y JWT.
- Middleware de autenticacion y restriccion por rol.
- Endpoints iniciales para adultos mayores y generacion de planes.
- Pool MySQL/TiDB con SSL.
- Validacion de entrada con Zod.
- Logs estructurados con Pino.
- Auditoria basica de acciones.

## Uso

```bash
npm install
cp .env.example .env
npm run dev
```

Antes de ejecutar, configura TiDB Cloud en `.env` y aplica `../database/schema.sql`.

## Pendiente para produccion

- Migraciones versionadas con una herramienta como Drizzle, Prisma, Knex o Flyway.
- Integracion real con Gemini en `/plans/generate`.
- Refresh tokens, revocacion de sesiones y cookies seguras.
- Pruebas automatizadas de seguridad, permisos y validaciones.
- Monitoreo Vercel/Firebase y backups programados de TiDB.
