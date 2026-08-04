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

### Parte A — Backend (Feature-Based Architecture)
- [A1. Entendiendo la arquitectura Feature-Based](#a1-entendiendo-la-arquitectura-feature-based)
- [A2. Crear un modelo en Prisma](#a2-crear-un-modelo-en-prisma)
- [A3. Crear un módulo (Routes, Controller, Service)](#a3-crear-un-módulo-routes-controller-service)
- [A4. Registrar el módulo en Express](#a4-registrar-el-módulo-en-express)
- [A5. Manejo global de errores](#a5-manejo-global-de-errores)

### Parte B — Frontend (Vue 3 SPA)
- [B1. Entendiendo la estructura del frontend](#b1-entendiendo-la-estructura-del-frontend)
- [B2. Crear una vista dentro de un módulo](#b2-crear-una-vista-dentro-de-un-módulo)
- [B3. Registrar la ruta en Vue Router](#b3-registrar-la-ruta-en-vue-router)
- [B4. Crear un store de Pinia en el módulo](#b4-crear-un-store-de-pinia-en-el-módulo)
- [B5. Consumir la API del backend](#b5-consumir-la-api-del-backend)
- [B6. Crear un formulario con validación](#b6-crear-un-formulario-con-validación)
- [B7. Mostrar notificaciones al usuario](#b7-mostrar-notificaciones-al-usuario)

### Flujo Completo
- [C. Ejemplo end-to-end: módulo de Maquinaria (Equipment)](#c-ejemplo-end-to-end-módulo-de-maquinaria-equipment)

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
│   ├── shared/                   ← Tipos e interfaces comunes (TS)
│   │   ├── types/                ← Interfaces TS compartidas
│   │   └── constants/            ← Constantes globales (roles, estados)
│   ├── frontend/                 ← Vue 3 + TypeScript + Bootstrap
│   │   └── src/
│   │       ├── core/             ← router.ts, api.ts
│   │       ├── shared/           ← componentes y layouts reutilizables
│   │       └── modules/          ← auth/, equipment/, maintenance/
│   └── backend/                  ← Node.js + Express + Prisma
│       ├── prisma/               ← DDL, schema.prisma y migraciones
│       └── src/
│           ├── core/             ← server.ts, prisma.ts, errors/, middlewares/
│           ├── modules/          ← auth/, equipment/, maintenance/
│           └── index.ts          ← Punto de entrada (listen & shutdown)
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
{ "status": "ok", "message": "Sinergy Backend running", "db": "connected" }
```

---

---

# Parte A — Backend (Feature-Based Architecture)

La arquitectura del backend agrupa el código por **contexto de negocio (módulos aislados)**. Cada módulo contiene sus propias rutas, controlador y servicio en una misma carpeta:

```
src/modules/equipment/
├── equipment.routes.ts     ← Enrutamiento y middlewares de la feature
├── equipment.controller.ts ← Extracción de parámetros HTTP y llamadas al servicio
└── equipment.service.ts    ← Lógica de negocio y consultas directas a Prisma
```

---

## A1. Entendiendo la Arquitectura Feature-Based

| Componente | Archivo | Responsabilidad |
|---|---|---|
| Rutas | `*.routes.ts` | Define endpoints HTTP y delega la ejecución al controlador |
| Controlador | `*.controller.ts` | Extrae `req.params`, `req.body` y llama al servicio |
| Servicio | `*.service.ts` | Contiene la lógica de negocio y realiza consultas mediante Prisma Client |
| Core | `src/core/` | Conexión a BD (`prisma.ts`), servidor Express (`server.ts`) y middlewares globales |

**Flujo de una petición HTTP:**

```
Request → Routes (modules/) → Controller (modules/)
        → Service (modules/) → Prisma Client (core/prisma.ts)
        → PostgreSQL → Response
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

## A3. Crear un Módulo (Routes, Controller, Service)

Crea la carpeta del módulo en `apps/backend/src/modules/equipment/`:

### 1. El Servicio (`equipment.service.ts`)

```typescript
// apps/backend/src/modules/equipment/equipment.service.ts
import prisma from '../../core/prisma';

export class EquipmentService {
  async obtenerTodos() {
    return prisma.equipo.findMany({
      orderBy: { nombre: 'asc' }
    });
  }

  async obtenerPorId(id: number) {
    return prisma.equipo.findUnique({ where: { id } });
  }

  async crear(datos: { nombre: string; codigo: string; plantaId: number }) {
    return prisma.equipo.create({ data: datos });
  }
}

export const equipmentService = new EquipmentService();
```

### 2. El Controlador (`equipment.controller.ts`)

```typescript
// apps/backend/src/modules/equipment/equipment.controller.ts
import { Request, Response, NextFunction } from 'express';
import { equipmentService } from './equipment.service';

export const equipmentController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const equipos = await equipmentService.obtenerTodos();
      res.json({ success: true, data: equipos });
    } catch (error) {
      next(error);
    }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const nuevoEquipo = await equipmentService.crear(req.body);
      res.status(201).json({ success: true, data: nuevoEquipo });
    } catch (error) {
      next(error);
    }
  }
};
```

### 3. Las Rutas (`equipment.routes.ts`)

```typescript
// apps/backend/src/modules/equipment/equipment.routes.ts
import { Router } from 'express';
import { equipmentController } from './equipment.controller';

const router = Router();

router.get('/', equipmentController.listar);
router.post('/', equipmentController.crear);

export default router;
```

---

## A4. Registrar el Módulo en Express

Edita `apps/backend/src/core/server.ts` para importar y montar las rutas del módulo:

```typescript
import equipmentRoutes from '../modules/equipment/equipment.routes';

// ... otros middlewares ...

app.use('/api/equipment', equipmentRoutes);
```

---

## A5. Manejo Global de Errores

El error handler centralizado vive en `apps/backend/src/core/middlewares/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Error interno del servidor';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  const isDev = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(isDev && statusCode >= 500 && { stack: err.stack })
    }
  });
};
```

---

---

# Parte B — Frontend (Vue 3 SPA)

El frontend es una SPA construida con Vue 3, TypeScript, Bootstrap 5, Vuetify 3 (con Material Design Icons `@mdi/font`) y Pinia. Sigue la **Composition API** con `<script setup>` en todos los componentes. La lógica reutilizable va en composables, el estado compartido en stores de Pinia, y los estilos en clases utilitarias de Bootstrap y componentes de Vuetify. Para una referencia detallada sobre la configuración y uso de Vuetify 3, consulta [extensions.md](file:///c:/xampp/htdocs/Sinergy/docs/extensions/extensions.md#21-vuetify-3--mdifont).

---

## B1. Entendiendo la Estructura del Frontend

```
src/
├── components/     ← Componentes globales de UI y Layout (Menu.vue, SinergyChip.vue)
├── core/           ← Router (router.ts) y plugins (vuetify.ts)
├── shared/         ← Componentes y utilidades compartidas
└── modules/        ← Módulos aislados por negocio (Feature-Based)
    ├── auth/       ← views/ (LoginView.vue), auth.store.ts
    ├── dashboard/  ← views/ (DashboardView.vue), dashboard.store.ts
    ├── equipment/  ← views/, components/, equipment.store.ts
    └── maintenance/← views/, maintenance.store.ts
```

### Componentes de Layout Responsivos (`App.vue`, `Menu.vue`, `SinergyChip.vue`)

El layout de la aplicación se gestiona globalmente en `App.vue` en combinación con la propiedad de ruta `meta.hideLayout`:

```vue
<!-- apps/frontend/src/App.vue -->
<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import Menu from './components/Menu.vue'

const route = useRoute()
const ocultarLayout = computed(() => !!route.meta.hideLayout)
</script>

<template>
  <v-app>
    <Menu :ocultarLayout="ocultarLayout" />
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
```

- `<Menu.vue>` renderiza de forma adaptativa un `<v-navigation-drawer>` permanente en escritorios (`>= 960px`) y un `<v-app-bar>` con menú desplegable en dispositivos móviles (`< 960px`) usando `useMediaQuery` de `@vueuse/core`.
- `<SinergyChip.vue>` es el componente de marca oficial que muestra el gradiente, logo de Vuetify y tipografía adaptativa.

---

## B2. Crear una Vista dentro de un Módulo (Estándar Vuetify 3)

Las vistas viven dentro de `src/modules/<modulo>/views/` y deben usar componentes de Vuetify 3 (`v-container`, `v-row`, `v-col`, `v-sheet`, `v-card`, `v-tabs`, `v-form`, etc.) con TypeScript explícito.

Ejemplo de vista de Dashboard (`src/modules/dashboard/views/DashboardView.vue`):

```vue
<script setup lang="ts">
import { ref } from 'vue'

const tabs = [
  { id: 1, name: 'Estadísticas', color: 'warning' },
  { id: 2, name: 'Historial', color: 'info' },
  { id: 3, name: 'Reportes', color: 'error' },
  { id: 4, name: 'Equipos', color: 'success' }
]

const pestañaActiva = ref(tabs[0].id)
</script>

<template>
  <v-container fluid class="pa-0">
    <v-row>
      <v-col cols="12" class="pa-5">
        <v-sheet elevation="2" color="background">
          <v-tabs v-model="pestañaActiva" color="primary" grow>
            <v-tab v-for="tab in tabs" :key="tab.id" :value="tab.id" :color="tab.color">
              {{ tab.name }}
            </tab>
          </v-tabs>
          <v-tabs-window v-model="pestañaActiva" transition="fade-transition">
            <v-tabs-window-item v-for="tab in tabs" :key="tab.id" :value="tab.id">
              <v-sheet class="pa-5" color="surface">
                Contenido del panel {{ tab.name }}
              </v-sheet>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
```

---

## B3. Registrar la Ruta en Vue Router (`router.ts`)

Registra las rutas en `apps/frontend/src/core/router.ts` definiendo los metadatos `requiresAuth` y `hideLayout`:

```typescript
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../modules/auth/auth.store'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'login',
    component: () => import('../modules/auth/views/LoginView.vue'),
    meta: { requiresAuth: false, hideLayout: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../modules/dashboard/views/DashboardView.vue'),
    meta: { requiresAuth: true, hideLayout: false }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: false, hideLayout: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

/**
 * Navigation Guard global para gestión de sesión persistente.
 */
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const requiereAuth = to.meta.requiresAuth === true

  if (requiereAuth && !authStore.estaAutenticado) {
    // Intenta restaurar la sesión desde la cookie HttpOnly en /auth/refresh
    const sesionRestaurada = await authStore.refrescarToken()
    if (!sesionRestaurada) {
      return { name: 'login' }
    }
  }

  if (!requiereAuth && authStore.estaAutenticado && to.name === 'login') {
    return { name: 'dashboard' }
  }
})

export default router
```

> [!TIP]
> Usa **siempre** lazy loading (`() => import(...)`) para las vistas. Así Vite divide el bundle en chunks por vista y el usuario solo descarga el código que necesita.

---

## B4. Crear un Store de Pinia y Autenticación (`auth.store.ts`)

El store centraliza el estado global de la sesión. Sigue la arquitectura de **Doble Token JWT**: Access Token mantenido en memoria (`accessToken`) + Refresh Token almacenado en cookie segura `HttpOnly`.

```typescript
// apps/frontend/src/modules/auth/auth.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface LoginDTO {
  email: string
  password: string
}

export interface RespuestaApi<T = void> {
  success: boolean
  message?: string
  data?: T
  error?: { message: string }
}

const API_URL = 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)

  const estaAutenticado = computed<boolean>(() => accessToken.value !== null)

  async function login(credenciales: LoginDTO): Promise<RespuestaApi> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credenciales)
    })

    const resultado: RespuestaApi<{ accessToken: string }> = await response.json()

    if (resultado.success && resultado.data) {
      accessToken.value = resultado.data.accessToken
    }

    return {
      success: resultado.success,
      message: resultado.message ?? resultado.error?.message ?? 'Error inesperado'
    }
  }

  async function refrescarToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!response.ok) {
        cerrarSesion()
        return false
      }

      const resultado: RespuestaApi<{ accessToken: string }> = await response.json()

      if (resultado.success && resultado.data?.accessToken) {
        accessToken.value = resultado.data.accessToken
        return true
      }

      return false
    } catch {
      cerrarSesion()
      return false
    }
  }

  async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers)

    if (accessToken.value) {
      headers.set('Authorization', `Bearer ${accessToken.value}`)
    }

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    })
  }

  function cerrarSesion(): void {
    accessToken.value = null
  }

  return {
    accessToken,
    estaAutenticado,
    login,
    refrescarToken,
    apiFetch,
    cerrarSesion
  }
})
```

---

## B5. Consumir la API del Backend con `apiFetch`

Toda interacción de red que requiera comunicarse con el backend Express debe realizarse utilizando la función `apiFetch` expuesta por `useAuthStore()`.

### Firma de la función
```typescript
apiFetch(endpoint: string, options?: RequestInit): Promise<Response>
```

### Garantías de `apiFetch`
1. **Header Authorization Automático**: Si el usuario está autenticado (`accessToken` en memoria), agrega automáticamente el header `Authorization: Bearer <accessToken>`.
2. **Envío de Cookies HttpOnly**: Incluye nativamente `credentials: 'include'`, asegurando el intercambio del Refresh Token en peticiones cruzadas.
3. **Ruta Base Centralizada**: Concatena automáticamente el endpoint indicado con la constante `${API_URL}` (`http://localhost:3000/api`).

### Ejemplo de uso en Cierre de Sesión (`Menu.vue`)
```typescript
import { useAuthStore } from '../modules/auth/auth.store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const cerrarSesion = async (): Promise<void> => {
  try {
    const respuesta = await authStore.apiFetch('/auth/logout', {
      method: 'POST'
    })

    if (!respuesta.ok) {
      throw new Error('Error al comunicarse con el servidor')
    }

    authStore.cerrarSesion()
    await router.push({ name: 'login' })
  } catch (error) {
    console.error('Fallo durante el cierre de sesión:', error)
  }
}
```

> [!IMPORTANT]
> **Prohibido guardar Access Tokens en `localStorage` o `sessionStorage`**. El Access Token debe residir únicamente en la memoria de Pinia por motivos de seguridad contra ataques XSS.

---

## B6. Formulario de Inicio de Sesión (`LoginView.vue`)

Ejemplo del flujo de autenticación consumiendo `useAuthStore` y campos reactivos de TypeScript:

```vue
<!-- apps/frontend/src/modules/auth/views/LoginView.vue -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore, type LoginDTO } from '../auth.store'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const formulario = reactive<LoginDTO>({
  email: '',
  password: ''
})

const cargando = ref<boolean>(false)
const mensajeServidor = ref<string | null>(null)

const manejarSubmit = async (): Promise<void> => {
  cargando.value = true
  mensajeServidor.value = null

  try {
    const resultado = await authStore.login(formulario)

    if (resultado.success && authStore.estaAutenticado) {
      await router.push({ name: 'dashboard' })
    } else {
      mensajeServidor.value = resultado.message ?? 'Credenciales inválidas'
    }
  } catch {
    mensajeServidor.value = 'Error de conexión con el servidor'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <v-container fluid class="fill-height bg-grey-lighten-4">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="4">
        <v-card elevation="4" class="pa-6 rounded-lg">
          <h1 class="text-h4 font-weight-bold mb-6 text-center">Bienvenido</h1>

          <v-form @submit.prevent="manejarSubmit">
            <v-text-field
              v-model="formulario.email"
              label="Correo"
              prepend-inner-icon="mdi-email-outline"
              variant="outlined"
              type="email"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="formulario.password"
              label="Contraseña"
              prepend-inner-icon="mdi-lock-outline"
              variant="outlined"
              type="password"
              class="mb-4"
            ></v-text-field>

            <v-alert v-if="mensajeServidor" type="error" variant="tonal" class="mb-4">
              {{ mensajeServidor }}
            </v-alert>

            <v-btn type="submit" color="primary" size="large" block :loading="cargando">
              Iniciar Sesión
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
```

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

# C. Ejemplo End-to-End: Módulo de Maquinaria (Equipment)

Este ejemplo conecta la arquitectura Feature-Based en un flujo completo de punta a punta.

### Paso 1 — Shared: Tipo TypeScript (`apps/shared/types/index.ts`)

```typescript
// apps/shared/types/index.ts
export interface Equipment {
  id: number;
  nombre: string;
  codigo: string;
  plantaId: number;
}
```

### Paso 2 — Backend: Servicio y Controlador (`apps/backend/src/modules/equipment/`)

```typescript
// apps/backend/src/modules/equipment/equipment.service.ts
import prisma from '../../core/prisma';

export class EquipmentService {
  async obtenerTodos() {
    return prisma.equipo.findMany();
  }
}
export const equipmentService = new EquipmentService();
```

```typescript
// apps/backend/src/modules/equipment/equipment.controller.ts
import { Request, Response, NextFunction } from 'express';
import { equipmentService } from './equipment.service';

export const equipmentController = {
  async listar(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await equipmentService.obtenerTodos();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
};
```

### Paso 3 — Backend: Rutas (`apps/backend/src/modules/equipment/equipment.routes.ts`)

```typescript
import { Router } from 'express';
import { equipmentController } from './equipment.controller';

const router = Router();
router.get('/', equipmentController.listar);

export default router;
```

### Paso 4 — Frontend: Store y Vista (`apps/frontend/src/modules/equipment/`)

```typescript
// apps/frontend/src/modules/equipment/equipment.store.ts
import { defineStore } from 'pinia';
import api from '../../core/api';
import type { Equipment } from '@sinergy/shared/types';

export const useEquipmentStore = defineStore('equipment', {
  state: () => ({
    equipos: [] as Equipment[],
    cargando: false
  }),
  actions: {
    async cargarEquipos() {
      this.cargando = true;
      try {
        const { data } = await api.get('/equipment');
        this.equipos = data.data;
      } finally {
        this.cargando = false;
      }
    }
  }
});
```

---

## Checklist para un Feature Completo

Usa esta lista cada vez que implementes una nueva funcionalidad:

- `[ ]` **Prisma:** Modelo agregado en `schema.prisma` + `npx prisma migrate dev`
- `[ ]` **Shared:** Interfaces/Tipos agregados en `apps/shared/types/index.ts`
- `[ ]` **Backend Service:** Lógica de negocio y consultas Prisma en `apps/backend/src/modules/<modulo>/<modulo>.service.ts`
- `[ ]` **Backend Controller:** Handlers HTTP en `apps/backend/src/modules/<modulo>/<modulo>.controller.ts`
- `[ ]` **Backend Routes:** Endpoints expuestos en `apps/backend/src/modules/<modulo>/<modulo>.routes.ts`
- `[ ]` **Backend Server:** Módulo registrado en `apps/backend/src/core/server.ts`
- `[ ]` **Frontend Store:** Pinia Store creado en `apps/frontend/src/modules/<modulo>/<modulo>.store.ts`
- `[ ]` **Frontend Vista:** Componente `.vue` creado en `apps/frontend/src/modules/<modulo>/views/`
- `[ ]` **Frontend Router:** Ruta de la vista registrada en `apps/frontend/src/core/router.ts`
- `[ ]` **Docs:** Documentación sincronizada y actualizada

