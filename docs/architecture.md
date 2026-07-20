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
│   │   Vue 3 + TS     │ ──────▶│   Express + Prisma       │  │
│   │   Bootstrap 5    │  REST  │   PostgreSQL              │  │
│   │   Pinia          │        │   DDD-Lite                │  │
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
│       │   └── schema.prisma              # Modelo de datos
│       ├── src/
│       │   │
│       │   ├── domain/                    # [CAPA 1] — Sin dependencias externas
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
│       │   │   ├── prisma/
│       │   │   │   └── prismaClient.ts    # Singleton de PrismaClient
│       │   │   └── repositories/          # Implementaciones con Prisma
│       │   │       ├── PrismaTecnicoRepository.ts
│       │   │       └── PrismaInspeccionRepository.ts
│       │   │
│       │   ├── interfaces/                # [CAPA 4] — HTTP (Express)
│       │   │   ├── controllers/
│       │   │   │   ├── TecnicoController.ts
│       │   │   │   └── InspeccionController.ts
│       │   │   ├── middlewares/
│       │   │   │   ├── errorHandler.ts    # Manejador global de errores
│       │   │   │   └── authMiddleware.ts  # Validación de JWT
│       │   │   └── routes/
│       │   │       ├── tecnicoRoutes.ts
│       │   │       └── inspeccionRoutes.ts
│       │   │
│       │   └── index.ts                   # Punto de entrada del servidor
│       ├── dist/                          # Build de producción (ignorado en Git)
│       ├── .env                           # DATABASE_URL, PORT (no en Git)
│       ├── package.json                   # name: @sinergy/backend
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
interfaces/ ──▶ application/ ──▶ domain/
                     ▲
             infrastructure/ ──▶ domain/
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
│  │  Views   │──▶│ Composables │──▶│    utils/http.ts     │ │
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
│                    BACKEND (Express + DDD-Lite)             │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  interfaces/ (Controladores + Rutas + Middlewares)  │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                 │
│                          ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │            application/ (Casos de Uso)              │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                 │
│              ┌───────────┴───────────┐                     │
│              ▼                       ▼                     │
│  ┌─────────────────────┐  ┌──────────────────────────┐    │
│  │      domain/        │  │    infrastructure/        │    │
│  │  Entidades + IRepo  │◀─│  PrismaRepositories       │    │
│  └─────────────────────┘  └──────────────────────────┘    │
│                                       │                    │
│                                       ▼                    │
│                           ┌──────────────────────────┐    │
│                           │       PostgreSQL           │    │
│                           └──────────────────────────┘    │
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
   ├── SÍ ──▶ POST /api/inspecciones → Backend → PostgreSQL
   │          → toast.success()
   │
   └── NO ──▶ Dexie: db.inspeccionesPendientes.add(datos)
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