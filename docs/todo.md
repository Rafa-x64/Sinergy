# Roadmap y Tareas — Sinergy

Lista de tareas organizada por fases. Marca las tareas a medida que se completan.

**Leyenda:**
- `[ ]` Pendiente
- `[/]` En progreso
- `[x]` Completado
- `[~]` Pospuesto / Descartado

---

## Fase 0 — Infraestructura y Configuración del Proyecto

### Monorepo y tooling
- `[x]` Crear estructura de monorepo con `pnpm workspaces`
- `[x]` Configurar `apps/frontend` (Vue 3 + Vite + TypeScript + Bootstrap)
- `[x]` Configurar `apps/backend` (Node.js + Express + TypeScript)
- `[x]` Script `pnpm dev` para arrancar ambos proyectos en paralelo
- `[x]` Script `pnpm dev:frontend` y `pnpm dev:backend` por separado
- `[x]` Configurar Prisma ORM en el backend
- `[x]` Definir esquema inicial de la base de datos (Planta, Equipo, Usuario, Inspeccion, Rol)
- `[x]` Crear singleton de `PrismaClient` en `infrastructure/`
- `[x]` Health check del backend en `GET /api/health`
- `[x]` Chunking de Vite configurado para librerías pesadas (charts, docs)
- `[ ]` Configurar ESLint + Prettier en ambos workspaces
- `[x]` Crear repositorio privado en GitHub y hacer primer push

### Documentación base
- `[x]` `docs/architecture.md` — Estructura, capas, diagramas y ADRs
- `[x]` `docs/extensions/extensions.md` — Guía de todas las librerías
- `[x]` `docs/guia-desarrollador.md` — Guía de desarrollo cronológica
- `[x]` `docs/setup.md` — Instrucciones de instalación
- `[x]` `docs/changelog.md` — Historial de cambios
- `[x]` `docs/todo.md` — Este archivo
- `[x]` `docs/notas.md` — Notas de levantamiento de requisitos

---

## Fase 1 — Autenticación y Gestión de Usuarios

### Backend
- `[x]` Modelo `Usuario` completo en Prisma con hash de contraseña (bcrypt)
- `[x]` `POST /api/auth/login` — Genera JWT Access Token (15 min) + Refresh Cookie (7 días)
- `[x]` `POST /api/auth/logout` — Invalida la cookie HttpOnly de Refresh Token
- `[x]` `POST /api/auth/refresh` — Renueva el Access Token usando la HttpOnly Cookie
- `[x]` Middleware `autenticar.ts` (`validarJWT`) — Verifica JWT en rutas protegidas
- `[x]` Middleware `validarSchema.ts` — Valida esquemas Zod en tiempo de ejecución
- `[x]` `GET /api/auth/` — Lista todos los usuarios (protegido con JWT)
- `[x]` `GET /api/auth/listar` — Lista usuarios activos (protegido con JWT)
- `[x]` `POST /api/auth/crear` — Crear usuario (protegido con JWT)
- `[x]` `PATCH /api/auth/editar/:id` — Actualizar datos (protegido con JWT)
- `[x]` `DELETE /api/auth/eliminar/:id` — Deshabilitar usuario (protegido con JWT)

### Frontend
- `[ ]` Vista `LoginView.vue` — Formulario con VeeValidate + Yup
- `[ ]` `authStore.ts` — Token, rol, datos del usuario, login/logout
- `[ ]` Interceptor Axios: adjuntar JWT + redirigir en 401
- `[ ]` Guard de ruta en Vue Router por `meta.requiresAuth` y `meta.roles`
- `[ ]` Vista `UsuariosView.vue` — Lista y gestión (solo SUPERVISOR)

---

## Fase 2 — Gestión de Plantas, Equipos y Técnicos

### Backend
- `[ ]` `GET /api/plantas` — Lista las 3 plantas
- `[ ]` `GET /api/equipos?plantaId=` — Equipos filtrados por planta
- `[ ]` `POST /api/equipos` — Crear equipo con código y tipo
- `[ ]` `GET /api/tecnicos/planta/:plantaId` — Técnicos por planta
- `[ ]` `POST /api/tecnicos` — Crear técnico asociado a una planta
- `[ ]` Migración de datos desde `Maestros.xlsx` (script de seed)

### Frontend
- `[ ]` Vista `PlantaView.vue` — Selección de planta activa
- `[ ]` Vista `EquiposView.vue` — Lista de equipos con filtros
- `[ ]` Vista `TecnicosView.vue` — Lista y formulario (solo SUPERVISOR)
- `[ ]` Componente `EquipoCard.vue` — Tarjeta de resumen del equipo

---

## Fase 3 — Módulos de Inspección

