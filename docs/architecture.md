# Arquitectura del Proyecto — Sinergy

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Monorepo](#estructura-del-monorepo)
- [Arquitectura del Backend (DDD-Lite)](#arquitectura-del-backend-ddd-lite)
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
┌─────────────────────────────────────────────────────────────┐
│                         MONOREPO                            │
│                                                             │
│   ┌──────────────────┐        ┌──────────────────────────┐  │
│   │   apps/frontend  │  HTTP  │     apps/backend         │  │
│   │   Vue 3 + TS     │ ────── │   Express + Prisma       │  │
│   │   Bootstrap 5    │  REST  │   PostgreSQL             │  │
│   │   Pinia          │        │   DDD-Lite               │  │
│   └──────────────────┘        └──────────────────────────┘  │
│                                                             │
│   ┌────────────────────────────────────────────────────┐    │
│   │   docs/   ← Documentación centralizada del proyecto│    │
│   └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| Vue 3 | 3.5.13 | Framework UI (Composition API) |
| TypeScript | 5.4.5 | Tipado estático |
| Bootstrap 5 | 5.3.3 | Sistema de grilla y utilidades CSS |
| bootstrap-vue-next | 0.24.14 | Componentes Bootstrap para Vue |
| Vite | 5.2.8 | Bundler y servidor de desarrollo |
| Pinia | 2.1.7 | Gestión de estado global |
| Vue Router | 4.3.0 | Enrutamiento SPA |
| Axios | 1.6.8 | Cliente HTTP con interceptores |
| VeeValidate + Yup | 4.12.4 / 1.4.0 | Validación de formularios |
| Dexie | 4.0.1 | IndexedDB (almacenamiento offline) |
| VueUse | 10.9.0 | Composables de utilidad |
| date-fns | 3.6.0 | Manipulación de fechas |
| Vue Toastification | 2.0.0-rc.5 | Sistema de notificaciones |
| ApexCharts | 3.49.1 | Gráficas interactivas (dashboard) |
| Chart.js | 4.4.2 | Gráficas ligeras embebidas |
| ECharts | 5.4.3 | Gráficas avanzadas |
| SheetJS (xlsx) | 0.18.5 | Exportación a Excel |
| jsPDF + html2canvas | 2.5.1 / 1.4.1 | Exportación a PDF |
| FontAwesome | 6.5.1 | Iconografía SVG |

### Backend

| Tecnología | Versión | Rol |
|---|---|---|
| Node.js | 20.x | Runtime |
| TypeScript | 5.4.5 | Tipado estático |
| Express | 4.19.2 | Framework HTTP |
| Prisma ORM | 7.8.0 | Acceso a datos y migraciones |
| PostgreSQL | 14+ | Base de datos relacional |
| ts-node-dev | 2.0.0 | Dev server con hot-reload |

### Monorepo

| Tecnología | Rol |
|---|---|
| pnpm 8+ | Gestor de paquetes y workspaces |
| concurrently | Ejecución paralela de scripts |

---

## Estructura del Monorepo

```
Sinergy/
│
├── apps/
│   │
│   ├── frontend/                          # @sinergy/frontend
│   │   ├── public/
│   │   │   ├── favicon.svg
│   │   │   └── icons.svg
│   │   ├── src/
│   │   │   ├── assets/                    # Imágenes, fuentes, íconos estáticos
│   │   │   ├── components/                # Componentes Vue reutilizables
│   │   │   │   ├── base/                  # Átomos: BaseButton, BaseCard, BaseInput...
│   │   │   │   ├── layout/                # NavBar, Sidebar, AppFooter...
│   │   │   │   └── modules/               # Componentes de dominio: InspeccionForm, TecnicoCard...
│   │   │   ├── composables/               # Lógica reutilizable sin UI
│   │   │   │   ├── useInspecciones.ts
│   │   │   │   ├── useExportPDF.ts
│   │   │   │   ├── useExportExcel.ts
│   │   │   │   └── useSync.ts
│   │   │   ├── db/                        # Configuración Dexie (IndexedDB offline)
│   │   │   │   └── database.ts
│   │   │   ├── router/                    # Vue Router
│   │   │   │   └── index.ts
│   │   │   ├── schemas/                   # Esquemas de validación Yup
│   │   │   │   ├── loginSchema.ts
│   │   │   │   └── crearTecnicoSchema.ts
│   │   │   ├── stores/                    # Pinia stores
│   │   │   │   ├── authStore.ts
│   │   │   │   └── appStore.ts
│   │   │   ├── types/                     # Interfaces TypeScript compartidas del frontend
│   │   │   │   ├── Tecnico.ts
│   │   │   │   ├── Inspeccion.ts
│   │   │   │   └── Planta.ts
│   │   │   ├── utils/                     # Funciones utilitarias
│   │   │   │   ├── http.ts                # Instancia Axios centralizada
│   │   │   │   └── formatters.ts          # Formateo de fechas, monedas, etc.
│   │   │   ├── views/                     # Páginas (una por ruta)
│   │   │   │   ├── LoginView.vue
│   │   │   │   ├── DashboardView.vue
│   │   │   │   └── InspeccionView.vue
│   │   │   ├── App.vue                    # Componente raíz
│   │   │   ├── env.d.ts                   # Tipos de variables de entorno Vite
│   │   │   └── main.ts                    # Punto de entrada: registra plugins
│   │   ├── .env                           # Variables locales (no en Git)
│   │   ├── .env.example                   # Plantilla de variables requeridas
│   │   ├── index.html
│   │   ├── package.json                   # name: @sinergy/frontend
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   └── vite.config.ts
│   │
│   └── backend/                           # @sinergy/backend
│       ├── prisma/
│       │   ├── migrations/                # Historial de migraciones de la DB
│       │   ├── schema.prisma              # Modelo de datos Prisma
│       │   ├── sinergy_schema.sql         # DDL de PostgreSQL (v2.0 Enterprise)
│       │   └── sinergy_drawdb.sql         # Respaldo visual del esquema
│       ├── src/
│       │   │
│       │   ├── domain/                    # [CAPA 1] — Sin dependencias externas
│       │   │   ├── exceptions/            # Excepciones personalizadas del dominio
│       │   │   │   └── AppError.ts        # Clase base para errores controlados
│       │   │   ├── entities/              # Tipos e interfaces de dominio
│       │   │   │   ├── Tecnico.ts
│       │   │   │   ├── Inspeccion.ts
│       │   │   │   └── Planta.ts
│       │   │   └── repositories/          # Contratos (interfaces) de acceso a datos
│       │   │       ├── ITecnicoRepository.ts
│       │   │       └── IInspeccionRepository.ts
│       │   │
│       │   ├── application/               # [CAPA 2] — Depende solo de domain/
│       │   │   └── usecases/
│       │   │       ├── ObtenerTecnicosPorPlanta.ts
│       │   │       ├── RegistrarInspeccion.ts
│       │   │       └── CrearTecnico.ts
│       │   │
│       │   ├── infrastructure/            # [CAPA 3] — Implementaciones concretas
│       │   │   ├── middlewares/           # Middlewares de infraestructura y HTTP
│       │   │   │   ├── errorHandler.ts    # Manejador global de errores (filtra stack 500+)
│       │   │   │   └── notFoundHandler.ts # Captura de rutas no encontradas (404)
│       │   │   ├── prisma/
│       │   │   │   └── prismaClient.ts    # Singleton de PrismaClient
│       │   │   └── repositories/          # Implementaciones de acceso a datos
│       │   │       ├── PrismaTecnicoRepository.ts
│       │   │       └── PrismaInspeccionRepository.ts
│       │   │
│       │   ├── interfaces/                # [CAPA 4] — HTTP (Express)
│       │   │   ├── controllers/
│       │   │   │   ├── TecnicoController.ts
│       │   │   │   └── InspeccionController.ts
│       │   │   ├── middlewares/
│       │   │   │   └── authMiddleware.ts  # Validación de JWT
│       │   │   └── routes/
│       │   │       ├── tecnicoRoutes.ts
│       │   │       └── inspeccionRoutes.ts
│       │   │
│       │   └── index.ts                   # Punto de entrada (Express server, CORS, EADDRINUSE handling)
│       ├── dist/                          # Build de producción (ignorado en Git)
│       ├── .env                           # DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT
│       ├── package.json                   # name: @sinergy/backend
│       ├── prisma.config.ts               # Configuración dinámica de conexión Prisma v6/v7
│       └── tsconfig.json
│
├── docs/                                  # Documentación del proyecto
│   ├── api/                               # Contratos de la API REST
│   ├── components/                        # Diccionario de componentes Vue
│   ├── composables/                       # Documentación de composables
│   ├── extensions/
│   │   └── extensions.md                  # Guía de cada librería instalada
│   ├── model/                             # Modelos de dominio del negocio
│   ├── repository/                        # Patrones de acceso a datos
│   ├── schemas/                           # Esquemas de validación y DB
│   ├── sinergy/                           # Documentación del negocio
│   │   ├── casosUso.md
│   │   ├── prd.md
│   │   ├── requerimientos.md
│   │   └── visionAlcance.md
│   ├── stores/                            # Documentación de stores de Pinia
│   ├── views/                             # Documentación de vistas
│   ├── architecture.md                    # ← Este archivo
│   ├── changelog.md                       # Historial de cambios por versión
│   ├── guia-desarrollador.md              # Guía paso a paso para desarrollar features
│   ├── notas.md                           # Notas de levantamiento de requisitos
│   ├── security.md                        # Políticas de seguridad
│   ├── setup.md                           # Instalación y configuración inicial
│   └── todo.md                            # Lista de tareas y roadmap
│
├── node_modules/                          # Dependencias del workspace raíz
├── .gitignore
├── package.json                           # Scripts globales del monorepo
├── pnpm-workspace.yaml                    # Declaración de workspaces
└── README.md
```

---

## Arquitectura del Backend (DDD-Lite)

El backend aplica una versión pragmática de DDD con 4 capas. La regla fundamental es que **las dependencias siempre apuntan hacia el dominio**, nunca al revés.

### Regla de Dependencias

```
interfaces/ ── application/ ── domain/
                     ▲
             infrastructure/ ── domain/
```

`domain/` no importa nada de capas externas. Es código TypeScript puro.

### Responsabilidades por Capa

#### `domain/` — Núcleo del negocio
- **Qué contiene:** Interfaces de entidades, tipos DTO, interfaces de repositorios.
- **Qué NO contiene:** Ninguna importación de Prisma, Express, Axios ni ninguna librería externa.
- **Regla:** Si cambias el ORM de Prisma a otro, esta capa NO se toca.

#### `application/` — Casos de uso
- **Qué contiene:** Clases de casos de uso que orquestan el flujo de una operación.
- **Qué NO contiene:** Lógica de HTTP, acceso directo a la DB, `PrismaClient`.
- **Regla:** Un caso de uso recibe interfaces del dominio por constructor (inyección de dependencias).

#### `infrastructure/` — Implementaciones concretas
- **Qué contiene:** `PrismaClient` singleton, clases que implementan los `IRepository` del dominio.
- **Qué NO contiene:** Lógica de negocio ni validaciones de dominio.
- **Regla:** Si cambia la base de datos, solo cambia esta capa.

#### `interfaces/` — Capa HTTP
- **Qué contiene:** Controladores Express, definición de rutas, middlewares (auth, error handler).
- **Qué NO contiene:** Lógica de negocio. Los controladores solo traducen entre HTTP y casos de uso.
- **Regla:** Un controlador que hace más de 3 cosas necesita refactorizarse.

---

## Arquitectura del Frontend (SPA)

El frontend sigue el patrón **Composable → Store → View**.

```
View (orquesta)
  ├── Composables (lógica y efectos secundarios)
  ├── Stores (estado compartido entre vistas)
  └── Components (presentación)
```

### Reglas del Frontend

| Elemento | Responsabilidad | Importa de |
|---|---|---|
| `views/` | Orquesta composables y renderiza | composables, stores, components |
| `composables/` | Lógica reutilizable, llamadas HTTP | `utils/http.ts`, stores |
| `stores/` | Estado global compartido entre vistas | nada externo, solo `vue` y `pinia` |
| `components/` | Presentación pura, recibe props | nada externo (solo emits y props) |
| `utils/` | Funciones puras sin estado | nada del proyecto |
| `schemas/` | Validación de formularios | solo `yup` |

---

## Flujo de una Petición HTTP

Ejemplo: `GET /api/tecnicos/planta/1`

```
1. Vue Router      → Navega a /tecnicos
2. TecnicosView    → onMounted: llama a cargarTecnicos(1)
3. useTecnicos     → http.get('/tecnicos/planta/1')
4. Axios           → Adjunta JWT → envía al backend
5. Express Router  → GET /api/tecnicos/planta/:plantaId
6. authMiddleware  → Verifica JWT
7. TecnicoController.listarPorPlanta()
8. ObtenerTecnicosPorPlanta.execute(1)
9. PrismaTecnicoRepository.findByPlanta(1)
10. Prisma         → SELECT * FROM "Tecnico" WHERE "plantaId" = 1
11. PostgreSQL     → Retorna filas
12. Response       → JSON array de técnicos
13. useTecnicos    → tecnicos.value = data
14. TecnicosView   → v-for renderiza las tarjetas
```

---

## Diagrama de Capas

```
┌────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vue 3 SPA)                   │
│                                                            │
│  ┌──────────┐   ┌─────────────┐   ┌──────────────────────┐ │
│  │  Views   │── │ Composables │── │    utils/http.ts     │ │
│  └──────────┘   └─────────────┘   │    (Axios + JWT)     │ │
│       │                           └──────────────────────┘ │
│       ▼                                        │           │
│  ┌──────────┐   ┌─────────────┐                │ HTTP      │
│  │Components│   │   Stores    │                │           │
│  │  (UI)    │   │  (Pinia)    │                ▼           │
│  └──────────┘   └─────────────┘   ┌──────────────────────┐ │
│                                   │  Dexie / IndexedDB   │ │
│                                   │  (Offline storage)   │ │
│                                   └──────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                              │ REST API
                              ▼
┌────────────────────────────────────────────────────────────┐
│                    BACKEND (Express + DDD-Lite)            │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  interfaces/ (Controladores + Rutas + Middlewares) │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                 │
│                          ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │            application/ (Casos de Uso)             │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                 │
│              ┌───────────┴───────────┐                     │
│              ▼                       ▼                     │
│  ┌─────────────────────┐  ┌──────────────────────────┐     │
│  │      domain/        │  │    infrastructure/       │     │
│  │  Entidades + IRepo  │─ │  PrismaRepositories      │     │
│  └─────────────────────┘  └──────────────────────────┘     │
│                                       │                    │
│                                       ▼                    │
│                           ┌──────────────────────────┐     │
│                           │       PostgreSQL         │     │
│                           └──────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

---

## Gestión de Estado (Frontend)

### ¿Cuándo usar cada mecanismo?

| Mecanismo | Cuándo usarlo |
|---|---|
| `ref` / `reactive` local | Estado que solo necesita el componente actual |
| `composable` (ref interno) | Estado local a una funcionalidad (ej. lista de técnicos para una vista) |
| `Pinia store` | Estado que múltiples vistas necesitan leer o modificar (usuario autenticado, configuración global) |
| `localStorage` vía `useLocalStorage` | Estado que debe persistir entre sesiones (token, preferencias) |
| `Dexie / IndexedDB` | Datos estructurados offline (inspecciones pendientes de sincronizar) |

### Stores actuales

| Store | Archivo | Responsabilidad |
|---|---|---|
| `authStore` | `stores/authStore.ts` | Token JWT, datos del usuario, rol, login/logout |
| `appStore` | `stores/appStore.ts` | Estado global de la UI (sidebar, tema, planta activa) |

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

**Implementación:** Ver `src/composables/useSync.ts` y `src/db/database.ts`.

---

## Convenciones de Nomenclatura

### Archivos

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componente Vue | PascalCase | `BaseButton.vue`, `InspeccionForm.vue` |
| Vista Vue | PascalCase + `View` | `LoginView.vue`, `DashboardView.vue` |
| Composable | camelCase + `use` | `useTecnicos.ts`, `useExportPDF.ts` |
| Store Pinia | camelCase + `Store` | `authStore.ts`, `appStore.ts` |
| Entidad dominio | PascalCase | `Tecnico.ts`, `Inspeccion.ts` |
| Repositorio interfaz | PascalCase + `I` prefix | `ITecnicoRepository.ts` |
| Repositorio Prisma | `Prisma` + PascalCase | `PrismaTecnicoRepository.ts` |
| Caso de uso | PascalCase, verbo | `CrearTecnico.ts`, `RegistrarInspeccion.ts` |
| Controlador | PascalCase + `Controller` | `TecnicoController.ts` |
| Ruta Express | camelCase + `Routes` | `tecnicoRoutes.ts` |

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

### ADR-002 — DDD-Lite sobre MVC tradicional para el backend

**Decisión:** Implementar arquitectura DDD-Lite (4 capas) en lugar del patrón MVC convencional de Express.

**Razón:** El dominio de Sinergy tiene reglas de negocio específicas (validación por roles, lógica de inspección por tipo de equipo) que justifican aislar la lógica de negocio de la infraestructura. Permite cambiar el ORM o la base de datos sin tocar la lógica de negocio.

**Alternativas descartadas:** MVC puro (mezcla la lógica de negocio con los controladores), NestJS (curva de aprendizaje mayor, overhead innecesario en esta fase).

**Trade-off asumido:** Mayor cantidad de archivos y boilerplate por feature. Se acepta a cambio de mayor testeabilidad y mantenibilidad.

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

## Módulo: Variables Críticas (Tubrica)

Esta sección documenta la arquitectura específica de este módulo dentro del sistema Sinergy.

### Jerarquía de Datos (Relaciones 1:N)

```
ubicaciones_tecnicas (nullable)
    └── plantas
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
CREATE TABLE ubicaciones_tecnicas (id SERIAL PRIMARY KEY, codigo VARCHAR(50) UNIQUE NOT NULL, nombre VARCHAR(255) NOT NULL);

CREATE TABLE plantas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    ubicacion_tecnica_id INTEGER NULL REFERENCES ubicaciones_tecnicas(id) ON DELETE SET NULL  -- Nullable por diseño de negocio
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
type InspeccionId = bigint;     // Serializado como string en JSON
type DetalleId    = bigint;

export interface VariableEvaluacion {
  id: number;                    // SERIAL (32-bit) — tablas maestras
  variable_id: number;
  nombre: string;
  tipo_evaluacion: 'NUMERICO_ENTERO' | 'NUMERICO_DECIMAL' | 'TEMPERATURA' | 'SELECCION';
  unidad: string | null;
  valor_minimo: number | null;   // Umbral inferior para alerta de UI
  valor_maximo: number | null;   // Umbral superior para alerta de UI
  opciones: OpcionSeleccion[];   // Solo poblado si tipo_evaluacion === 'SELECCION'
  valor_numerico: number | null;
  valor_seleccion: string | null;
  observaciones: string;
  estado_componente: boolean;
}

export interface OpcionSeleccion {
  clave: string;                 // 'N' | 'E' | 'A' | 'B' | 'NE' | 'N/A'
  etiqueta: string;              // 'Normal' | 'Existe' | 'Anormal' | 'Bajo' | 'No Existe' | 'No Aplica'
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
  fecha_registro: string;        // ISO 8601
  origen_datos: 'ONLINE' | 'OFFLINE_SYNC';
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

