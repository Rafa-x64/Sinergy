# Guía del Desarrollador — Sinergy

> Esta guía es el punto de entrada. Para implementar funcionalidades, dirígete directamente a la guía especializada de cada rol.

---

## Guías Especializadas

| Guía | Contenido | Archivo |
|---|---|---|
| **Backend** | Módulos Express, Prisma, controladores, servicios, rutas, errores, JWT | [guia-backend.md](./guia-backend.md) |
| **Frontend** | Stores Pinia, cliente Axios `api`, vistas Vue 3, formularios, router | [guia-frontend.md](./guia-frontend.md) |
| **Componentes** | Diccionario de componentes UI (`AppTabs`, `Menu`, `SinergyChip`, `ThemeToggle`) | [diccionario-componentes.md](./components/diccionario-componentes.md) |
| **Vistas** | Catálogo de páginas SPA (`Login`, `Dashboard`, `Plantas`, `Ubicaciones`, etc.) | [catalogo-vistas.md](./views/catalogo-vistas.md) |
| **Módulos** | Mapa integrado de trazabilidad entre Backend (Express) y Frontend (Vue) | [mapa-modulos.md](./modulos/mapa-modulos.md) |
| **Stores** | Catálogo de stores de estado global reactivo Pinia y DTOs | [catalogo-stores.md](./stores/catalogo-stores.md) |

---

## Qué cubre cada guía

### [guia-backend.md](./guia-backend.md)
- **Orden de Creación Lógico**: Prisma Model (`schema.prisma`) → Schemas DTO (`*.schemas.ts`) → Service (`*.service.ts`) → Controller (`*.controller.ts`) → Routes (`*.routes.ts`) → Express Server (`server.ts`)
- Estructura de carpetas `src/core/` y `src/modules/`
- El contrato `ResponseDTO` y tabla de códigos HTTP usados
- Utilidades del core: `parsearId`, `validarCodigo`, `capitalizarPalabras`, `constantes.ts`
- Manejo explícito de errores de Prisma: `P2002`, `P2025`, `P2003`
- Seguridad y autenticación JWT: `validarJWT` y `req.usuario`
- Tutorial completo paso a paso para crear el módulo `proveedores`
- Tutorial para agregar un endpoint a un módulo existente
- Solución a errores comunes de compilación y runtime

### [guia-frontend.md](./guia-frontend.md)
- **Orden de Creación Lógico**: Cliente HTTP (`api.ts`) + `RespuestaApi<T>` + Core Types → Store Pinia (`*.store.ts`) → Validaciones (`validations/registro.ts`) → Componente Formulario Reusable (`components/*Form.vue`) → Vista Principal (`views/*View.vue`) → Router (`router.ts`) + Menú (`Menu.vue`)
- Estructura de carpetas `src/core/` y `src/modules/`
- La instancia HTTP `api` con interceptores automáticos de JWT y auto-refresh
- Stores Pinia con Composition API, DTOs locales y desestructuración reactiva con `storeToRefs`
- Formularios reusables con Vuetify 3, `VuetifyForm`, props/emits y `watch` profundo (`deep: true`)
- Vistas principales con `AppTabs`, `v-data-table`, `v-dialog` de confirmación y `useToast`
- Router: registro de rutas protegidas, Navigation Guard y sincronización con `Menu.vue`
- Tutorial completo paso a paso para crear el módulo `proveedores`
- Solución a errores comunes de reactividad, formularios y peticiones HTTP

### [diccionario-componentes.md](./components/diccionario-componentes.md)
- Props, Emits, Slots, Vue Composition API y Vuetify 3 para `AppTabs`, `Menu`, `SinergyChip` y `ThemeToggle`

### [catalogo-vistas.md](./views/catalogo-vistas.md)
- Rutas, permisos, stores consumidos y componentes incrustados en cada vista SPA del proyecto

### [mapa-modulos.md](./modulos/mapa-modulos.md)
- Matriz de trazabilidad de punta a punta entre modelos de BD, endpoints Express, stores Pinia y vistas Vue

### [catalogo-stores.md](./stores/catalogo-stores.md)
- Estado reactivo Pinia, DTOs exportados, llamadas a la API mediante Axios y patrones con `storeToRefs`

---

