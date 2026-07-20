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
