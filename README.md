# Tybacha

Aplicacion para gestion, seguimiento y monitoreo de adultos mayores.

Derechos de autor: Samuel Segura Vargas y Cristhian Ramírez.

## Como usar el mock web

Abre `login.html` en el navegador. No requiere instalacion ni servidor.

Usuarios demo:

- `admin@tybacha.local`
- `profesional@tybacha.local`
- `cuidador@tybacha.local`

Usa cualquier contrasena de 4 o mas caracteres.

Los adultos mayores se registran como fichas de atencion y seguimiento. No tienen cuenta de acceso al aplicativo en este mock.

## Modulos navegables

- Login y registro
- Dashboard principal
- Gestion de usuarios, roles y perfil
- Gestion de adultos mayores y ficha integral
- Historial medico
- Gestion de cuidadores
- Pruebas SFT e historial
- Planes manuales y generados con IA simulada
- Seguimiento diario y bitacora
- Alertas y notificaciones
- Reportes exportables
- Consentimientos
- Auditoria
- Configuracion del sistema

## Base tecnica agregada

- `styles.css`: interfaz responsive y accesible.
- `data.js`: datos simulados, roles, permisos y entidades principales.
- `app.js`: autenticacion simulada, permisos por rol, navegacion y flujos principales.
- `database/schema.sql`: esquema TiDB/MySQL recomendado.
- `backend/`: base Express con JWT, bcrypt, validacion, pool TiDB y endpoints iniciales.

## Nota tecnica

El mock web funciona de forma local con `localStorage`. Para produccion se debe conectar el frontend/mobile a la API real, instalar dependencias del backend, configurar TiDB Cloud con SSL y conectar Gemini para generar planes reales.
