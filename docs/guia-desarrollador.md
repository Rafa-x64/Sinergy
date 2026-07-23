# Guía del Desarrollador — Sinergy

Sinergy es un sistema de gestión de mantenimiento industrial construido como monorepo. Esta guía está escrita de forma cronológica: sigue cada sección en orden y al final del proceso tendrás un feature completo y funcional conectado de punta a punta.

---

## Tabla de Contenidos

### 0. Introducción
- [0.1 ¿Qué es Sinergy?](#01-qué-es-sinergy)
- [0.2 Arquitectura general](#02-arquitectura-general)
- [0.3 Estructura del monorepo](#03-estructura-del-monorepo)

### Requisitos e Instalación
- [1. Requisitos previos](#1-requisitos-previos)
- [2. Instalación del proyecto](#2-instalación-del-proyecto)
- [3. Variables de entorno](#3-variables-de-entorno)
- [4. Arrancar el sistema](#4-arrancar-el-sistema)

### Parte A — Backend (DDD-Lite)
- [A1. Entendiendo la arquitectura DDD-Lite](#a1-entendiendo-la-arquitectura-ddd-lite)
- [A2. Crear un modelo en Prisma](#a2-crear-un-modelo-en-prisma)
- [A3. Crear una entidad de dominio](#a3-crear-una-entidad-de-dominio)
- [A4. Crear la interfaz del repositorio](#a4-crear-la-interfaz-del-repositorio)
- [A5. Implementar el repositorio con Prisma](#a5-implementar-el-repositorio-con-prisma)
- [A6. Crear un caso de uso](#a6-crear-un-caso-de-uso)
- [A7. Crear el controlador HTTP](#a7-crear-el-controlador-http)
- [A8. Registrar la ruta en Express](#a8-registrar-la-ruta-en-express)
- [A9. Manejo global de errores](#a9-manejo-global-de-errores)

### Parte B — Frontend (Vue 3 SPA)
- [B1. Entendiendo la estructura del frontend](#b1-entendiendo-la-estructura-del-frontend)
- [B2. Crear una nueva vista (página)](#b2-crear-una-nueva-vista-página)
- [B3. Registrar la ruta en Vue Router](#b3-registrar-la-ruta-en-vue-router)
- [B4. Crear un componente base reutilizable](#b4-crear-un-componente-base-reutilizable)
- [B5. Crear un store de Pinia](#b5-crear-un-store-de-pinia)
- [B6. Crear un composable (lógica reutilizable)](#b6-crear-un-composable-lógica-reutilizable)
- [B7. Consumir la API del backend](#b7-consumir-la-api-del-backend)
- [B8. Crear un formulario con validación](#b8-crear-un-formulario-con-validación)
- [B9. Mostrar notificaciones al usuario](#b9-mostrar-notificaciones-al-usuario)
- [B10. Exportar datos (PDF y Excel)](#b10-exportar-datos-pdf-y-excel)

### Flujo Completo
- [C. Ejemplo end-to-end: módulo de Inspección](#c-ejemplo-end-to-end-módulo-de-inspección)

---

## 0.1 ¿Qué es Sinergy?

Sinergy es una **SPA (Single Page Application)** de gestión de mantenimiento industrial. Permite a técnicos capturar datos de inspección de equipos (montacargas, compresores, generadores, chillers) en planta, con soporte **offline-first** para cuando no haya conexión a internet. Los supervisores tienen un panel con estadísticas, reportes y control de roles.

**Tres plantas:**
- Extrusión
- Inyección
- Planta de Mezcla

**Dos tipos de usuarios principales:**

| Rol | Acceso |
|---|---|
| `TECNICO` | Captura de datos, visualización de sus registros |
| `SUPERVISOR` | Dashboard de estadísticas, creación de usuarios, reportes |

---

## 0.2 Arquitectura General

```
Navegador (Vue 3 SPA)
        ↓ HTTP/REST (Axios)
Backend Node.js (Express)
        ↓ Prisma ORM
Base de datos PostgreSQL
```

El frontend y el backend son proyectos independientes que se comunican únicamente a través de la API HTTP. Nunca comparten código de lógica de negocio.

---

## 0.3 Estructura del Monorepo

```
Sinergy/                          ← Raíz del monorepo
├── apps/
│   ├── frontend/                 ← Vue 3 + TypeScript + Bootstrap
│   │   └── src/
│   │       ├── components/       ← Componentes reutilizables
│   │       ├── composables/      ← Lógica reutilizable
│   │       ├── router/           ← Rutas de la SPA
│   │       ├── stores/           ← Estado global (Pinia)
│   │       ├── utils/            ← http.ts, helpers
│   │       └── views/            ← Páginas de la app
│   └── backend/                  ← Node.js + Express + Prisma
│       ├── prisma/               ← Migraciones, DDL y schema.prisma
│       ├── prisma.config.ts      ← Configuración de conexión dinámica PostgreSQL
│       └── src/
│           ├── domain/           ← Entidades, excepciones (AppError) e interfaces
│           ├── application/      ← Casos de uso
│           ├── infrastructure/   ← Repositorios Prisma, DB, middlewares (errorHandler, notFoundHandler)
│           └── interfaces/       ← Controladores HTTP, rutas
├── docs/                         ← Documentación del proyecto
├── package.json                  ← Scripts globales del monorepo
└── pnpm-workspace.yaml           ← Declaración de workspaces
```

---

## 1. Requisitos Previos

Antes de clonar el proyecto, asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Node.js | 20.x | `node -v` |
| pnpm | 8.x o superior | `pnpm -v` |
| PostgreSQL | 14.x | `psql --version` |
| Git | cualquiera | `git --version` |

Si no tienes pnpm:
```powershell
npm install -g pnpm
```

---

## 2. Instalación del Proyecto

```powershell
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd Sinergy

# 2. Instalar todas las dependencias de todos los workspaces
pnpm install --ignore-scripts

# 3. Verificar que los dos proyectos compilan sin errores
pnpm --filter @sinergy/backend build
pnpm --filter @sinergy/frontend build
```

> [!NOTE]
> `--ignore-scripts` es necesario porque pnpm bloquea los build scripts de paquetes nativos por seguridad. Las dependencias que lo requieren ya están configuradas en `pnpm.ignoredBuiltDependencies` del `package.json` raíz.

---

## 3. Variables de Entorno

### Backend (`apps/backend/.env`)

```env
# Cadena de conexión a PostgreSQL
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/sinergy_db"

# Puerto del servidor Express
PORT=3000

# Entorno de ejecución
NODE_ENV=development
```

### Frontend (`apps/frontend/.env`)

```env
# URL base de la API del backend
VITE_API_URL=http://localhost:3000/api

# Nombre de la app (aparece en el título del navegador)
VITE_APP_NAME=Sinergy
```

> [!CAUTION]
> Nunca subas archivos `.env` al repositorio. El `.gitignore` ya los excluye, pero verifica que sea así antes de hacer un commit.

---

## 4. Arrancar el Sistema

### Opción A — Ambos proyectos a la vez (recomendado para desarrollo)

```powershell
# Desde la raíz del monorepo
pnpm dev
```

Esto ejecuta frontend y backend de forma paralela usando `concurrently`.

### Opción B — Por separado

```powershell
# Solo el frontend (Vite, puerto 5173)
pnpm dev:frontend

# Solo el backend (Express, puerto 3000)
pnpm dev:backend
```

### Verificar que funciona

- Frontend: `http://localhost:5173`
- Backend (health check): `http://localhost:3000/api/health`

La respuesta del health check debe ser:
```json
{ "status": "ok", "message": "Backend DDD-Lite running" }
```

---

---

# Parte A — Backend (DDD-Lite)

La arquitectura del backend sigue **DDD-Lite**: una simplificación práctica de Domain-Driven Design con 4 capas. La regla de oro es **las dependencias siempre fluyen hacia adentro**:

```
interfaces/ → application/ → domain/
                  ↑
          infrastructure/
```

Esto significa que `domain/` no sabe que existe Prisma, ni Express. Es código puro de negocio.

---

## A1. Entendiendo la Arquitectura DDD-Lite

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Dominio | `src/domain/` | Entidades, interfaces de repositorios, reglas de negocio puras |
| Aplicación | `src/application/` | Casos de uso (orquestan el flujo de una operación) |
| Infraestructura | `src/infrastructure/` | Repositorios Prisma, conexión a DB, servicios externos |
| Interfaces | `src/interfaces/` | Controladores Express, rutas HTTP, middlewares |

**Flujo de una petición HTTP:**

```
Request → Router (interfaces/) → Controller (interfaces/)
        → UseCase (application/) → Repository Interface (domain/)
        → PrismaRepository (infrastructure/) → PostgreSQL
        → Response
```

---

## A2. Crear un Modelo en Prisma

Todo empieza en el schema. Modifica `apps/backend/prisma/schema.prisma`:

```prisma
// Agrega el nuevo modelo al final del archivo
model Tecnico {
  id           Int          @id @default(autoincrement())
  nombre       String
  cedula       String       @unique
  plantaId     Int
  planta       Planta       @relation(fields: [plantaId], references: [id])
  inspecciones Inspeccion[]
  creadoEn     DateTime     @default(now())

  @@index([plantaId])
}
```

Luego genera la migración:

```powershell
# Desde apps/backend/
npx prisma migrate dev --name add_tecnico_model
```

Esto crea el archivo de migración en `prisma/migrations/` y regenera el cliente TypeScript automáticamente.

> [!IMPORTANT]
> Cada vez que cambias el schema, debes correr `prisma migrate dev`. El cliente de Prisma que importas en el código se actualiza automáticamente con los nuevos tipos.

---

## A3. Crear una Entidad de Dominio

La entidad vive en `src/domain/entities/` y no tiene dependencias externas.

```typescript
// apps/backend/src/domain/entities/Tecnico.ts

export interface Tecnico {
  id: number
  nombre: string
  cedula: string
  plantaId: number
  creadoEn: Date
}

// Tipo para crear un técnico (sin id ni fecha, los asigna la DB)
export type CrearTecnicoDTO = Omit<Tecnico, 'id' | 'creadoEn'>
```

> [!TIP]
> Usa interfaces, no clases, para las entidades en DDD-Lite. Las clases con lógica compleja se reservan para dominios más ricos. En este nivel, los DTOs son suficientes y más simples de mantener.

---

## A4. Crear la Interfaz del Repositorio

Define el "contrato" que describe qué operaciones existen, sin decir cómo se implementan.

```typescript
// apps/backend/src/domain/repositories/ITecnicoRepository.ts
import type { Tecnico, CrearTecnicoDTO } from '../entities/Tecnico'

export interface ITecnicoRepository {
  findAll(): Promise<Tecnico[]>
  findById(id: number): Promise<Tecnico | null>
  findByPlanta(plantaId: number): Promise<Tecnico[]>
  create(datos: CrearTecnicoDTO): Promise<Tecnico>
}
```

Esta interfaz es lo único que conoce la capa de aplicación. **Nunca** importes Prisma directamente en un caso de uso.

---

## A5. Implementar el Repositorio con Prisma

La implementación concreta vive en `src/infrastructure/repositories/`.

```typescript
// apps/backend/src/infrastructure/repositories/PrismaTecnicoRepository.ts
import prisma from '../prisma/prismaClient'
import type { ITecnicoRepository } from '../../domain/repositories/ITecnicoRepository'
import type { Tecnico, CrearTecnicoDTO } from '../../domain/entities/Tecnico'

export class PrismaTecnicoRepository implements ITecnicoRepository {
  async findAll(): Promise<Tecnico[]> {
    return prisma.tecnico.findMany({
      orderBy: { nombre: 'asc' }
    })
  }

  async findById(id: number): Promise<Tecnico | null> {
    return prisma.tecnico.findUnique({ where: { id } })
  }

  async findByPlanta(plantaId: number): Promise<Tecnico[]> {
    return prisma.tecnico.findMany({
      where: { plantaId },
      orderBy: { nombre: 'asc' }
    })
  }

  async create(datos: CrearTecnicoDTO): Promise<Tecnico> {
    return prisma.tecnico.create({ data: datos })
  }
}
```

---

## A6. Crear un Caso de Uso

El caso de uso orquesta la lógica de negocio usando el repositorio (a través de su interfaz).

```typescript
// apps/backend/src/application/usecases/ObtenerTecnicosPorPlanta.ts
import type { ITecnicoRepository } from '../../domain/repositories/ITecnicoRepository'
import type { Tecnico } from '../../domain/entities/Tecnico'

export class ObtenerTecnicosPorPlanta {
  // Inyección de dependencias: recibe la interfaz, no la implementación
  constructor(private readonly tecnicoRepo: ITecnicoRepository) {}

  async execute(plantaId: number): Promise<Tecnico[]> {
    if (!plantaId || plantaId <= 0) {
      throw new Error('El ID de planta no es válido.')
    }
    return this.tecnicoRepo.findByPlanta(plantaId)
  }
}
```

```typescript
// apps/backend/src/application/usecases/CrearTecnico.ts
import type { ITecnicoRepository } from '../../domain/repositories/ITecnicoRepository'
import type { CrearTecnicoDTO, Tecnico } from '../../domain/entities/Tecnico'

export class CrearTecnico {
  constructor(private readonly tecnicoRepo: ITecnicoRepository) {}

  async execute(datos: CrearTecnicoDTO): Promise<Tecnico> {
    // Regla de negocio: la cédula no puede estar vacía
    if (!datos.cedula?.trim()) {
      throw new Error('La cédula del técnico es obligatoria.')
    }
    return this.tecnicoRepo.create(datos)
  }
}
```

---

## A7. Crear el Controlador HTTP

El controlador traduce entre HTTP (request/response) y los casos de uso.

```typescript
// apps/backend/src/interfaces/controllers/TecnicoController.ts
import type { Request, Response, NextFunction } from 'express'
import { PrismaTecnicoRepository } from '../../infrastructure/repositories/PrismaTecnicoRepository'
import { ObtenerTecnicosPorPlanta } from '../../application/usecases/ObtenerTecnicosPorPlanta'
import { CrearTecnico } from '../../application/usecases/CrearTecnico'

// Instanciación de dependencias (en un proyecto grande esto iría en un contenedor IoC)
const repo = new PrismaTecnicoRepository()
const obtenerPorPlanta = new ObtenerTecnicosPorPlanta(repo)
const crearTecnico = new CrearTecnico(repo)

export const TecnicoController = {
  async listarPorPlanta(req: Request, res: Response, next: NextFunction) {
    try {
      const plantaId = Number(req.params.plantaId)
      const tecnicos = await obtenerPorPlanta.execute(plantaId)
      res.json(tecnicos)
    } catch (error) {
      next(error) // Delega al manejador global de errores
    }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const tecnico = await crearTecnico.execute(req.body)
      res.status(201).json(tecnico)
    } catch (error) {
      next(error)
    }
  }
}
```

---

## A8. Registrar la Ruta en Express

```typescript
// apps/backend/src/interfaces/routes/tecnicoRoutes.ts
import { Router } from 'express'
import { TecnicoController } from '../controllers/TecnicoController'

const router = Router()

router.get('/planta/:plantaId', TecnicoController.listarPorPlanta)
router.post('/', TecnicoController.crear)

export default router
```

Luego regístrala en el punto de entrada del servidor:

```typescript
// apps/backend/src/index.ts
import express from 'express'
import cors from 'cors'
import tecnicoRoutes from './interfaces/routes/tecnicoRoutes'

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Rutas de la API
app.use('/api/tecnicos', tecnicoRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend DDD-Lite running' })
})

// Manejador global de errores (SIEMPRE al final)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[ERROR] ${err.message}`)
  res.status(500).json({ error: err.message })
})

app.listen(port, () => {
  console.log(` Backend running at http://localhost:${port}`)
})
```

---

## A9. Manejo Global de Errores

El middleware de errores de Express centraliza todas las respuestas de error. Los controladores **nunca** envían el error directamente al cliente; siempre llaman a `next(error)`.

```typescript
// apps/backend/src/interfaces/middlewares/errorHandler.ts
import type { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  statusCode?: number
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode ?? 500
  const message = statusCode === 500 ? 'Error interno del servidor.' : err.message

  // Nunca expongas el stack trace en producción
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack)
  }

  res.status(statusCode).json({
    success: false,
    error: message
  })
}
```

Registralo en `src/index.ts` al final de todos los middlewares y rutas:

```typescript
import { errorHandler } from './interfaces/middlewares/errorHandler'
// ... todas las rutas ...
app.use(errorHandler)
```

---

---

# Parte B — Frontend (Vue 3 SPA)

El frontend es una SPA construida con Vue 3, TypeScript, Bootstrap 5 y Pinia. Sigue la **Composition API** con `<script setup>` en todos los componentes. La lógica reutilizable va en composables, el estado compartido en stores de Pinia, y los estilos en las clases utilitarias de Bootstrap.

---

## B1. Entendiendo la Estructura del Frontend

```
src/
├── components/     ← Piezas de UI reutilizables (BaseButton, BaseCard, InspectionForm...)
├── composables/    ← Lógica reutilizable (useInspecciones, useExportPDF, useSync...)
├── router/         ← Definición de rutas (index.ts)
├── stores/         ← Estado global (authStore.ts, inspeccionStore.ts...)
├── utils/          ← http.ts (Axios), helpers
├── views/          ← Páginas completas (LoginView, DashboardView, InspeccionView...)
├── App.vue         ← Componente raíz
└── main.ts         ← Punto de entrada: registra plugins
```

**Regla:** Las vistas son orquestadoras. No tienen lógica de negocio propia. Delegan en composables y consumen stores.

---

## B2. Crear una Nueva Vista (Página)

Cada vista es un componente `.vue` en `src/views/`. Las vistas son el punto de entrada de una URL.

```vue
<!-- apps/frontend/src/views/TecnicosView.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useTecnicos } from '@/composables/useTecnicos'

// La vista delega toda la lógica al composable
const { tecnicos, cargando, error, cargarTecnicos } = useTecnicos()

onMounted(() => cargarTecnicos())
</script>

<template>
  <div class="container py-4">
    <h1 class="mb-4">Técnicos</h1>

    <div v-if="cargando" class="text-center">
      <div class="spinner-border text-primary" role="status" />
    </div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else class="row g-3">
      <div v-for="tecnico in tecnicos" :key="tecnico.id" class="col-md-4">
        <!-- Componente reutilizable -->
        <BaseCard :titulo="tecnico.nombre" :subtitulo="tecnico.cedula" />
      </div>
    </div>
  </div>
</template>
```

---

## B3. Registrar la Ruta en Vue Router

Agrega la nueva vista en `apps/frontend/src/router/index.ts`:

```typescript
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/tecnicos',
    name: 'tecnicos',
    // Lazy loading: el bundle de esta vista se carga solo cuando se navega aquí
    component: () => import('@/views/TecnicosView.vue'),
    meta: { requiresAuth: true, roles: ['SUPERVISOR'] }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, saved) => saved || { top: 0 }
})

// Guard de autenticación y autorización por rol
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const rol = localStorage.getItem('rol')

  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }

  const rolesPermitidos = to.meta.roles as string[] | undefined
  if (rolesPermitidos && rol && !rolesPermitidos.includes(rol)) {
    return { name: 'home' } // Redirige si no tiene el rol
  }
})

export default router
```

> [!TIP]
> Usa **siempre** lazy loading (`() => import(...)`) para las vistas. Así Vite divide el bundle en chunks por vista y el usuario solo descarga el código que necesita.

---

## B4. Crear un Componente Base Reutilizable

Los componentes base son los bloques de construcción del sistema. Estandarizan la UI.

```vue
<!-- apps/frontend/src/components/BaseCard.vue -->
<script setup lang="ts">
defineProps<{
  titulo: string
  subtitulo?: string
  variante?: 'default' | 'success' | 'danger' | 'warning'
}>()
</script>

<template>
  <div class="card h-100 shadow-sm border-0">
    <div class="card-body">
      <h6 class="card-title fw-semibold mb-1">{{ titulo }}</h6>
      <p v-if="subtitulo" class="card-subtitle text-muted small">{{ subtitulo }}</p>
      <!-- Slot para contenido personalizado -->
      <slot />
    </div>
  </div>
</template>
```

```vue
<!-- apps/frontend/src/components/BaseButton.vue -->
<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  loading?: boolean
  type?: 'button' | 'submit'
}>(), {
  variant: 'primary',
  loading: false,
  type: 'button'
})

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    :type="type"
    :class="`btn btn-${variant}`"
    :disabled="loading"
    @click="$emit('click')"
  >
    <span v-if="loading" class="spinner-border spinner-border-sm me-2" />
    {{ label }}
  </button>
</template>
```

> [!IMPORTANT]
> Prohibido crear estilos aislados por vista que rompan la coherencia. Si un estilo se repite en 2 lugares, extráelo a un componente base.

---

## B5. Crear un Store de Pinia

El store centraliza el estado que debe ser compartido entre múltiples vistas o componentes.

```typescript
// apps/frontend/src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UsuarioAutenticado {
  id: number
  nombre: string
  email: string
  rol: 'TECNICO' | 'SUPERVISOR' | 'ADMIN'
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const usuario = ref<UsuarioAutenticado | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const esSupervisor = computed(() => usuario.value?.rol === 'SUPERVISOR')

  const setToken = (nuevoToken: string) => {
    token.value = nuevoToken
    localStorage.setItem('token', nuevoToken)
  }

  const setUsuario = (datos: UsuarioAutenticado) => {
    usuario.value = datos
    localStorage.setItem('rol', datos.rol)
  }

  const logout = () => {
    token.value = null
    usuario.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('rol')
  }

  return { token, usuario, isAuthenticated, esSupervisor, setToken, setUsuario, logout }
})
```

---

## B6. Crear un Composable (Lógica Reutilizable)

Los composables encapsulan lógica que puede ser usada en múltiples vistas. No tienen template.

```typescript
// apps/frontend/src/composables/useTecnicos.ts
import { ref } from 'vue'
import http from '@/utils/http'
import type { Tecnico } from '@/types/Tecnico' // Define tus tipos en src/types/

export function useTecnicos() {
  const tecnicos = ref<Tecnico[]>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  const cargarTecnicos = async (plantaId?: number) => {
    cargando.value = true
    error.value = null
    try {
      const url = plantaId ? `/tecnicos/planta/${plantaId}` : '/tecnicos'
      const { data } = await http.get<Tecnico[]>(url)
      tecnicos.value = data
    } catch (e) {
      error.value = 'No se pudieron cargar los técnicos.'
    } finally {
      cargando.value = false
    }
  }

  return { tecnicos, cargando, error, cargarTecnicos }
}
```

---

## B7. Consumir la API del Backend

Toda comunicación HTTP pasa por la instancia centralizada de Axios. Crea el archivo si no existe:

```typescript
// apps/frontend/src/utils/http.ts
import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:3000/api
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// Adjunta el JWT en cada petición
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirige al login si el token expira
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default http
```

**Nunca uses `axios` directamente en un componente o vista.** Siempre importa `http` desde `@/utils/http`.

---

## B8. Crear un Formulario con Validación

Usa VeeValidate + Yup. El esquema de validación va en `src/schemas/`.

```typescript
// apps/frontend/src/schemas/crearTecnicoSchema.ts
import * as yup from 'yup'

export const crearTecnicoSchema = yup.object({
  nombre: yup.string().min(3, 'Mínimo 3 caracteres').required('El nombre es obligatorio'),
  cedula: yup.string().matches(/^\d{7,8}$/, 'La cédula debe tener 7 u 8 dígitos').required('La cédula es obligatoria'),
  plantaId: yup.number().positive('Selecciona una planta').required('La planta es obligatoria')
})
```

```vue
<!-- apps/frontend/src/components/FormCrearTecnico.vue -->
<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { useToast } from 'vue-toastification'
import { crearTecnicoSchema } from '@/schemas/crearTecnicoSchema'
import http from '@/utils/http'

const emit = defineEmits<{ creado: [] }>()
const toast = useToast()

const { handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: crearTecnicoSchema
})

const { value: nombre } = useField<string>('nombre')
const { value: cedula } = useField<string>('cedula')
const { value: plantaId } = useField<number>('plantaId')

const onSubmit = handleSubmit(async (values) => {
  try {
    await http.post('/tecnicos', values)
    toast.success('Técnico creado correctamente.')
    emit('creado')
  } catch {
    toast.error('No se pudo crear el técnico.')
  }
})
</script>

<template>
  <form @submit="onSubmit" novalidate>
    <div class="mb-3">
      <label class="form-label">Nombre</label>
      <input v-model="nombre" class="form-control" :class="{ 'is-invalid': errors.nombre }" />
      <div class="invalid-feedback">{{ errors.nombre }}</div>
    </div>

    <div class="mb-3">
      <label class="form-label">Cédula</label>
      <input v-model="cedula" class="form-control" :class="{ 'is-invalid': errors.cedula }" />
      <div class="invalid-feedback">{{ errors.cedula }}</div>
    </div>

    <div class="mb-3">
      <label class="form-label">Planta</label>
      <select v-model="plantaId" class="form-select" :class="{ 'is-invalid': errors.plantaId }">
        <option :value="1">Extrusión</option>
        <option :value="2">Inyección</option>
        <option :value="3">Planta de Mezcla</option>
      </select>
      <div class="invalid-feedback">{{ errors.plantaId }}</div>
    </div>

    <BaseButton label="Crear Técnico" type="submit" :loading="isSubmitting" />
  </form>
</template>
```

---

## B9. Mostrar Notificaciones al Usuario

Vue Toastification ya está registrado en `main.ts`. Úsalo en cualquier composable o componente:

```typescript
import { useToast } from 'vue-toastification'

const toast = useToast()

// Tipos de notificación disponibles
toast.success('Inspección guardada correctamente.')
toast.error('Error al conectar con el servidor.')
toast.warning('Sin conexión. Los datos se guardarán localmente.')
toast.info('Sincronizando 3 registros pendientes...')
```

---

## B10. Exportar Datos (PDF y Excel)

### Excel

```typescript
// apps/frontend/src/composables/useExportExcel.ts
import * as XLSX from 'xlsx'

export function useExportExcel() {
  const exportar = <T extends object>(datos: T[], nombreArchivo: string) => {
    const hoja = XLSX.utils.json_to_sheet(datos)
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Reporte')
    XLSX.writeFile(libro, `${nombreArchivo}.xlsx`)
  }

  return { exportar }
}
```

### PDF

```typescript
// apps/frontend/src/composables/useExportPDF.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export function useExportPDF() {
  const exportar = async (elemento: HTMLElement, nombreArchivo: string) => {
    const canvas = await html2canvas(elemento, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const anchoA4 = 210
    const alto = (canvas.height * anchoA4) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, anchoA4, alto)
    pdf.save(`${nombreArchivo}.pdf`)
  }

  return { exportar }
}
```

**Uso en una vista:**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useExportPDF } from '@/composables/useExportPDF'
import { useExportExcel } from '@/composables/useExportExcel'

const reporteRef = ref<HTMLElement | null>(null)
const { exportar: exportarPDF } = useExportPDF()
const { exportar: exportarExcel } = useExportExcel()

const inspecciones = [
  { fecha: '2026-07-20', tecnico: 'Ana López', equipo: 'Compresor C-01', estado: 'Normal' }
]
</script>

<template>
  <div class="d-flex gap-2 mb-3">
    <BaseButton label="Exportar PDF" variant="danger" @click="exportarPDF(reporteRef!, 'inspecciones')" />
    <BaseButton label="Exportar Excel" variant="success" @click="exportarExcel(inspecciones, 'inspecciones')" />
  </div>

  <div ref="reporteRef">
    <!-- Contenido del reporte -->
  </div>
</template>
```

---

---

# C. Ejemplo End-to-End: Módulo de Inspección

Este ejemplo conecta todo lo anterior en un flujo completo.

**Objetivo:** El técnico selecciona un equipo y registra una inspección. Si no hay conexión, se guarda localmente y se sincroniza al reconectarse.

### Paso 1 — Backend: Caso de uso `RegistrarInspeccion`

```typescript
// apps/backend/src/application/usecases/RegistrarInspeccion.ts
import type { IInspeccionRepository } from '../../domain/repositories/IInspeccionRepository'
import type { CrearInspeccionDTO } from '../../domain/entities/Inspeccion'

export class RegistrarInspeccion {
  constructor(private readonly repo: IInspeccionRepository) {}

  async execute(dto: CrearInspeccionDTO) {
    if (!dto.equipoId || !dto.usuarioId) {
      throw Object.assign(new Error('Equipo y usuario son requeridos.'), { statusCode: 400 })
    }
    return this.repo.create(dto)
  }
}
```

### Paso 2 — Backend: Ruta `POST /api/inspecciones`

```typescript
// En src/interfaces/routes/inspeccionRoutes.ts
router.post('/', InspeccionController.registrar)
```

### Paso 3 — Frontend: Composable con soporte offline

```typescript
// apps/frontend/src/composables/useInspecciones.ts
import { useOnline } from '@vueuse/core'
import { db } from '@/db/database'
import http from '@/utils/http'
import { useToast } from 'vue-toastification'

export function useInspecciones() {
  const isOnline = useOnline()
  const toast = useToast()

  const registrar = async (datos: object) => {
    if (isOnline.value) {
      await http.post('/inspecciones', datos)
      toast.success('Inspección registrada.')
    } else {
      await db.inspeccionesPendientes.add({ datos, creadoEn: new Date() })
      toast.warning('Sin conexión. Se guardó localmente.')
    }
  }

  const sincronizar = async () => {
    if (!isOnline.value) return
    const pendientes = await db.inspeccionesPendientes.toArray()
    if (!pendientes.length) return

    await http.post('/inspecciones/batch', pendientes)
    await db.inspeccionesPendientes.clear()
    toast.info(`${pendientes.length} inspecciones sincronizadas.`)
  }

  return { registrar, sincronizar }
}
```

### Paso 4 — Frontend: Vista de captura

```vue
<!-- apps/frontend/src/views/InspeccionView.vue -->
<script setup lang="ts">
import { useInspecciones } from '@/composables/useInspecciones'

const { registrar } = useInspecciones()

const guardar = () => registrar({ equipoId: 1, usuarioId: 2, datos: { nivelAceite: 'Normal' } })
</script>

<template>
  <div class="container py-4">
    <h1>Nueva Inspección</h1>
    <!-- FormularioInspeccion llama a guardar() en su emit -->
    <BaseButton label="Guardar Inspección" @click="guardar" />
  </div>
</template>
```

---

## Checklist para un Feature Completo

Usa esta lista cada vez que implementes una nueva funcionalidad:

- `[ ]` **Prisma:** Modelo agregado en `schema.prisma` + migración ejecutada
- `[ ]` **Dominio:** Entidad e interfaz de repositorio creadas en `domain/`
- `[ ]` **Infraestructura:** Repositorio Prisma implementado en `infrastructure/`
- `[ ]` **Aplicación:** Caso de uso creado en `application/usecases/`
- `[ ]` **Interfaces:** Controlador y ruta registrada en Express
- `[ ]` **Frontend:** Tipo TypeScript definido en `src/types/`
- `[ ]` **Frontend:** Composable creado con manejo de estado (cargando, error)
- `[ ]` **Frontend:** Vista creada y ruta registrada en Vue Router
- `[ ]` **Frontend:** Formulario con esquema Yup + VeeValidate si aplica
- `[ ]` **Docs:** Documentación actualizada (`api/`, `views/`, `schemas/`)