### Módulo: Montacargas
- `[ ]` Modelo `InspeccionMontacargas` en Prisma (o usar campo `datos: Json`)
- `[ ]` `POST /api/inspecciones/montacargas` — Registrar inspección
- `[ ]` `GET /api/inspecciones/montacargas?equipoId=` — Historial con paginación
- `[ ]` Vista `MontacargasInspeccionView.vue` — Formulario de captura
- `[ ]` Vista `MontacargasHistorialView.vue` — Lista con filtros y búsqueda
- `[ ]` Soporte offline (Dexie) para la captura de montacargas

### Módulo: Compresor
- `[ ]` `POST /api/inspecciones/compresor`
- `[ ]` `GET /api/inspecciones/compresor?equipoId=`
- `[ ]` Vista `CompresorInspeccionView.vue`
- `[ ]` Vista `CompresorHistorialView.vue`

### Módulo: Generador
- `[ ]` `POST /api/inspecciones/generador`
- `[ ]` `GET /api/inspecciones/generador?equipoId=`
- `[ ]` Vista `GeneradorInspeccionView.vue` con secciones (Check, Variables, Baterías, Observaciones)
- `[ ]` Vista `GeneradorHistorialView.vue`

### Módulo: Chiller
- `[ ]` Pendiente de levantamiento de requisitos con el equipo técnico
- `[ ]` `[ ]` ... (completar tras reunión)

### Funcionalidades transversales de inspección
- `[ ]` Valores por defecto "Normal" en campos de selección
- `[ ]` Una sola observación al final (no por variable)
- `[ ]` Tooltips de ayuda en pantalla por campo
- `[ ]` Adjuntar imagen por componente (opcional)
- `[ ]` Composable `useSync.ts` — Guardar offline + sincronizar al reconectarse

---

## Fase 4 — Dashboard y Reportes (SUPERVISOR / GERENTE / ADMIN)

### Backend
- `[x]` Endpoints consolidados en `/api/dashboard/*` (`reporte-flota`, `inspecciones-periodo`, `no-conformidades`, `reporte-ejecutivo`, `matriz-criticidad`, `tarjeta-ronda/:equipoId`)
- `[x]` `GET /api/dashboard/disponibilidad` y `GET /api/dashboard/top-fallas` — KPIs para el dashboard
- `[x]` Módulo de Notificaciones y WebSockets (`/api/notificaciones/*`, Socket.io) con salas por rol (`rol_admin`, `rol_supervisor`, `rol_tecnico`) y por planta
- `[x]` Alias de rutas RESTful en `/api/plantas` y `/api/equipos` para catálogos auxiliares

### Frontend
- `[x]` Vista `DashboardView.vue` — Estadísticas e indicadores en tiempo real con Chart.js
- `[x]` Componente `PanelReportes.vue` — Centro de Emisión de Reportes Normativos R1 a R6 con filtros independientes mediante `Promise.allSettled`
- `[x]` Utilitario `pdfExport.ts` — Generación y exportación de reportes a PDF estructurado
- `[x]` Exportación a Excel con librería `xlsx` para reportes R1, R2, R3 y R5
- `[x]` Componente `NotificationBell.vue` con badge interactivo, chip de estado en vivo y popover de alertas
- `[x]` Vista `NotificacionesGlobalesView.vue` para auditoría y bitácora en vivo
- `[x]` Conexión WebSocket inmediata al autenticarse mediante watcher en `Menu.vue`
- `[ ]` Integración con Power BI (pendiente acceso)

---

## Fase 5 — Calidad, Seguridad y Producción

### Seguridad
- `[ ]` Implementar refresh tokens (JWT de corta vida + refresh)
- `[ ]` Rate limiting en Express (`express-rate-limit`)
- `[ ]` Validación y sanitización de inputs en el backend (middleware)
- `[ ]` HTTPS en producción
- `[ ]` Variables de entorno en producción con secretos seguros (no `.env` en servidor)

### Testing
- `[ ]` Tests unitarios para casos de uso del backend (Jest o Vitest)
- `[ ]` Tests de integración para los endpoints de la API
- `[ ]` Tests de componentes críticos del frontend (Vitest + Vue Test Utils)

### Optimización y producción
- `[ ]` Configurar servidor de producción (Nginx o similar)
- `[ ]` Pipeline CI/CD básico en GitHub Actions
- `[ ]` Script de seed con datos reales de Maestros.xlsx para staging
- `[ ]` Monitoreo de errores del backend (Sentry u otro)
- `[x]` Documentar API REST en `docs/api/contratos.md` (contratos de endpoints, esquemas Zod, cookies y respuestas)

---

## Backlog / Ideas Futuras

- `[ ]` Módulo de "Reportar condición" — Los técnicos reportan fallos de la app
- `[ ]` Reparar módulo de instrumentos de medición (herencia del sistema viejo)
- `[ ]` Notificaciones push cuando hay inspecciones vencidas
- `[ ]` Historial de auditoría de cambios (quién modificó qué y cuándo)
- `[ ]` Conversión de unidades de medida en la captura
- `[ ]` Acceso a Power App y Power BI para indicadores de mantenimiento
