# Arquitectura del Proyecto — Sinergy

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Monorepo](#estructura-del-monorepo)
- [Arquitectura del Backend (Feature-Based)](#arquitectura-del-backend-feature-based)
- [Arquitectura del Frontend (SPA)](#arquitectura-del-frontend-spa)
- [Flujo de una Petición HTTP](#flujo-de-una-petición-http)
- [Diagrama de Capas](#diagrama-de-capas)
- [Gestión de Estado (Frontend)](#gestión-de-estado-frontend)
- [Estrategia Offline-First](#estrategia-offline-first)
- [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
- [Decisiones Arquitectónicas (ADR)](#decisiones-arquitectónicas-adr)

---

## Visión General

Sinergy es un sistema de gestión de mantenimiento industrial estructurado como un **monorepo** con `pnpm workspaces`. Contiene dos aplicaciones independientes que se comunican exclusivamente a través de HTTP:

```
┌──────────────────────────────────────────────────────────────────┐
│                           MONOREPO                               │
│                                                                  │
│   ┌──────────────────┐        ┌────────────────────────────────┐ │
│   │   apps/frontend  │  HTTP  │     apps/backend               │ │
│   │   Vue 3 + TS     │ ────── │   Express + Prisma             │ │
│   │   Bootstrap 5    │  REST  │   PostgreSQL                   │ │
│   │   Pinia          │        │   Feature-Based Architecture   │ │
│   └──────────────────┘        └────────────────────────────────┘ │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  apps/shared/   ← Tipos e interfaces TypeScript comunes  │   │
│   └──────────────────────────────────────────────────────────┘   │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  docs/          ← Documentación centralizada             │   │
│   └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Frontend

| Tecnología          | Versión        | Rol                                |
| ------------------- | -------------- | ---------------------------------- |
| Vue 3               | 3.5.13         | Framework UI (Composition API)     |
| TypeScript          | 5.4.5          | Tipado estático                    |
| Bootstrap 5         | 5.3.3          | Sistema de grilla y utilidades CSS |
| bootstrap-vue-next  | 0.24.14        | Componentes Bootstrap para Vue     |
| Vite                | 5.2.8          | Bundler y servidor de desarrollo   |
| Pinia               | 2.1.7          | Gestión de estado global           |
| Vue Router          | 4.3.0          | Enrutamiento SPA                   |
| Axios               | 1.6.8          | Cliente HTTP con interceptores     |
| VeeValidate + Yup   | 4.12.4 / 1.4.0 | Validación de formularios          |
| Dexie               | 4.0.1          | IndexedDB (almacenamiento offline) |
| VueUse              | 10.9.0         | Composables de utilidad            |
| date-fns            | 3.6.0          | Manipulación de fechas             |
| Vue Toastification  | 2.0.0-rc.5     | Sistema de notificaciones          |
| ApexCharts          | 3.49.1         | Gráficas interactivas (dashboard)  |
| Chart.js            | 4.4.2          | Gráficas ligeras embebidas         |
| ECharts             | 5.4.3          | Gráficas avanzadas                 |
| SheetJS (xlsx)      | 0.18.5         | Exportación a Excel                |
| jsPDF + html2canvas | 2.5.1 / 1.4.1  | Exportación a PDF                  |
| FontAwesome         | 6.5.1          | Iconografía SVG                    |
| Vuetify 3           | 3.13.0         | Componentes UI y Material Design   |
| @mdi/font           | 7.4.47         | Iconografía Material Design        |

### Backend

| Tecnología  | Versión | Rol                          |
| ----------- | ------- | ---------------------------- |
| Node.js     | 20.x    | Runtime                      |
| TypeScript  | 5.4.5   | Tipado estático              |
| Express     | 4.19.2  | Framework HTTP               |
| Prisma ORM  | 7.8.0   | Acceso a datos y migraciones |
| PostgreSQL  | 14+     | Base de datos relacional     |
| ts-node-dev | 2.0.0   | Dev server con hot-reload    |

### Monorepo

| Tecnología   | Rol                             |
| ------------ | ------------------------------- |
| pnpm 8+      | Gestor de paquetes y workspaces |
| concurrently | Ejecución paralela de scripts   |

---

## Estructura del Monorepo

> **ADR-002 — Migración de DDD-Lite a Feature-Based Architecture**
> Fecha: 2026-07-23. Motivo: DDD-Lite genera sobreingeniería y código repetitivo para un sistema de gestión de mantenimiento. La arquitectura por módulos aislados es más cohesiva, reduce el tiempo de navegación entre archivos y cumple el principio de modularidad total. Ver sección [Decisiones Arquitectónicas](#decisiones-arquitectónicas-adr) para el análisis completo de trade-offs.

```
Sinergy/
│
├── apps/
│   │
│   ├── shared/                            # Tipos e interfaces comunes al mono-repo
│   │   ├── types/
│   │   │   └── index.ts                   # Interfaces TS consumidas por front y back
│   │   └── constants/
│   │       └── index.ts                   # Roles de usuario, estados de maquinaria, etc.
│   │
│   ├── frontend/                          # @sinergy/frontend
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   ├── src/
│   │   │   ├── assets/                    # Imágenes, fuentes, íconos estáticos
│   │   │   ├── core/                      # Configuración global del cliente
│   │   │   │   ├── router.ts              # vue-router: todas las rutas de la SPA
│   │   │   │   └── api.ts                 # Instancia Axios con interceptor de JWT
│   │   │   ├── shared/                    # Componentes e interfaces genéricas del UI
│   │   │   │   ├── components/            # BaseButton, BaseCard, BaseInput, BaseTable…
│   │   │   │   └── layouts/               # AppLayout.vue (sidebar + navbar)
│   │   │   ├── modules/                   # Funcionalidades aisladas (Feature-Based)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── views/             # Login.vue, HomeView.vue
│   │   │   │   │   └── auth.store.ts      # Pinia: JWT y estado del usuario
│   │   │   │   ├── equipment/
│   │   │   │   │   ├── views/             # EquipmentList.vue
│   │   │   │   │   ├── components/        # Formularios específicos de maquinaria
│   │   │   │   │   └── equipment.store.ts
│   │   │   │   └── maintenance/
│   │   │   │       ├── views/             # Reports.vue, CriticalVariables.vue
│   │   │   │       └── maintenance.store.ts
│   │   │   ├── App.vue                    # Componente raíz
│   │   │   ├── env.d.ts                   # Tipos de variables de entorno Vite
│   │   │   └── main.ts                    # Punto de entrada: registra plugins
│   │   ├── .env                           # Variables locales (no en Git)
│   │   ├── .env.example
│   │   ├── index.html
│   │   ├── package.json                   # name: @sinergy/frontend
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   └── vite.config.ts
│   │
│   └── backend/                           # @sinergy/backend
│       ├── prisma/
│       │   ├── schema.prisma              # Modelo de datos Prisma
│       │   ├── sinergy_schema.sql         # DDL de PostgreSQL
│       │   └── sinergy_drawdb.sql         # Respaldo visual del esquema
│       ├── src/
│       │   ├── core/                      # Configuración que arranca la aplicación
│       │   │   ├── server.ts              # Instancia Express: middlewares y rutas base
│       │   │   ├── prisma.ts              # Singleton PrismaClient (evita fugas de memoria)
│       │   │   ├── errors/
│       │   │   │   └── AppError.ts        # Clase base para errores controlados
│       │   │   └── middlewares/
│       │   │       ├── errorHandler.ts    # Manejador global de errores (filtra stack 500+)
│       │   │       └── notFoundHandler.ts # Captura de rutas no encontradas (404)
│       │   ├── modules/                   # Funcionalidades aisladas (Feature-Based)
│       │   │   ├── auth/
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── auth.controller.ts # Extrae datos del request, llama al service
│       │   │   │   └── auth.service.ts    # Lógica de negocio + acceso a Prisma
│       │   │   ├── equipment/             # Montacargas, Generador, Chiller, Compresor
│       │   │   │   ├── equipment.routes.ts
│       │   │   │   ├── equipment.controller.ts
│       │   │   │   └── equipment.service.ts
│       │   │   └── maintenance/
│       │   │       ├── maintenance.routes.ts
│       │   │       ├── maintenance.controller.ts
│       │   │       └── maintenance.service.ts
│       │   └── index.ts                   # Arranque: listen, graceful shutdown, EADDRINUSE
│       ├── .env                           # DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT
│       ├── package.json                   # name: @sinergy/backend
│       ├── prisma.config.ts
│       └── tsconfig.json
│
├── docs/                                  # Documentación del proyecto
├── node_modules/                          # Dependencias del workspace raíz
├── .gitignore
├── package.json                           # Scripts globales del monorepo
├── pnpm-workspace.yaml                    # Declaración de workspaces
└── README.md
```

---

## Arquitectura del Backend (Feature-Based)

El backend agrupa el código por **contexto de negocio**, no por rol técnico. Cada módulo es autónomo: contiene sus rutas, controlador y servicio en la misma carpeta. Esto elimina la necesidad de saltar entre 4 directorios para entender una funcionalidad.

### Estructura de un Módulo

```
modules/
└── equipment/
    ├── equipment.routes.ts     ← Define endpoints, delega al controller
    ├── equipment.controller.ts ← Extrae datos del Request, llama al service
    └── equipment.service.ts    ← Lógica de negocio + acceso a Prisma
```

### Flujo estricto dentro de un módulo

```
Request → routes → controller → service → Prisma → PostgreSQL → Response
```

### Configuración compartida en `core/`

| Archivo                               | Responsabilidad                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `core/server.ts`                      | Instancia Express, registra middlewares globales y rutas de módulos           |
| `core/prisma.ts`                      | Singleton de `PrismaClient` (evita fugas de memoria por múltiples instancias) |
| `core/errors/AppError.ts`             | Clase base para errores controlados con `statusCode`                          |
| `core/middlewares/errorHandler.ts`    | Manejador global de errores (filtra stack trace en producción)                |
| `core/middlewares/notFoundHandler.ts` | Captura de rutas no encontradas (404)                                         |

---

## Arquitectura del Frontend (SPA)

El frontend sigue una estructura basada en módulos aislados combinada con `shared/` y `core/`.

### Estructura

```
src/
├── core/           ← router.ts, api.ts
├── shared/         ← componentes y layouts reutilizables UI
└── modules/        ← auth/, equipment/, maintenance/
```

---

## Diagrama de Capas

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vue 3 SPA)                    │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   core/ (router.ts · api.ts)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                 │
│                          ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   modules/ (auth/ · equipment/ · maintenance/)       │  │
│  │   views/ · store.ts · components/                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                 │
│                          ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   shared/ (componentes UI base y layouts)            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                               │ REST API (HTTP / JWT)
                               ▼
┌────────────────────────────────────────────────────────────┐
│             BACKEND (Express + Feature-Based)              │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   core/ (server.ts · prisma.ts · middlewares/)       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                 │
│                          ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   modules/                                           │  │
│  │   ┌───────────┐  ┌─────────────┐  ┌──────────────┐   │  │
│  │   │   auth/   │  │ equipment/  │  │ maintenance/ │   │  │
│  │   │ routes    │  │ routes      │  │ routes       │   │  │
│  │   │ controller│  │ controller  │  │ controller   │   │  │
│  │   │ service   │  │ service     │  │ service      │   │  │
│  │   └───────────┘  └─────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                 │
│                          ▼                                 │
│                  ┌──────────────────┐                      │
│                  │    PostgreSQL    │                      │
│                  └──────────────────┘                      │
└────────────────────────────────────────────────────────────┘
```

---

## Gestión de Estado y Comunicaciones (Frontend)

### ¿Cuándo usar cada mecanismo?

| Mecanismo                            | Cuándo usarlo                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `ref` / `reactive` local             | Estado que solo necesita el componente actual                                                      |
| `composable` (ref interno)           | Estado local a una funcionalidad (ej. lista de datos específica de una vista)                      |
| `Pinia store`                        | Estado que múltiples vistas necesitan leer o modificar (autenticación, token en memoria, tema)     |
| `apiFetch` (expuesto en `authStore`) | Peticiones HTTP autenticadas (incluye Bearer token, HttpOnly credentials y prefijo `API_URL`)      |
| `HttpOnly Cookie`                    | Persistencia segura del Refresh Token (7 días, controlado por backend)                             |
| `Dexie / IndexedDB`                  | Datos estructurados offline (inspecciones pendientes de sincronizar)                               |

### Stores actuales

| Store                 | Archivo                                         | Responsabilidad                                                                          |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `auth.store`          | `modules/auth/auth.store.ts`                    | Access Token en memoria, estado de sesión, roles, `login()`, `refrescarToken()`, `apiFetch()` |
| `usuarios.store`      | `modules/usuarios/usuarios.store.ts`            | Gestión de usuarios, alta, actualización, asignación de roles y vinculación a plantas    |
| `plantas.store`       | `modules/plantas/plantas.store.ts`              | Catálogo de plantas industriales, CRUD y filtrado PBAC                                   |
| `ubicacion.store`     | `modules/ubicaciones/ubicacion.store.ts`        | Ubicaciones técnicas por planta y jerarquía                                              |
| `lineas.store`        | `modules/lineas/lineas.store.ts`                | Líneas operativas de producción                                                          |
| `equipo.store`        | `modules/equipo/equipo.store.ts`                | Catálogo general de equipos y tipos de maquinaria industrial                             |
| `componente.store`    | `modules/componentes/componente.store.ts`       | Partes y componentes constitutivos de maquinarias                                        |
| `variables.store`     | `modules/variables/variables.store.ts`          | Árbol jerárquico, plantillas de variables por tipo de equipo e instancias por componente |
| `inspecciones.store`  | `modules/inspecciones/inspecciones.store.ts`    | Wizard de captura, borrador local resiliente, estadísticas y bandeja de supervisión     |
| `notificaciones.store`| `modules/notificaciones/notificaciones.store.ts`| WebSockets Socket.io, alertas técnicas y avisos de aprobación en tiempo real             |

---

## Estrategia Offline-First

Sinergy opera en plantas industriales donde la conectividad puede ser intermitente. La estrategia es:

```
1. Usuario captura inspección
         │
         ▼
2. ¿Hay conexión? (useOnline de VueUse)
   │
   ├── SÍ ── POST /api/inspecciones → Backend → PostgreSQL
   │          → toast.success()
   │
   └── NO ── Dexie: db.inspeccionesPendientes.add(datos)
              → toast.warning('Guardado localmente')
              → Al reconectarse: sincronizar()
                 → POST /api/inspecciones/batch
                 → db.inspeccionesPendientes.clear()
                 → toast.info('Sincronizadas N inspecciones')
```

**Implementación:** Ver `src/modules/maintenance/maintenance.store.ts` (lógica de sincronización) y la integración con Dexie que se definirá en una fase posterior del proyecto.

---

## Convenciones de Nomenclatura

### Archivos

| Tipo                | Convención                         | Ejemplo                                |
| ------------------- | ---------------------------------- | -------------------------------------- |
| Componente Vue      | PascalCase                         | `BaseButton.vue`, `EquipmentForm.vue`  |
| Vista Vue           | PascalCase + `View` o descriptivo  | `Login.vue`, `EquipmentList.vue`       |
| Store Pinia         | kebab-case + `.store`              | `auth.store.ts`, `equipment.store.ts`  |
| Interfaz TypeScript | PascalCase                         | `Equipment.ts`, `MaintenanceReport.ts` |
| Servicio            | camelCase + `.service`             | `equipment.service.ts`                 |
| Controlador         | camelCase + `.controller`          | `equipment.controller.ts`              |
| Ruta Express        | camelCase + `.routes`              | `equipment.routes.ts`                  |
| Tipo compartido     | PascalCase en `apps/shared/types/` | `EquipmentType`, `UserRole`            |

### Commits (Semánticos)

```
feat:     nueva funcionalidad
fix:      corrección de bug
refactor: refactorización sin cambio de comportamiento
docs:     cambios en documentación
chore:    tareas de mantenimiento (deps, config)
test:     adición o corrección de pruebas
```

Ejemplos:

```
feat: add offline inspection capture with Dexie
fix: correct token expiry redirect on 401
docs: update architecture with monorepo structure
refactor: extract PDF export to composable
```

---

## Decisiones Arquitectónicas (ADR)

### ADR-001 — Monorepo con pnpm workspaces

**Decisión:** Usar un monorepo con `pnpm workspaces` en lugar de dos repositorios separados.

**Razón:** Facilita compartir tipos, scripts y configuración. Un solo `pnpm install` instala todo. Los scripts de `concurrently` permiten arrancar ambos proyectos con un solo comando.

**Alternativas descartadas:** Dos repositorios Git separados (mayor fricción de sincronización), Turborepo (complejidad innecesaria para el tamaño actual del proyecto).

---

### ADR-002 — Feature-Based Architecture sobre DDD-Lite para el backend

**Decisión:** Migrar de la arquitectura DDD-Lite de 4 capas a una arquitectura basada en funcionalidades (Feature-Based / Módulos Aislados). Fecha de migración: 2026-07-23.

**Razón:** DDD-Lite es la arquitectura correcta para sistemas con lógica de negocio compleja y múltiples equipos de desarrollo. Sin embargo, para un sistema de gestión de mantenimiento con una estructura de dominio predecible y un equipo reducido, introduce sobreingeniería: genera código boilerplate excesivo (interfaces de repositorios, casos de uso, implementaciones concretas) para operaciones que son directamente CRUD con Prisma. Viola el principio de minimalismo extremo del proyecto.

La arquitectura Feature-Based agrupa el código por contexto de negocio en lugar de por rol técnico. Para modificar la lógica de `equipment`, se abre una sola carpeta y se encuentran sus rutas, controlador y servicio juntos, sin saltar entre 4 directorios.

**Estructura de cada módulo:**

- `*.routes.ts` — Define los endpoints y los delega al controlador.
- `*.controller.ts` — Extrae datos del `Request`, llama al servicio, devuelve la respuesta HTTP. No contiene lógica de negocio.
- `*.service.ts` — Contiene la lógica de negocio y es el único que interactúa con Prisma.

**Alternativas descartadas:**

- DDD-Lite 4 capas (sobreingeniería para este contexto, deuda técnica por boilerplate).
- MVC puro sin separación de capas dentro del módulo (mezcla responsabilidades en el controlador).

**Trade-off asumido:** Se pierde la capacidad de cambiar el ORM sin tocar el servicio, ya que el servicio importa Prisma directamente. Se acepta porque la probabilidad de cambiar el ORM en este proyecto es prácticamente nula, y el beneficio en velocidad de desarrollo y legibilidad supera ese riesgo.

---

### ADR-003 — Pinia sobre Vuex para la gestión de estado

**Decisión:** Usar Pinia como store global.

**Razón:** Es la solución oficial recomendada para Vue 3. API más simple, soporte nativo para TypeScript, y compatibilidad con la Composition API. Vuex 4 fue descartado por estar en modo mantenimiento.

---

### ADR-004 — Dexie para almacenamiento offline

**Decisión:** Usar Dexie.js como wrapper de IndexedDB para la estrategia offline-first.

**Razón:** IndexedDB nativo es verboso y difícil de usar. Dexie ofrece una API limpia, soporte para esquemas versionados y consultas tipadas. Es ideal para guardar inspecciones pendientes de sincronizar.

**Alternativas descartadas:** `localStorage` (no soporta estructuras complejas ni grandes volúmenes), PouchDB (más complejo y enfocado en sincronización con CouchDB).

---

### ADR-005 — PostgreSQL como base de datos

**Decisión:** PostgreSQL como motor de base de datos.

**Razón:** Soporte maduro para JSON (campo `datos` en la tabla `Inspeccion`), transacciones ACID robustas, excelente integración con Prisma, y capacidad de escalar horizontalmente.

**Alternativas descartadas:** MySQL (menor soporte para JSON), SQLite (no apto para producción multi-usuario), MongoDB (modelo documental no se alinea bien con las relaciones del dominio).

---

### ADR-006 — Data-Driven UI para el módulo de Variables Críticas

**Decisión:** Implementar el módulo de inspección de variables críticas como una interfaz generada dinámicamente desde la base de datos, en lugar de crear vistas hardcodeadas por línea, máquina o componente.

**Razón:** Tubrica tiene 3 plantas, entre 6 y 17 líneas por planta, múltiples equipos por línea y decenas de componentes con variables heterogéneas. Crear una vista por configuración física implica que cualquier cambio operacional (nuevo equipo, renombrar una variable) requeriría modificación de código fuente, compilación y un nuevo despliegue. Esto es deuda técnica inviable.

**Alternativas descartadas:** Vistas estáticas por línea/equipo (acoplamiento insostenible, cero escalabilidad), generación de código automático desde la DB (complejidad innecesaria en esta fase).

**Trade-off asumido:** El módulo CRUD administrativo requiere un esfuerzo de configuración inicial mayor. Se acepta a cambio de que cualquier cambio físico futuro de la planta sea una operación de datos, no de código.

---

### ADR-009 — Control de Acceso por Planta (PBAC — Plant-Based Access Control)

**Decisión:** Implementar aislamiento multi-planta forzado desde el backend mediante `req.usuario.plantaId` firmado en el JWT, restringiendo la visualización y registro de datos a la planta asignada a cada usuario, con excepción global para el rol `ADMINISTRADOR`.

**Razón:** Para garantizar la integridad operativa y seguridad de la información entre las distintas plantas físicas, cada usuario debe operar estrictamente dentro de su propia planta sin posibilidad de consultar o registrar datos en plantas ajenas mediante manipulación de parámetros HTTP.

**Alternativas descartadas:**
- Filtrado dependiente del frontend vía query parameters libres `?plantaId=X` (vulnerable a manipulación/inyección de datos cruzados).
- Bases de datos o esquemas PostgreSQL separados por planta (sobreingeniería y dificultad para reportes consolidados corporativos).

**Trade-off asumido:** Los administradores corporativos requieren una condición de excepción (`req.plantaId === undefined`) en la capa de controladores y servicios para poder monitorear y gestionar todas las plantas simultáneamente.

---

## Módulo: Variables Críticas (Tubrica)

Esta sección documenta la arquitectura específica de este módulo dentro del sistema Sinergy.

### Jerarquía de Datos (Relaciones 1:N)

```
plantas
    ├── ubicaciones_tecnicas (nullable planta_id)
    └── lineas (6-17 por planta)
            └── equipos
                    └── componentes
                            └── variables  ← tipo_evaluacion define el control de UI
```

### Esquema de Base de Datos

> El esquema canónico y completo reside en [`sinergy_schema.sql`](file:///c:/xampp/htdocs/Sinergy/apps/backend/prisma/sinergy_schema.sql) y en [`schema.prisma`](file:///c:/xampp/htdocs/Sinergy/apps/backend/prisma/schema.prisma). A continuación se documenta el extracto conceptual relevante para la arquitectura.

```sql
-- 7 ENUMs de dominio (controlados a nivel de motor de BD)
CREATE TYPE rol_enum            AS ENUM ('ADMINISTRADOR', 'SUPERVISOR', 'TECNICO');
CREATE TYPE tipo_equipo_enum    AS ENUM ('MAQUINARIA', 'MONTACARGAS', 'COMPRESOR', 'GENERADOR', 'CHILLER');
CREATE TYPE tipo_evaluacion_enum AS ENUM ('NUMERICO_ENTERO', 'NUMERICO_DECIMAL', 'TEMPERATURA', 'SELECCION');
CREATE TYPE tipo_inspeccion_enum AS ENUM ('VARIABLES_CRITICAS', 'MONTACARGAS', 'COMPRESOR', 'GENERADOR', 'CHILLER');
CREATE TYPE estado_inspeccion_enum AS ENUM ('BORRADOR', 'PENDIENTE', 'APROBADO', 'RECHAZADO');
CREATE TYPE estado_operativo_enum  AS ENUM ('OPERATIVO', 'INOPERATIVO', 'EN_MANTENIMIENTO');
CREATE TYPE origen_datos_enum      AS ENUM ('ONLINE', 'OFFLINE_SYNC');

-- TABLAS MAESTRAS (SERIAL: bajo volumen, crecimiento controlado)
CREATE TABLE plantas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE ubicaciones_tecnicas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    planta_id INTEGER NULL REFERENCES plantas(id) ON DELETE SET NULL -- Nullable por diseño de negocio
);

CREATE TABLE lineas  (id SERIAL PRIMARY KEY, codigo VARCHAR(50) NOT NULL, nombre VARCHAR(255) NOT NULL, planta_id INTEGER NOT NULL REFERENCES plantas(id) ON DELETE RESTRICT, UNIQUE (codigo, planta_id));
CREATE TABLE equipos (id SERIAL PRIMARY KEY, codigo VARCHAR(100) UNIQUE NOT NULL, tipo_equipo tipo_equipo_enum NOT NULL, linea_id INTEGER NULL REFERENCES lineas(id) ON DELETE SET NULL, estado_operativo estado_operativo_enum NOT NULL DEFAULT 'OPERATIVO');
CREATE TABLE componentes (id SERIAL PRIMARY KEY, nombre VARCHAR(255) NOT NULL, equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE, activo BOOLEAN NOT NULL DEFAULT TRUE, orden_posicion INTEGER NOT NULL DEFAULT 0);

CREATE TABLE variables (
    id SERIAL PRIMARY KEY,
    componente_id INTEGER NOT NULL REFERENCES componentes(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    tipo_evaluacion tipo_evaluacion_enum NOT NULL, -- Controla el control de UI renderizado
    unidad VARCHAR(20) NULL,           -- '°C', '°F', 'PSI', 'RPM', 'A', 'V'
    valor_minimo NUMERIC(12, 4) NULL,  -- Umbral inferior para alertas
    valor_maximo NUMERIC(12, 4) NULL,  -- Umbral superior para alertas
    orden_posicion INTEGER NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE opciones_seleccion (
    id SERIAL PRIMARY KEY,
    variable_id INTEGER NOT NULL REFERENCES variables(id) ON DELETE CASCADE,
    clave VARCHAR(10) NOT NULL,    -- 'N', 'E', 'A', 'B', 'NE', 'N/A'
    etiqueta VARCHAR(100) NOT NULL, -- 'Normal', 'Existe', 'Anormal', 'Bajo', 'No Existe', 'No Aplica'
    orden_posicion INTEGER NOT NULL DEFAULT 0,
    UNIQUE (variable_id, clave)
);

-- TABLAS TRANSACCIONALES (BIGSERIAL: alto volumen, inspecciones diarias)
CREATE TABLE inspecciones (
    id BIGSERIAL PRIMARY KEY,          -- 64-bit: evita desbordamiento en sistemas industriales
    codigo_inspeccion VARCHAR(100) UNIQUE NOT NULL,
    tipo_inspeccion tipo_inspeccion_enum NOT NULL,
    equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT,
    elaborado_por INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT, -- JWT: inalterable
    revisado_por  INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    aprobado_por  INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_sincronizacion TIMESTAMPTZ NULL,   -- Timestamp de llegada al servidor (captura offline)
    estado_inspeccion estado_inspeccion_enum NOT NULL DEFAULT 'PENDIENTE',
    origen_datos origen_datos_enum NOT NULL DEFAULT 'ONLINE'
);

CREATE TABLE inspeccion_detalles (
    id BIGSERIAL PRIMARY KEY,           -- 64-bit: N filas por inspección
    inspeccion_id BIGINT NOT NULL REFERENCES inspecciones(id) ON DELETE CASCADE,
    variable_id INTEGER NOT NULL REFERENCES variables(id) ON DELETE RESTRICT,
    valor_numerico NUMERIC(12, 4) NULL,
    valor_seleccion VARCHAR(10) NULL,
    observaciones TEXT NULL,
    estado_componente BOOLEAN NOT NULL DEFAULT TRUE
);
```

### Interfaces TypeScript (Contrato Frontend ↔ Backend)

> **Nota importante sobre BigInt:** Los campos `id` de `inspecciones`, `inspeccion_detalles`, `inspeccion_adjuntos` y `auditoria_logs` son `BIGSERIAL`/`BIGINT` en la BD y `BigInt` en Prisma. En el frontend y en los payloads JSON se serializan como `string` para evitar pérdida de precisión en JavaScript (JS no soporta enteros de 64-bit de forma nativa).

```typescript
// Tipos escalares para IDs de tablas transaccionales
type InspeccionId = bigint; // Serializado como string en JSON
type DetalleId = bigint;

export interface VariableEvaluacion {
  id: number; // SERIAL (32-bit) — tablas maestras
  variable_id: number;
  nombre: string;
  tipo_evaluacion:
    | "NUMERICO_ENTERO"
    | "NUMERICO_DECIMAL"
    | "TEMPERATURA"
    | "SELECCION";
  unidad: string | null;
  valor_minimo: number | null; // Umbral inferior para alerta de UI
  valor_maximo: number | null; // Umbral superior para alerta de UI
  opciones: OpcionSeleccion[]; // Solo poblado si tipo_evaluacion === 'SELECCION'
  valor_numerico: number | null;
  valor_seleccion: string | null;
  observaciones: string;
  estado_componente: boolean;
}

export interface OpcionSeleccion {
  clave: string; // 'N' | 'E' | 'A' | 'B' | 'NE' | 'N/A'
  etiqueta: string; // 'Normal' | 'Existe' | 'Anormal' | 'Bajo' | 'No Existe' | 'No Aplica'
}

export interface ComponenteInspeccion {
  id: number;
  nombre: string;
  variables: VariableEvaluacion[];
}

export interface PayloadRegistroInspeccion {
  equipo_id: number;
  elaborado_por: number;
  revisado_por: number | null;
  aprobado_por: number | null;
  fecha_registro: string; // ISO 8601
  origen_datos: "ONLINE" | "OFFLINE_SYNC";
  componentes: ComponenteInspeccion[];
}
```

### Flujo de Carga Lazy (Peticiones en Cascada)

```
1. Usuario selecciona Planta
         │
         ▼
2. GET /api/plantas/:id/lineas
   → appStore.lineas = data
         │
         ▼ (usuario selecciona Línea)
3. GET /api/lineas/:id/equipos
   → appStore.equipos = data
         │
         ▼ (usuario selecciona Equipo)
4. GET /api/equipos/:id/componentes-variables
   → inspeccionActual.componentes = data
         │
         ▼
5. VariableInput.vue renderiza el control según tipo_evaluacion
   sin conocer la planta, línea ni equipo concreto
```

### Mapa de Archivos del Módulo

```
frontend/src/
├── views/
│   └── variables-criticas/
│       ├── MachineInspectionView.vue       ← Vista única de inspección
│       └── PlantAdminView.vue              ← CRUD administrativo de jerarquía
├── components/
│   └── modules/variables-criticas/
│       ├── VariableInput.vue               ← Componente polimórfico (Data-Driven)
│       ├── ComponenteCard.vue              ← Agrupa variables por componente
│       └── InspeccionHeader.vue            ← Cabecera: elaborado/revisado/aprobado por
├── composables/
│   └── useVariablesCriticas.ts            ← Fetch lazy, construcción del payload
├── types/
│   └── VariablesCriticas.ts               ← Interfaces TypeScript del módulo
└── schemas/
    └── inspeccionSchema.ts                ← Validación Yup del payload

backend/src/
├── domain/entities/
│   └── Inspeccion.ts                      ← Entidades del módulo
├── domain/repositories/
│   └── IInspeccionRepository.ts
├── application/usecases/
│   ├── RegistrarInspeccion.ts
│   └── ObtenerComponentesPorEquipo.ts
├── infrastructure/repositories/
│   └── PrismaInspeccionRepository.ts
└── interfaces/
    ├── controllers/InspeccionController.ts
    └── routes/inspeccionRoutes.ts
```

---

## Decisiones Arquitectónicas (ADR)

### ADR-01: Arquitectura Modular Feature-Based (vs DDD Clásico)
* **Contexto:** La migración requería un balance entre desacoplamiento y velocidad de desarrollo para Rafa y el equipo.
* **Decisión:** Agrupar código por características o dominios verticales (`src/modules/<modulo>/`) conteniendo en una sola carpeta sus rutas, controladores, servicios y DTOs/schemas de TypeScript.
* **Por qué:** Reduce drásticamente la fricción cognitiva al no saltar entre múltiples carpetas distantes (Domain, Application, Infrastructure) para un solo cambio de endpoint.
* **Alternativas Descartadas:** DDD-Lite con inversión de dependencias estricta y clases abstractas para cada CRUD simple.
* **Trade-offs:** Menor pureza académica a cambio de máxima mantenibilidad y legibilidad práctica.

---

### ADR-02: Doble Token JWT (Access Token en Memoria + Refresh Token en HttpOnly Cookie)
* **Contexto:** Necesidad de seguridad robusta contra ataques XSS y CSRF en el almacenamiento de credenciales.
* **Decisión:** El Access Token (vida corta: 15 min) reside exclusivamente en la memoria reactiva del store de Pinia (`auth.store.ts`). El Refresh Token (vida larga: 7 días) se gestiona a través de una cookie con banderas `HttpOnly`, `SameSite=Lax` y `Secure`.
* **Por qué:** Impide que scripts maliciosos inyectados puedan leer el token persistente desde `localStorage` o `sessionStorage`.
* **Trade-offs:** Al recargar la página (F5), se debe ejecutar una llamada de arranque a `/api/auth/refresh` para reconstruir la sesión activa.

---

### ADR-03: Coexistencia Bootstrap 5 + Vuetify 3 y Aislamiento de Overlays en Modo Oscuro
* **Contexto:** El proyecto utiliza Vuetify 3 para componentes enriquecidos (árboles, tabs, selects, diálogos) y Bootstrap 5 para grillas y utilidades. En modo oscuro surgían colisiones con pseudo-elementos (`::before`), bordes toscos y el temido bug de "pantalla vacía" por scrims opacos.
* **Decisión:** 
  1. Configuración de temas mediante `createVuetify` con definiciones limpias (`sinergyLightTheme` y `sinergyDarkTheme`).
  2. Sincronización del atributo `data-bs-theme="dark"` en `<html>` desde `App.vue` para alinear Bootstrap con la paleta industrial de Vuetify.
  3. Prohibición estricta de sobrescribir pseudo-elementos globales (`::before`) o forzar fondos globales en `.v-sheet` o `.v-card` con `!important`.
  4. Uso exclusivo de variables CSS nativas (`--v-field-border-opacity: 0.12` en reposo y `0.7` en foco) para controlar la sutileza visual de los contornos.
* **Por qué:** Permite que el motor de renderizado de portales de Vuetify (`v-overlay-container`) calcule correctamente la geometría y opacidad de menús flotantes sin tapar la aplicación.
* **Trade-offs:** Exige documentar y respetar las variables de tema en lugar de aplicar parches CSS apresurados.

---

### ADR-04: Reseteo Inmediato de Estado Reactivo en Navegación Jerárquica
* **Contexto:** En vistas con árboles o selectores multinivel (como Variables Críticas o Lubricación), al pasar de un nodo con datos a uno vacío, la interfaz mostraba los datos previos durante la latencia de red o de forma indefinida si la respuesta venía vacía.
* **Decisión:** Vaciar inmediatamente las variables reactivas dependientes (`items.value = []`) tanto al disparar la acción de selección como al inicio de la función asíncrona y en sus bloques de captura de error (`catch`).
* **Por qué:** Garantiza una experiencia de usuario determinista y previene errores donde el técnico confunda componentes o registre valores sobre el equipo equivocado.
* **Trade-offs:** El usuario percibe un micro-parpadeo hacia el estado vacío antes de que lleguen los nuevos datos, lo cual es preferible a mostrar información desactualizada.

---

### ADR-05: Despliegue Idempotente de Migraciones y Baselining Automático en Prisma ORM
* **Contexto:** Al realizar despliegues en servidores de producción o pruebas donde la base de datos se restaura a partir de un volcado SQL nativo (`Sinergy_produccion_backup.sql`) o donde ya existen tablas pero no la tabla interna de auditoría `_prisma_migrations`, la ejecución de `prisma migrate deploy` falla con el error `P3005: The database schema is not empty`.
* **Decisión:** 
  1. Implementar un orquestador de despliegue (`apps/backend/scripts/deploy-migrations.js`) invocado transversalmente por el comando `pnpm db:deploy`.
  2. Detectar el error `P3005` y resolver automáticamente la línea base (baseline) ejecutando `prisma migrate resolve --applied 20260916120000_db_produccion_inicial`.
  3. Re-ejecutar `prisma migrate deploy` para garantizar que cualquier migración incremental futura se aplique de forma secuencial y sin fricciones.
  4. Mantener los volcados de base de datos (`.sql`) estrictamente codificados en UTF-8 sin BOM para asegurar compatibilidad universal con `psql` en Windows y distribuciones Linux (Arch / CachyOS).
* **Por qué:** Evita caídas del pipeline de integración continua (CI/CD) o intervenciones manuales tediosas durante el aprovisionamiento de entornos réplica o despliegues en producción.
* **Trade-offs:** Requiere que la migración inicial consolidada coincida fielmente con el estado estructural del volcado de producción respaldado.