Sinergy es un sistema de gestión de mantenimiento industrial construido como monorepo. Esta guía está escrita de forma cronológica e instructiva: sigue cada sección en orden y al final del proceso tendrás las bases para crear features completos y funcionales conectados de punta a punta entre el Backend (Express + Prisma) y el Frontend (Vue 3 + Pinia + Vuetify 3).

---

## Tabla de Contenidos

- [0. Introducción y Arquitectura](#0-introducción-y-arquitectura)
  - [0.1 ¿Qué es Sinergy?](#01-qué-es-sinergy)
  - [0.2 Arquitectura General](#02-arquitectura-general)
  - [0.3 Estructura del Monorepo](#03-estructura-del-monorepo)
- [1. Guía de Inicio Rápido](#1-guía-de-inicio-rápido)
  - [1.1 Requisitos Previos](#11-requisitos-previos)
  - [1.2 Instalación del Monorepo](#12-instalación-del-monorepo)
  - [1.3 Variables de Entorno (.env)](#13-variables-de-entorno-env)
  - [1.4 Ejecución del Sistema](#14-ejecución-del-sistema)
- [2. Parte A — Backend (Feature-Based Architecture)](#2-parte-a--backend-feature-based-architecture)
  - [2.1 Principios de la Arquitectura por Módulos](#21-principios-de-la-arquitectura-por-módulos)
  - [2.2 Modelado de Base de Datos con Prisma](#22-modelado-de-base-de-datos-con-prisma)
  - [2.3 Estándar Unificado de Respuestas HTTP (status, message, data)](#23-estándar-unificado-de-respuestas-http-status-message-data)
  - [2.4 Creación de un Módulo Backend (Orden Lógico de Capas)](#24-creación-de-un-módulo-backend-orden-lógico-de-capas)
  - [2.5 Registro del Módulo en Express Server](#25-registro-del-módulo-en-express-server)
  - [2.6 Manejo Global de Errores (AppError y ErrorHandler)](#26-manejo-global-de-errores-apperror-y-errorhandler)
- [3. Parte B — Frontend (Vue 3 SPA, Pinia y Vuetify 3)](#3-parte-b--frontend-vue-3-spa-pinia-y-vuetify-3)
  - [3.1 Estructura Modular del Frontend](#31-estructura-modular-del-frontend)
  - [3.2 Gestión del Token de Sesión y Autenticación (Access Token + Refresh Cookie)](#32-gestión-del-token-de-sesión-y-autenticación-access-token--refresh-cookie)
  - [3.3 Creación y Estructura de Stores en Pinia (*.store.ts)](#33-creación-y-estructura-de-stores-en-pinia-storets)
  - [3.4 Consumo Directo del Backend con la Instancia api](#34-consumo-directo-del-backend-con-la-instancia-api)
  - [3.5 Componentes Formulario Reusables (*Form.vue) y Validaciones](#35-componentes-formulario-reusables-formvue-y-validaciones)
  - [3.6 Creación de Vistas (*View.vue) y Configuración en Vue Router (router.ts)](#36-creación-de-vistas-viewvue-y-configuración-en-vue-router-routerts)
  - [3.7 Sistema de Notificaciones Globales (useToast)](#37-sistema-de-notificaciones-globales-usetoast)
  - [3.8 Ejemplo Práctico: Módulo de Plantas (PlantasView.vue + plantas.store.ts)](#38-ejemplo-práctico-módulo-de-plantas-plantasviewvue--plantasstorets)
  - [3.9 Ejemplo Práctico: Formulario de Login (LoginView.vue + auth.store.ts)](#39-ejemplo-práctico-formulario-de-login-loginviewvue--authstorets)
- [4. Parte C — Flujo End-to-End Paso a Paso](#4-parte-c--flujo-end-to-end-paso-a-paso)
  - [4.1 Ejemplo Completo de Feature: Módulo de Equipos](#41-ejemplo-completo-de-feature-módulo-de-equipos)
  - [4.2 Checklist para Implementar un Nuevo Feature](#42-checklist-para-implementar-un-nuevo-feature)

---

## 0. Introducción y Arquitectura

### 0.1 ¿Qué es Sinergy?

Sinergy es una **Single Page Application (SPA)** de gestión de mantenimiento industrial y control de activos. Permite a los técnicos capturar métricas e inspecciones en planta (montacargas, compresores, generadores, chillers) con soporte **offline-first**, y a los supervisores visualizar estadísticas en tiempo real, generar reportes y administrar la estructura operativa.

**Plantas principales:**
- Extrusión
- Inyección
- Planta de Mezcla

**Roles de usuario:**
| Rol | Acceso |
|---|---|
| `TECNICO` | Captura de inspecciones, consulta de sus registros en planta |
| `SUPERVISOR` / `ADMIN` | Dashboard estadístico, gestión de usuarios, catálogo de roles y reportes |

---

### 0.2 Arquitectura General

```
Navegador Client (Vue 3 SPA + Pinia + Vuetify 3)
        │
        ├── Peticiones HTTP (authStore.apiFetch)
        ├── Access Token en Memoria (Header Authorization: Bearer <token>)
        └── Refresh Token en Cookie HttpOnly (SameSite=Strict)
        │
        ▼
Backend REST API (Node.js + Express + TypeScript)
        │
        ├── Middlewares (autenticar, errorHandler, cors, cookieParser)
        ├── Módulos (Routes → Controller → Service)
        └── Prisma ORM (Driver Adapter Postgres)
        │
        ▼
Base de Datos (PostgreSQL)
```

---

### 0.3 Estructura del Monorepo

```
Sinergy/                          ← Raíz del monorepo
├── apps/
│   ├── shared/                   ← Tipos e interfaces comunes
│   ├── frontend/                 ← Vue 3 + TypeScript + Vuetify 3 + Pinia
│   │   └── src/
│   │       ├── components/       ← Componentes globales (Menu.vue, AppTabs.vue)
│   │       ├── core/             ← router.ts, vuetify.ts, types/
│   │       ├── plugins/          ← toast.ts (vue-toastification)
│   │       └── modules/          ← auth/, plantas/, equipo/, mantenimiento/
│   └── backend/                  ← Node.js + Express + Prisma ORM
│       ├── prisma/               ← schema.prisma, DDL SQL
│       └── src/
│         ├── core/               ← server.ts, prisma.ts, errors/, middlewares/
│         └── modules/            ← auth/, roles/, equipment/, maintenance/
├── docs/                         ← Documentación oficial
├── package.json                  ← Coordinador monorepo (pnpm)
└── pnpm-workspace.yaml           ← Espacios de trabajo declarados
```

---

## 1. Guía de Inicio Rápido

### 1.1 Requisitos Previos

| Herramienta | Versión recomendada | Verificación |
|---|---|---|
| Node.js | >= 20.x | `node -v` |
| pnpm | >= 8.x | `pnpm -v` |
| PostgreSQL | >= 14.x | `psql --version` |

---

### 1.2 Instalación del Monorepo

```powershell
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd Sinergy

# 2. Instalar dependencias de todos los workspaces
pnpm install --ignore-scripts

# 3. Validar compilación TypeScript en el monorepo
pnpm --filter @sinergy/backend build
pnpm --filter @sinergy/frontend build
```

---

### 1.3 Variables de Entorno (.env)

#### Backend (`apps/backend/.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/Sinergy?schema=public"
PORT=3000
NODE_ENV=development

# Claves secretas de firma JWT (reemplazar en producción)
JWT_ACCESS_SECRET=sinergy_access_secret_CAMBIAR_EN_PRODUCCION
JWT_REFRESH_SECRET=sinergy_refresh_secret_CAMBIAR_EN_PRODUCCION
```

#### Frontend (`apps/frontend/.env`)
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Sinergy
```

---

### 1.4 Ejecución del Sistema

```powershell
# Iniciar Frontend (puerto 5173) y Backend (puerto 3000) en paralelo
pnpm dev
```

---

## 2. Parte A — Backend (Feature-Based Architecture)

### 2.1 Principios de la Arquitectura por Módulos

La arquitectura backend organiza el código en carpetas aisladas por **funcionalidad de negocio** (`src/modules/<modulo>/`). Cada módulo agrupa exclusivamente sus piezas de ejecución:

```
src/modules/plantas/
├── plantas.routes.ts     ← Definición de endpoints HTTP y middlewares
├── plantas.controller.ts ← Extracción de req, validaciones nativas y envío de res
├── plantas.service.ts    ← Lógica de negocio y consultas directas con Prisma
└── plantas.schemas.ts    ← Interfaces DTO de TypeScript puras
```

---

### 2.2 Modelado de Base de Datos con Prisma

Edita `apps/backend/prisma/schema.prisma` para incorporar o actualizar modelos:

```prisma
model Planta {
  id        Int      @id @default(autoincrement())
  codigo    String   @unique @db.VarChar(50)
  nombre    String   @db.VarChar(100)
  activa    Boolean  @default(true)
  creadoEn  DateTime @default(now()) @map("creado_en")

  @@map("plantas")
}
```

Posteriormente ejecuta la migración:
```powershell
pnpm --filter @sinergy/backend exec prisma migrate dev --name agregar_tabla_plantas
```

---

### 2.3 Estándar Unificado de Respuestas HTTP (`{ status, message, data }`)

Todo controlador backend debe responder **exclusivamente** utilizando el formato unificado `ResponseDTO`:

#### Petición Exitosa (HTTP 2xx)
```json
{
  "status": "ok",
  "message": "Operación realizada correctamente",
  "data": { ... }
}
```

#### Petición Fallida (HTTP 4xx / 5xx)
```json
{
  "status": "error",
  "message": "Descripción directa del error para el usuario"
}
```

---

### 2.4 Creación de un Módulo Backend (Routes, Controller, Service)

#### 1. Servicio (`src/modules/plantas/plantas.service.ts`)
```typescript
import prisma from '../../core/prisma'

export class PlantasService {
  async listar() {
    return prisma.planta.findMany({ orderBy: { nombre: 'asc' } })
  }

  async crear(datos: { codigo: string; nombre: string; activa?: boolean }) {
    return prisma.planta.create({ data: datos })
  }
}

export const plantasService = new PlantasService()
```

#### 2. Controlador (`src/modules/plantas/plantas.controller.ts`)
```typescript
import { Request, Response, NextFunction } from 'express'
import { plantasService } from './plantas.service'

export const plantasController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const plantas = await plantasService.listar()
      return res.status(200).json({ status: 'ok', data: plantas })
    } catch (error) {
      next(error)
    }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const { codigo, nombre, activa } = req.body

      if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
        return res.status(400).json({ status: 'error', message: 'El código de la planta es requerido' })
      }

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre de la planta es requerido' })
      }

      const nuevaPlanta = await plantasService.crear({
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        activa: typeof activa === 'boolean' ? activa : true,
      })

      return res.status(201).json({
        status: 'ok',
        message: 'Planta registrada exitosamente',
        data: nuevaPlanta,
      })
    } catch (error) {
      next(error)
    }
  },
}
```

#### 3. Rutas (`src/modules/plantas/plantas.routes.ts`)
```typescript
import { Router } from 'express'
import { plantasController } from './plantas.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.get(['/listar', '/listar/'], validarJWT, plantasController.listar)
router.post(['/crear', '/crear/'],   validarJWT, plantasController.crear)

export default router
```

---

### 2.5 Registro del Módulo en Express Server

Edita `apps/backend/src/core/server.ts` para conectar las rutas del nuevo módulo:

```typescript
import plantasRoutes from '../modules/plantas/plantas.routes'

// ...
app.use('/api/plantas', plantasRoutes)
```

---

### 2.6 Manejo Global de Errores (AppError & ErrorHandler)

Los errores conocidos de negocio se lanzan con `AppError(mensaje, statusCode)`. El middleware centralizado `errorHandler.ts` transforma cualquier excepción no capturada en una respuesta unificada de error:

```typescript
// apps/backend/src/core/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  let statusCode = 500
  let message = 'Error interno del servidor'

  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }

  return res.status(statusCode).json({
    status: 'error',
    message,
  })
}
```

---

## 3. Parte B — Frontend (Vue 3 SPA, Pinia & Vuetify 3)

El frontend está desarrollado con Vue 3, Composition API (`<script setup lang="ts">`), Vuetify 3, Pinia y `vue-toastification`.

---

### 3.1 Estructura Modular del Frontend

```
src/modules/plantas/
├── components/          ← Componentes UI específicos del módulo
├── validations/         ← Esquemas de validación de Vuetify/TypeScript
├── views/               ← Componentes de vista (.vue)
│   └── PlantasView.vue
└── plantas.store.ts     ← Estado global del módulo en Pinia
```

---

### 3.2 Gestión del Token de Sesión y Autenticación (Access Token + Refresh Cookie)

Sinergy utiliza la estrategia de **Doble Token JWT**:

1. **Access Token (15 min):** Retornado en el body JSON tras el login. Se guarda exclusivamente en la **memoria de Pinia** (`accessToken = ref<string | null>(null)`). Nunca se guarda en `localStorage` por protección contra XSS.
2. **Refresh Token (7 días):** Transmitido como **HttpOnly Cookie** en la cabecera del navegador. Permite restaurar la sesión automáticamente sin intervención del usuario.

---

### 3.3 Creación y Estructura de Stores en Pinia (`*.store.ts`)

Los stores de Pinia se definen utilizando la sintaxis de **Composition API** (`defineStore('nombre', () => { ... })`).

#### Estructura Estándar de la Respuesta API (`RespuestaApi<T>`)

```typescript
export interface RespuestaApi<T = void> {
  status: 'ok' | 'error'
  message?: string
  data?: T
}
```

---

### 3.4 Consumo Directo del Backend con `authStore.apiFetch`

El `useAuthStore` provee la función helper `apiFetch(endpoint, options)` que automatiza:
- Concatenación de la URL base (`http://localhost:3000/api`)
- Inyección del header `Authorization: Bearer <accessToken>`
- Inclusión del parámetro `credentials: 'include'` para transmitir cookies HttpOnly

```typescript
// apps/frontend/src/modules/auth/auth.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface RespuestaApi<T = void> {
  status: 'ok' | 'error'
  message?: string
  data?: T
}

export const API_URL = 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const estaAutenticado = computed<boolean>(() => accessToken.value !== null)

  async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers)
    if (accessToken.value) {
      headers.set('Authorization', `Bearer ${accessToken.value}`)
    }

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    })
  }

  async function refrescarToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) {
        cerrarSesion()
        return false
      }

      const resultado: RespuestaApi<{ accessToken: string }> = await response.json()
      if (resultado.status === 'ok' && resultado.data?.accessToken) {
        accessToken.value = resultado.data.accessToken
        return true
      }
      return false
    } catch {
      cerrarSesion()
      return false
    }
  }

  function cerrarSesion(): void {
    accessToken.value = null
  }

  return { accessToken, estaAutenticado, apiFetch, refrescarToken, cerrarSesion }
})
```

---

### 3.5 Creación de Vistas (`*View.vue`) y Configuración en Vue Router (`router.ts`)

Registra la ruta en `apps/frontend/src/core/router.ts` configurando el Guard de navegación global:

```typescript
// apps/frontend/src/core/router.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../modules/auth/auth.store'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'login',
    component: () => import('../modules/auth/views/LoginView.vue'),
    meta: { requiresAuth: false, hideLayout: true },
  },
  {
    path: '/plantas',
    name: 'plantas',
    component: () => import('../modules/plantas/views/PlantasView.vue'),
    meta: { requiresAuth: true, hideLayout: false },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const requiereAuth = to.meta.requiresAuth === true

  if (requiereAuth && !authStore.estaAutenticado) {
    const sesionRestaurada = await authStore.refrescarToken()
    if (!sesionRestaurada) return { name: 'login' }
  }
})

export default router
```

---

### 3.6 Validaciones de Formularios en Tiempo Real (Vuetify 3 & `:rules`)

En Vuetify 3, los formularios se validan utilizando el componente `<v-form ref="formRef">` y la propiedad `:rules` en cada campo de texto.

#### Definición de Tipo del Formulario (`src/core/types/vuetifyForm.ts`)
```typescript
export interface VuetifyForm {
  validate: () => Promise<{ valid: boolean }>
  reset: () => void
  resetValidation: () => void
}
```

#### Reglas de Validación
```typescript
export const plantasRules = {
  codigo: [
    (v: string) => !!v || 'El código es requerido',
    (v: string) => v.length >= 2 || 'El código debe tener al menos 2 caracteres',
  ],
  nombre: [
    (v: string) => !!v || 'El nombre de la planta es requerido',
  ],
}
```

---

### 3.7 Sistema de Notificaciones Globales (`useToast`)

Las notificaciones de feedback al usuario se manejan con `useToast()` de `vue-toastification`:

```typescript
import { useToast } from 'vue-toastification'

const toast = useToast()

// Ejemplos de uso según el estado de la API:
if (resultado.status === 'ok') {
  toast.success(resultado.message ?? 'Operación realizada con éxito')
} else {
  toast.error(resultado.message ?? 'Ocurrió un error en la operación')
}
```

---

### 3.8 Ejemplo Práctico: Módulo de Plantas (`PlantasView.vue` + `plantas.store.ts`)

#### Store (`src/modules/plantas/plantas.store.ts`)
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore, type RespuestaApi } from '../auth/auth.store'

export interface Planta {
  id: number
  codigo: string
  nombre: string
  activa: boolean
}

export interface RegistrarPlantaDTO {
  codigo: string
  nombre: string
  activa: boolean
}

export const usePlantasStore = defineStore('plantas', () => {
  const authStore = useAuthStore()
  const plantas = ref<Planta[]>([])

  async function listarPlantas(): Promise<RespuestaApi<Planta[]>> {
    try {
      const response = await authStore.apiFetch('/plantas/listar', { method: 'GET' })
      const resultado: RespuestaApi<Planta[]> = await response.json()

      if (resultado.status === 'ok' && resultado.data) {
        plantas.value = resultado.data
      }
      return resultado
    } catch {
      return { status: 'error', message: 'Error de conexión con el servidor' }
    }
  }

  async function registrarPlanta(datos: RegistrarPlantaDTO): Promise<RespuestaApi<Planta>> {
    try {
      const response = await authStore.apiFetch('/plantas/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })
      const resultado: RespuestaApi<Planta> = await response.json()

      if (resultado.status === 'ok' && resultado.data) {
        plantas.value.push(resultado.data)
      }
      return resultado
    } catch {
      return { status: 'error', message: 'Error de conexión con el servidor' }
    }
  }

  return { plantas, listarPlantas, registrarPlanta }
})
```

#### Vista (`src/modules/plantas/views/PlantasView.vue`)
```vue
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import { usePlantasStore, type RegistrarPlantaDTO } from '../plantas.store'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'

const toast = useToast()
const plantasStore = usePlantasStore()
const { plantas } = storeToRefs(plantasStore)

const cargando = ref<boolean>(false)
const formRef = ref<VuetifyForm | null>(null)

const formulario = reactive<RegistrarPlantaDTO>({
  codigo: '',
  nombre: '',
  activa: true,
})

const manejarRegistro = async (): Promise<void> => {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  cargando.value = true
  try {
    const resultado = await plantasStore.registrarPlanta(formulario)

    if (resultado.status === 'ok') {
      toast.success(resultado.message ?? 'Planta registrada correctamente')
      formRef.value.reset()
    } else {
      toast.error(resultado.message ?? 'Error al registrar la planta')
    }
  } catch {
    toast.error('Error de conexión con el servidor')
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  const resultado = await plantasStore.listarPlantas()
  if (resultado.status === 'error') {
    toast.error(resultado.message ?? 'Error al cargar las plantas')
  }
})
</script>

<template>
  <v-container fluid>
    <v-card class="pa-6 mb-6" elevation="2">
      <h2 class="text-h5 font-weight-bold mb-4">Registrar Nueva Planta</h2>
      <v-form ref="formRef" @submit.prevent="manejarRegistro">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="formulario.codigo" label="Código" variant="outlined" placeholder="EXT-01" required></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="formulario.nombre" label="Nombre de la Planta" variant="outlined" placeholder="Planta Extrusión" required></v-text-field>
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center">
            <v-switch v-model="formulario.activa" label="Activa" color="primary"></v-switch>
          </v-col>
        </v-row>
        <v-btn type="submit" color="primary" size="large" :loading="cargando">
          Guardar Planta
        </v-btn>
      </v-form>
    </v-card>

    <v-card elevation="2">
      <v-card-title class="font-weight-bold">Plantas Registradas</v-card-title>
      <v-data-table :items="plantas">
        <template #item.activa="{ item }">
          <v-chip :color="item.activa ? 'success' : 'error'" size="small">
            {{ item.activa ? 'Activa' : 'Inactiva' }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>
```

---

### 3.9 Ejemplo Práctico: Formulario de Login (`LoginView.vue` + `auth.store.ts`)

```vue
<!-- apps/frontend/src/modules/auth/views/LoginView.vue -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore, type LoginDTO } from '../auth.store'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const cargando = ref<boolean>(false)
const formRef = ref<VuetifyForm | null>(null)

const formulario = reactive<LoginDTO>({
  email: '',
  password: '',
})

const manejarSubmit = async (): Promise<void> => {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  cargando.value = true
  try {
    const resultado = await authStore.login(formulario)

    if (resultado.status === 'ok' && authStore.estaAutenticado) {
      toast.success('Sesión iniciada correctamente')
      await router.push({ name: 'dashboard' })
    } else {
      toast.error(resultado.message ?? 'Credenciales inválidas')
    }
  } catch {
    toast.error('Error de conexión con el servidor')
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <v-container fluid class="fill-height justify-center align-center">
    <v-card class="pa-8" max-width="450" width="100%" elevation="4" rounded="lg">
      <h1 class="text-h4 font-weight-bold mb-6 text-center">Bienvenido a Sinergy</h1>
      <v-form ref="formRef" @submit.prevent="manejarSubmit">
        <v-text-field
          v-model="formulario.email"
          label="Correo electrónico"
          variant="outlined"
          type="email"
          prepend-inner-icon="mdi-email-outline"
          class="mb-2"
        ></v-text-field>

        <v-text-field
          v-model="formulario.password"
          label="Contraseña"
          variant="outlined"
          type="password"
          prepend-inner-icon="mdi-lock-outline"
          class="mb-4"
        ></v-text-field>

        <v-btn type="submit" color="primary" size="large" block :loading="cargando">
          Iniciar Sesión
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>
```

---

## 4. Parte C — Flujo End-to-End Paso a Paso

### 4.1 Ejemplo Completo de Feature: Módulo de Equipos

#### 1. Backend Service (`src/modules/equipment/equipment.service.ts`)
```typescript
import prisma from '../../core/prisma'

export class EquipmentService {
  async obtenerTodos() {
    return prisma.equipo.findMany({ include: { planta: true } })
  }
}

export const equipmentService = new EquipmentService()
```

#### 2. Backend Controller (`src/modules/equipment/equipment.controller.ts`)
```typescript
import { Request, Response, NextFunction } from 'express'
import { equipmentService } from './equipment.service'

export const equipmentController = {
  async listar(_req: Request, res: Response, next: NextFunction) {
    try {
      const equipos = await equipmentService.obtenerTodos()
      return res.status(200).json({ status: 'ok', data: equipos })
    } catch (error) {
      next(error)
    }
  },
}
```

#### 3. Frontend Store (`src/modules/equipment/equipment.store.ts`)
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore, type RespuestaApi } from '../auth/auth.store'

export const useEquipmentStore = defineStore('equipment', () => {
  const authStore = useAuthStore()
  const equipos = ref([])

  async function cargarEquipos(): Promise<RespuestaApi> {
    try {
      const response = await authStore.apiFetch('/equipos/listar')
      const resultado = await response.json()
      if (resultado.status === 'ok') {
        equipos.value = resultado.data
      }
      return resultado
    } catch {
      return { status: 'error', message: 'Error de red al cargar equipos' }
    }
  }

  return { equipos, cargarEquipos }
})
```

---

### 4.2 Checklist para Implementar un Nuevo Feature

Usa esta lista para asegurar el cumplimiento del estándar oficial en cada nueva funcionalidad:

- `[ ]` **Prisma:** Modelo en `schema.prisma` + `npx prisma migrate dev`
- `[ ]` **Backend Service:** Lógica y consultas Prisma en `src/modules/<modulo>/<modulo>.service.ts`
- `[ ]` **Backend Controller:** Handlers HTTP con envoltura `{ status: 'ok'|'error', message, data }` en `src/modules/<modulo>/<modulo>.controller.ts`
- `[ ]` **Backend Routes:** Enrutamiento modular en `src/modules/<modulo>/<modulo>.routes.ts`
- `[ ]` **Backend Server:** Módulo montado en `src/core/server.ts`
- `[ ]` **Frontend Store:** Store de Pinia con `RespuestaApi<T>` y `authStore.apiFetch` en `src/modules/<modulo>/<modulo>.store.ts`
- `[ ]` **Frontend Vista:** Vista `.vue` con Vuetify 3, `:rules` y notificaciones `useToast`
- `[ ]` **Frontend Router:** Ruta registrada en `apps/frontend/src/core/router.ts` con `meta.requiresAuth`
- `[ ]` **Documentación:** Contratos de la API actualizados en `docs/api/contratos.md`
