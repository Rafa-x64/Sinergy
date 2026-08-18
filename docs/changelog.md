# Changelog — Sinergy

Todos los cambios notables del proyecto se documentan en este archivo.

El formato sigue el estándar [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

**Guía de cambios:**
- `Added` — Funcionalidades nuevas.
- `Changed` — Cambios en funcionalidades existentes.
- `Deprecated` — Funcionalidades que serán eliminadas próximamente.
- `Removed` — Funcionalidades eliminadas.
- `Fixed` — Correcciones de bugs.
- `Security` — Correcciones de vulnerabilidades.

---

## [Unreleased]

### Added
- **Control de Acceso por Roles (RBAC) y Menú Dinámico**: Implementación de filtrado de menú en `Menu.vue` usando `authStore.tieneRol` y decodificación de payload JWT en `auth.store.ts`. Restricción de navegación mediante `meta.roles` y guard `router.beforeEach` en `router.ts`. (`apps/frontend/src/modules/auth/auth.store.ts`, `apps/frontend/src/core/router.ts`, `apps/frontend/src/components/Menu.vue`)
- **Estandarización de `apiFetch` en `auth.store.ts`**: Implementación de la función `apiFetch` para consumo centralizado de la API REST, inyectando automáticamente `Authorization: Bearer <accessToken>`, `credentials: 'include'` y prefijo `API_URL`. (`apps/frontend/src/modules/auth/auth.store.ts`)
- **Vistas y Componentes de Interfaz (`LoginView.vue`, `DashboardView.vue`, `Menu.vue`, `SinergyChip.vue`)**: Implementación del formulario de inicio de sesión con Vuetify 3, vista inicial de Dashboard con pestañas, menú responsivo adaptativo (drawer permanente en desktop y app-bar en móvil) y componente visual `SinergyChip`. (`apps/frontend/src/modules/auth/views/LoginView.vue`, `apps/frontend/src/modules/dashboard/views/DashboardView.vue`, `apps/frontend/src/components/Menu.vue`, `apps/frontend/src/components/SinergyChip.vue`)
- **Restauración Automática de Sesión en Navigation Guard**: Configuración de `router.beforeEach` en `src/core/router.ts` llamando a `authStore.refrescarToken()` para persistencia transparente de la sesión mediante cookies HttpOnly en recargas de página.

### Fixed
- **Reactividad y Propagación en Cascada de Plantillas e Instancias de Variables (`variables.store.ts`, `variable-critica.service.ts`)**:
  - **Backend**: Implementada propagación automática en cascada en `crearPlantilla` (crea instancias `Variable` en todos los componentes existentes del tipo de equipo), `editarPlantilla` (actualiza campos y opciones en todas las instancias activas) y `eliminarPlantilla` (desactiva instancias vinculadas).
  - **Frontend Store**: Estandarizada la reactividad bidireccional en `variables.store.ts` para que todas las mutaciones (`crearPlantilla`, `editarPlantilla`, `eliminarPlantilla`, `sincronizarTipoEquipo`, `sincronizarComponente`, `crearVariable`, `eliminarVariable`) refresquen concurrentemente tanto el árbol jerárquico (`cargarArbolJerarquico`), como la lista de plantillas (`cargarPlantillasPorTipo`) y las variables del componente activo (`cargarVariablesComponente`), manteniendo actualizados los badges de instancias en tiempo real.

### Changed
- **Guía del Desarrollador y Arquitectura (`docs/guia-desarrollador.md`, `docs/architecture.md`)**: Actualización de los estándares del frontend, eliminación de dependencias de `localStorage` para tokens JWT en favor de Access Token en memoria, y formalización de `apiFetch` como función estándar de consumo de servicios.
- **Integración de Vuetify 3 y Material Design Icons (`@mdi/font`)**: Configuración e integración del plugin `vuetify` en `apps/frontend/src/plugins/vuetify.ts` y registro global en `main.ts`, habilitando componentes UI avanzados y librería de íconos MDI.
- **Tutorial Completo de Vuetify 3 (`docs/extensions/extensions.md`)**: Guía detallada paso a paso para la instalación, registro, tematización y uso de componentes Vuetify con `<script setup lang="ts">` en Vue 3.
- **Contratos de API Backend Estandarizados (`docs/api/contratos.md`)**: Documentación integral de los endpoints HTTP, parámetros DTO, códigos de error y respuestas bajo el formato `ResponseDTO` para los módulos de Plantas, Ubicaciones Técnicas, Líneas Operativas, Equipos y Componentes.
- **Autenticación Segura mediante Doble Token JWT (Access Token + Refresh Cookie)**: Implementación de Access Token de vida corta (15 min) retornado en JSON y Refresh Token de vida larga (7 días) cifrado en HttpOnly Cookie con `SameSite: strict`. (`apps/backend/src/infrastructure/security/jwt.ts`, `apps/backend/src/core/middlewares/autenticar.ts`, `apps/backend/src/core/middlewares/refreshToken.ts`)
- **Validación de Payloads con Zod**: Middleware factory `validarSchema` que ejecuta validación estricta de esquemas Zod en tiempo de ejecución (`loginSchema`, `crearUsuarioSchema`, `actualizarUsuarioSchema`). (`apps/backend/src/core/middlewares/validarSchema.ts`, `apps/backend/src/modules/auth/auth.schemas.ts`)
- **Contratos de API Actualizados (`docs/api/contratos.md`)**: Documentación detallada de contratos HTTP, headers, cookies, esquemas Zod y códigos de respuesta para todos los endpoints de autenticación y gestión de usuarios.

### Changed
- **Consolidación de Arquitectura Modular basada en Módulos (`routes`, `controller`, `service`, `schemas`)**: Eliminación completa de carpetas DDD-Lite (`src/domain/`, `src/application/`, `src/interfaces/`) en favor de módulos aislados y autocontenidos en `src/modules/auth/`.
- Endpoints de diagnóstico y estado en el backend (`apps/backend/src/index.ts`):
  - `GET /`: Información base de la API (`name`, `version`, `status`, `healthCheck`).
  - `GET /api/version`: Consulta directa de versión activa.
- Manejador de evento `error` en el listener HTTP de Express para capturar fallos de bind por puerto en uso (`EADDRINUSE`) entregando comandos de diagnóstico en PowerShell (`Get-NetTCPConnection` / `taskkill`). (`apps/backend/src/index.ts`)
- Esquema completo de PostgreSQL en `apps/backend/prisma/sinergy_schema.sql` (v2.0 Enterprise):
  - 7 tipos ENUM de dominio (`rol_enum`, `tipo_equipo_enum`, `tipo_evaluacion_enum`, etc.) que reemplazan los `VARCHAR` sin control en el esquema anterior.
  - 11 tablas en 3FN: 7 Maestras (jerarquía Data-Driven UI) + 4 Transaccionales (inspecciones + auditoría ISO).
  - Extensión 1:1 `montacargas_detalles` para almacenar la nomenclatura específica de Tubrica (Denominación, UT, Identificación abreviada).
  - Soporte de `valor_minimo` / `valor_maximo` en `variables` para alertas automáticas por rango operativo.
  - Trazabilidad tripartita en `inspecciones`: `elaborado_por` (NOT NULL/JWT), `revisado_por`, `aprobado_por` (NULLABLE).
  - Soporte de captura offline: `fecha_sincronizacion` + `origen_datos_enum` (`ONLINE` / `OFFLINE_SYNC`).
  - 23 índices B-Tree de alto rendimiento para Lazy Loading del Dashboard (< 100ms).
  - Función PL/pgSQL `fn_set_actualizado_en()` + 8 triggers para auto-actualización de timestamps.
  - Comentarios `COMMENT ON TABLE/COLUMN` en todas las tablas y columnas críticas.
- Esquema Prisma `apps/backend/prisma/schema.prisma` (v2.0): espejo tipado del DDL SQL con modelos en PascalCase, mappings de columna en snake_case y relaciones explícitas.
- Documento `docs/schemas/modelo-entidad-relacion.md` (v3.0): ERM completo con diagrama Mermaid, catálogo de tablas y columnas, 23 índices y matriz de integridad.

### Changed
- **Migración Arquitectónica a Feature-Based Architecture (ADR-002)**: Reemplazo de la estructura DDD-Lite (4 capas: domain, application, infrastructure, interfaces) por una arquitectura modular basada en funcionalidades aisladas (`src/modules/auth`, `src/modules/equipment`, `src/modules/maintenance`).
- **Directorio Compartido Monorepo (`apps/shared`)**: Creación de `apps/shared/types` y `apps/shared/constants` para compartir interfaces y tipos de TypeScript de forma centralizada entre el frontend (Vue 3) y el backend (Express/Prisma).
- Configuración de fuente de datos Prisma (`apps/backend/prisma.config.ts`): parametrización dinámica mediante variables de entorno individuales de PostgreSQL (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- Middleware global de errores (`apps/backend/src/core/middlewares/errorHandler.ts`): filtrado de propiedad `stack` en respuestas HTTP restringiéndolo a entorno de desarrollo y únicamente para errores de servidor con estado HTTP >= 500.
- Configuración CORS en backend (`apps/backend/src/core/server.ts`): restricción explícita de orígenes permitidos a `http://localhost:3000` y `http://localhost:5173`.
- `inspecciones.id`, `inspeccion_detalles.id`, `inspeccion_adjuntos.id` y `auditoria_logs.id`: cambiados de `SERIAL` (32-bit) a `BIGSERIAL` (64-bit) para escalar sin riesgo de desbordamiento de ID en sistemas industriales con inspecciones diarias. (D-03)
- `auditoria_logs.registro_id`: cambiado de `INTEGER` a `BIGINT` para cubrir IDs de cualquier tabla, incluidas las `BIGSERIAL`. (D-03)
- Interfaces TypeScript en `architecture.md`: actualizadas para reflejar los valores de ENUM en mayúsculas, los campos `valor_minimo`/`valor_maximo`, `estado_componente` y `origen_datos`. El esquema conceptual de BD fue corregido para incluir ENUMs, `BIGSERIAL`, `TIMESTAMPTZ` y políticas `ON DELETE` explícitas.

### Fixed
- D-04: Índice `idx_inspeccion_adjuntos_detalle` agregado en `inspeccion_adjuntos(detalle_id)`. Las queries de adjuntos por variable específica evitaban índice causando *full scan*.
- D-05: Índice `idx_componentes_activo` declarado en `schema.prisma` (`@@index([activo])`). El SQL ya lo tenía; Prisma no.
- D-06: Índice `idx_variables_tipo_evaluacion` declarado en `schema.prisma` (`@@index([tipoEvaluacion])`). Mismo caso que D-05.
- D-07: Índice `idx_inspecciones_origen` declarado en `schema.prisma` (`@@index([origenDatos])`). Necesario para el Dashboard de sincronización offline.


### Added (Setup Inicial del Monorepo)
- Estructura inicial del monorepo con `pnpm workspaces`.
- Workspace `@sinergy/frontend`: SPA con Vue 3, TypeScript, Bootstrap 5, Pinia y Vue Router.
- Workspace `@sinergy/backend`: API REST con Express, TypeScript y arquitectura DDD-Lite.
- Integración de Prisma ORM en el backend con esquema inicial (Planta, Equipo, Usuario, Inspeccion, Rol).
- Singleton de `PrismaClient` en `apps/backend/src/infrastructure/prisma/prismaClient.ts`.
- Estructura de carpetas DDD-Lite: `domain/`, `application/`, `infrastructure/`, `interfaces/`.
- Script global `pnpm dev` con `concurrently` para arrancar frontend y backend en paralelo.
- Scripts separados: `pnpm dev:frontend` y `pnpm dev:backend`.
- Health check del backend en `GET /api/health`.
- Configuración de `vite.config.ts` con chunking manual para librerías de gráficos y documentos.
- Alias `@/` configurado en Vite para rutas absolutas desde `src/`.
- Carpeta de documentación completa en `docs/` con subcarpetas por dominio.
- Documento `docs/architecture.md` con estructura del monorepo, diagramas de capas y ADRs.
- Documento `docs/extensions/extensions.md` con guía completa de las 18 librerías instaladas.
- Documento `docs/guia-desarrollador.md` con flujo cronológico de desarrollo (backend y frontend).
- Documento `docs/setup.md` con instrucciones de instalación paso a paso.
- Documento `docs/changelog.md` (este archivo).
- Documento `docs/todo.md` con el roadmap de desarrollo.
- Notas de levantamiento de requisitos en `docs/notas.md`.

### Changed
- `tsconfig.node.json` del frontend: cambiado `"module": "nodenext"` a `"ESNext"` con `"moduleResolution": "bundler"` para compatibilidad con la versión de TypeScript instalada.
- Eliminada la opción `"erasableSyntaxOnly"` del `tsconfig.node.json` (no disponible en TS 5.4.x).
- `package.json` de la raíz separado del `package.json` del frontend. El raíz ahora es el coordinador del monorepo.
- Nombre del paquete frontend cambiado de `"sinergy"` a `"@sinergy/frontend"`.
- Parámetros `to` y `from` de `scrollBehavior` en el router renombrados a `_to` y `_from` para satisfacer `noUnusedParameters` de TypeScript.

### Fixed
- Error `ERR_PNPM_IGNORED_BUILDS` resuelto agregando `@prisma/engines`, `prisma`, `esbuild`, `vue-demi`, `vue-echarts` y otros al campo `pnpm.ignoredBuiltDependencies` del `package.json` raíz.
- Error `Module '...' has no exported member 'defineConfig'` resuelto corrigiendo `moduleResolution` en `tsconfig.node.json`.

---

## Cómo registrar un cambio

Cuando hagas un commit que resuelva un bug, agregue una funcionalidad o cambie el comportamiento del sistema, agrega una entrada en la sección `[Unreleased]` con el formato:

```markdown
- Descripción concisa del cambio. (`nombre/del/archivo.ts`)
```

Al hacer un release, la sección `[Unreleased]` se convierte en `[X.Y.Z] — YYYY-MM-DD`.
