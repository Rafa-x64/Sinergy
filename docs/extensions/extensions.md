# Librerías y Dependencias del Proyecto Sinergy

Este documento es la fuente de verdad sobre cada librería instalada en el proyecto. Explica su propósito, cómo registrarla y cómo usarla correctamente dentro de la arquitectura de Sinergy (Vue 3 + TypeScript + Bootstrap, en un monorepo `pnpm`).

> [!NOTE]
> Las librerías se registran en `apps/frontend/src/main.ts` (plugins globales) o se importan directamente en el componente/composable que las necesita. No registres globalmente lo que puedes importar localmente.

---

## Índice

1. [Vue 3](#1-vue-3)
2. [Vue Router](#2-vue-router)
3. [Pinia](#3-pinia)
4. [Bootstrap 5 + bootstrap-vue-next](#4-bootstrap-5--bootstrap-vue-next)
5. [VueUse](#5-vueuse-vueuseccore)
6. [Axios](#6-axios)
7. [Auth0 Vue](#7-auth0-authauth0-vue)
8. [VeeValidate + Yup](#8-veevalidate--yup)
9. [date-fns](#9-date-fns)
10. [Vue Toastification](#10-vue-toastification)
11. [Dexie (IndexedDB Offline)](#11-dexie-indexeddb-offline)
12. [ApexCharts + vue3-apexcharts](#12-apexcharts--vue3-apexcharts)
13. [Chart.js + vue-chartjs](#13-chartjs--vue-chartjs)
14. [ECharts + vue-echarts](#14-echarts--vue-echarts)
15. [SheetJS (xlsx)](#15-sheetjs-xlsx)
16. [jsPDF + html2canvas](#16-jspdf--html2canvas)
17. [FontAwesome](#17-fontawesome)
18. [Prisma ORM](#18-prisma-orm)
19. [Comandos de referencia rápida](#19-comandos-de-referencia-rápida)
20. [Solución de errores comunes](#20-solución-de-errores-comunes)

---

## 1. Vue 3

**Paquete:** `vue@3.5.13`

Framework progresivo para construir interfaces de usuario. Es el núcleo de toda la aplicación. Usa la **Composition API** con `<script setup>` como estándar en este proyecto.

**Registro:** Punto de entrada en `apps/frontend/src/main.ts`.

```typescript
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
```

**Uso básico en componente:**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>

<template>
  <p>Doble: {{ doubled }}</p>
  <button @click="count++">Incrementar</button>
</template>
```

> [!TIP]
> Siempre usa `<script setup lang="ts">`. Nunca uses la Options API en este proyecto para mantener consistencia.

---

## 2. Vue Router

**Paquete:** `vue-router@4.3.0`

Gestiona la navegación entre vistas (páginas) de la SPA. Todas las rutas se definen en `apps/frontend/src/router/index.ts`.

**Registro en `main.ts`:**

```typescript
import router from './router'
app.use(router)
```

**Definición de rutas (`src/router/index.ts`):**

```typescript
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    // Ruta protegida: se valida en el guard
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, savedPosition) => savedPosition || { top: 0 }
})

// Guard global de autenticación
router.beforeEach((to, _from) => {
  const isAuthenticated = !!localStorage.getItem('token')
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }
})

export default router
```

**Navegación en componentes:**

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

const irAlDashboard = () => router.push({ name: 'dashboard' })
</script>

<template>
  <router-link :to="{ name: 'home' }">Inicio</router-link>
  <router-view />
</template>
```

---

## 3. Pinia

**Paquete:** `pinia@2.1.7`

Gestión de estado global reactivo. Reemplaza a Vuex. Cada _store_ tiene una sola responsabilidad (SRP). Los stores viven en `apps/frontend/src/stores/`.

**Registro en `main.ts`:**

```typescript
import { createPinia } from 'pinia'
app.use(createPinia())
```

**Definir un store (`src/stores/authStore.ts`):**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const logout = () => {
    token.value = null
    localStorage.removeItem('token')
  }

  return { token, isAuthenticated, setToken, logout }
})
```

**Uso en un componente:**

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
// Acceder a estado
console.log(auth.isAuthenticated)
// Llamar acción
auth.logout()
</script>
```

> [!IMPORTANT]
> Nunca mutés el estado directamente desde un componente. Todas las mutaciones deben ocurrir a través de las funciones exportadas por el store.

---

## 4. Bootstrap 5 + bootstrap-vue-next

**Paquetes:** `bootstrap@5.3.3` + `bootstrap-vue-next@0.24.14` + `@types/bootstrap@5.2.10`

Bootstrap aporta el sistema de grillas, utilidades CSS y componentes UI. `bootstrap-vue-next` expone esos componentes como componentes Vue reactivos y accesibles.

**Registro en `main.ts`:**

```typescript
import 'bootstrap/dist/css/bootstrap.min.css'
import { createBootstrap } from 'bootstrap-vue-next'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

app.use(createBootstrap())
```

**Uso de componentes en plantillas:**

```vue
<template>
  <!-- Grilla responsive -->
  <BContainer>
    <BRow>
      <BCol cols="12" md="6">
        <BCard title="Inspección" class="shadow-sm">
          <BButton variant="primary" @click="guardar">Guardar</BButton>
        </BCard>
      </BCol>
    </BRow>
  </BContainer>

  <!-- Modal -->
  <BModal v-model="showModal" title="Confirmar">
    ¿Está seguro de continuar?
  </BModal>

  <!-- Formulario con validación visual -->
  <BFormInput v-model="nombre" :state="nombreValido" placeholder="Nombre del técnico" />
  <BFormInvalidFeedback>El nombre es obligatorio.</BFormInvalidFeedback>
</template>
```

> [!TIP]
> Usa siempre las clases utilitarias de Bootstrap (`.d-flex`, `.gap-2`, `.text-muted`, etc.) en lugar de escribir CSS ad-hoc. Esto mantiene la coherencia visual.

---

## 5. VueUse (`@vueuse/core`)

**Paquete:** `@vueuse/core@10.9.0`

Colección de composables utilitarios listos para usar: localStorage reactivo, detección de conectividad, tamaño de ventana, debounce, etc.

**No requiere registro global.** Se importa directamente donde se necesite.

**Composables más usados en Sinergy:**

```typescript
import { useLocalStorage, useOnline, useWindowSize, useDebounceFn } from '@vueuse/core'

// Estado persistente en localStorage (reactivo)
const token = useLocalStorage('token', '')

// Detectar si hay conexión a internet (clave para offline-first)
const isOnline = useOnline()

// Tamaño de la ventana para responsividad
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

// Debounce en la búsqueda de filtros
const buscar = useDebounceFn((termino: string) => {
  // llamada a API
}, 400)
```

---

## 6. Axios

**Paquete:** `axios@1.6.8`

Cliente HTTP para comunicarse con el backend. Se debe configurar una instancia centralizada con interceptores en `apps/frontend/src/utils/http.ts`. Nunca uses `axios` directamente con la URL base hardcodeada en un componente.

**Configuración centralizada (`src/utils/http.ts`):**

```typescript
import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
})

// Inyectar token en cada petición saliente
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Manejo global de errores entrantes
http.interceptors.response.use(
  (response) => response,
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

**Uso en un composable:**

```typescript
import http from '@/utils/http'

const fetchInspecciones = async (plantId: number) => {
  const { data } = await http.get(`/inspecciones?plantId=${plantId}`)
  return data
}
```

---

## 7. Auth0 (`@auth0/auth0-vue`)

**Paquete:** `@auth0/auth0-vue@2.6.0`

Integración con Auth0 para autenticación OAuth2/OIDC. Permite login social y gestión de sesión sin implementar un servidor de autenticación propio.

> [!IMPORTANT]
> Requiere configurar un `tenant` en Auth0 y definir `VITE_AUTH0_DOMAIN` y `VITE_AUTH0_CLIENT_ID` en el archivo `.env`.

**Registro en `main.ts`:**

```typescript
import { createAuth0 } from '@auth0/auth0-vue'

app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: window.location.origin
    }
  })
)
```

**Uso en componentes:**

```vue
<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'

const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0()
</script>

<template>
  <div v-if="isAuthenticated">
    Bienvenido, {{ user?.name }}
    <button @click="logout({ logoutParams: { returnTo: window.location.origin } })">
      Cerrar sesión
    </button>
  </div>
  <button v-else @click="loginWithRedirect()">Iniciar sesión</button>
</template>
```

---

## 8. VeeValidate + Yup

**Paquetes:** `vee-validate@4.12.4` + `yup@1.4.0`

VeeValidate gestiona el estado de validación de formularios de forma reactiva. Yup define los esquemas de validación (qué se valida y los mensajes de error).

**Patrón recomendado:** Siempre define el esquema Yup en un archivo separado (`src/schemas/`) y consúmelo en el composable o componente.

**Ejemplo completo:**

```typescript
// src/schemas/loginSchema.ts
import * as yup from 'yup'

export const loginSchema = yup.object({
  usuario: yup.string().required('El usuario es obligatorio'),
  contrasena: yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es obligatoria')
})
```

```vue
<!-- src/views/LoginView.vue -->
<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { loginSchema } from '@/schemas/loginSchema'

const { handleSubmit, errors } = useForm({ validationSchema: loginSchema })
const { value: usuario } = useField<string>('usuario')
const { value: contrasena } = useField<string>('contrasena')

const onSubmit = handleSubmit((values) => {
  console.log('Válido:', values)
})
</script>

<template>
  <form @submit="onSubmit">
    <input v-model="usuario" placeholder="Usuario" />
    <span class="text-danger small">{{ errors.usuario }}</span>

    <input v-model="contrasena" type="password" placeholder="Contraseña" />
    <span class="text-danger small">{{ errors.contrasena }}</span>

    <button type="submit">Ingresar</button>
  </form>
</template>
```

---

## 9. date-fns

**Paquete:** `date-fns@3.6.0`

Manipulación y formateo de fechas. Es modular (importa solo lo que necesitas). No modifica el objeto `Date` nativo.

**Funciones más usadas en Sinergy:**

```typescript
import { format, parseISO, isToday, differenceInDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

// Formatear una fecha para mostrar al técnico
const fechaLegible = format(new Date(), "dd 'de' MMMM yyyy", { locale: es })
// → "20 de julio 2026"

// Parsear fecha del backend (ISO string)
const fecha = parseISO('2026-07-20T14:00:00Z')

// Verificar si la inspección es de hoy
if (isToday(fecha)) console.log('Inspección del día')

// Días desde la última inspección
const diasSinInspeccion = differenceInDays(new Date(), fecha)
```

---

## 10. Vue Toastification

**Paquete:** `vue-toastification@2.0.0-rc.5`

Sistema de notificaciones (toasts) no bloqueantes. Es el canal estándar para dar feedback al usuario después de acciones (guardar, error, advertencia).

**Registro en `main.ts`:**

```typescript
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

app.use(Toast, {
  timeout: 4000,
  closeOnClick: true,
  pauseOnHover: true,
  position: 'top-right'
})
```

**Uso en componentes o composables:**

```typescript
import { useToast } from 'vue-toastification'

const toast = useToast()

// Tipos disponibles
toast.success('Inspección guardada correctamente.')
toast.error('No se pudo conectar con el servidor.')
toast.warning('Sin conexión. Los datos se guardarán localmente.')
toast.info('Sincronizando datos pendientes...')
```

> [!TIP]
> Crea un composable `useNotifications` que envuelva a `useToast` para centralizar los mensajes y estandarizar el tono de los textos.

---

## 11. Dexie (IndexedDB Offline)

**Paquete:** `dexie@4.0.1`

Wrapper sobre IndexedDB del navegador para almacenamiento local estructurado. Es la pieza clave de la estrategia **offline-first**: los datos se guardan localmente cuando no hay conexión y se sincronizan al reconectarse.

**Configuración de la base de datos (`src/db/database.ts`):**

```typescript
import Dexie, { type Table } from 'dexie'

// Define el tipo de los registros
interface InspeccionPendiente {
  id?: number
  plantId: number
  equipoId: number
  datos: Record<string, unknown>
  creadoEn: Date
}

class SinergyDatabase extends Dexie {
  inspeccionesPendientes!: Table<InspeccionPendiente>

  constructor() {
    super('SinergyDB')
    this.version(1).stores({
      // ++ = autoincrement, plantId e equipoId son índices para búsqueda rápida
      inspeccionesPendientes: '++id, plantId, equipoId, creadoEn'
    })
  }
}

export const db = new SinergyDatabase()
```

**Flujo offline-first en un composable (`src/composables/useSync.ts`):**

```typescript
import { useOnline } from '@vueuse/core'
import { db } from '@/db/database'
import http from '@/utils/http'

export function useSync() {
  const isOnline = useOnline()

  const guardarInspeccion = async (datos: Record<string, unknown>, plantId: number, equipoId: number) => {
    if (isOnline.value) {
      await http.post('/inspecciones', { plantId, equipoId, datos })
    } else {
      // Sin conexión: guardar localmente
      await db.inspeccionesPendientes.add({ plantId, equipoId, datos, creadoEn: new Date() })
    }
  }

  const sincronizar = async () => {
    if (!isOnline.value) return
    const pendientes = await db.inspeccionesPendientes.toArray()
    if (pendientes.length === 0) return

    await http.post('/inspecciones/batch', pendientes)
    await db.inspeccionesPendientes.clear()
  }

  return { guardarInspeccion, sincronizar }
}
```

---

## 12. ApexCharts + vue3-apexcharts

**Paquetes:** `apexcharts@3.49.1` + `vue3-apexcharts@^1.11.1`

Librería de gráficos interactivos con soporte para barras, líneas, áreas, radiales, etc. Se usa para el dashboard de supervisores.

**Registro en `main.ts`:**

```typescript
import VueApexCharts from 'vue3-apexcharts'
app.use(VueApexCharts)
```

**Uso en un componente:**

```vue
<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'

const options: ApexOptions = {
  chart: { id: 'inspecciones-semana', toolbar: { show: false } },
  xaxis: { categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
  colors: ['#0d6efd']
}

const series = [{ name: 'Inspecciones', data: [5, 8, 3, 9, 6] }]
</script>

<template>
  <apexchart type="bar" height="300" :options="options" :series="series" />
</template>
```

---

## 13. Chart.js + vue-chartjs

**Paquetes:** `chart.js@4.4.2` + `vue-chartjs@5.3.0`

Alternativa ligera a ApexCharts. Ideal para gráficos simples (línea, dona, pastel) en espacios pequeños o en tarjetas del dashboard.

**Uso en un componente:**

```vue
<script setup lang="ts">
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const data = {
  labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
  datasets: [{ label: 'Horómetro compresor', data: [120, 135, 148, 160], borderColor: '#0d6efd', tension: 0.4 }]
}
const chartOptions = { responsive: true }
</script>

<template>
  <Line :data="data" :options="chartOptions" />
</template>
```

> [!NOTE]
> Usa **ApexCharts** para gráficas interactivas del dashboard de supervisores y **Chart.js** para gráficas embebidas en reportes o tarjetas pequeñas.

---

## 14. ECharts + vue-echarts

**Paquetes:** `echarts@5.4.3` + `vue-echarts@6.7.0`

Librería de gráficos avanzados de Apache. Soporta mapas, gráficas de árbol, series de tiempo complejas. Reservar para visualizaciones avanzadas que ApexCharts no cubra.

**Registro en `main.ts` (solo registrar lo que se use):**

```typescript
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent])
app.component('VChart', VChart)
```

**Uso en un componente:**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const option = ref({
  tooltip: {},
  xAxis: { data: ['Extrusión', 'Inyección', 'Mezcla'] },
  yAxis: {},
  series: [{ name: 'Alertas', type: 'bar', data: [3, 1, 5] }]
})
</script>

<template>
  <VChart :option="option" style="height: 300px" autoresize />
</template>
```

---

## 15. SheetJS (xlsx)

**Paquete:** `xlsx@0.18.5`

Generación y lectura de archivos Excel (`.xlsx`). Se usa para exportar reportes de inspección desde la vista de reportes.

**Exportar a Excel:**

```typescript
import * as XLSX from 'xlsx'

interface RegistroInspeccion {
  fecha: string
  tecnico: string
  equipo: string
  estado: string
}

const exportarExcel = (datos: RegistroInspeccion[], nombreArchivo: string) => {
  const hoja = XLSX.utils.json_to_sheet(datos)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Inspecciones')
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`)
}
```

**Leer un archivo Excel (ej. migración de `Maestros.xlsx`):**

```typescript
const leerExcel = (archivo: File): Promise<unknown[]> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const libro = XLSX.read(data, { type: 'array' })
      const primeraHoja = libro.Sheets[libro.SheetNames[0]]
      resolve(XLSX.utils.sheet_to_json(primeraHoja))
    }
    reader.readAsArrayBuffer(archivo)
  })
}
```

---

## 16. jsPDF + html2canvas

**Paquetes:** `jspdf@2.5.1` + `html2canvas@1.4.1`

`html2canvas` convierte un elemento DOM en una imagen. `jsPDF` genera el archivo PDF usando esa imagen. Juntos permiten exportar cualquier sección de la interfaz como PDF.

**Composable reutilizable (`src/composables/useExportPDF.ts`):**

```typescript
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export function useExportPDF() {
  const exportarPDF = async (elementoRef: HTMLElement, nombreArchivo: string) => {
    const canvas = await html2canvas(elementoRef, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const anchoA4 = 210
    const altoImg = (canvas.height * anchoA4) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, anchoA4, altoImg)
    pdf.save(`${nombreArchivo}.pdf`)
  }

  return { exportarPDF }
}
```

**Uso en un componente:**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useExportPDF } from '@/composables/useExportPDF'

const reporteRef = ref<HTMLElement | null>(null)
const { exportarPDF } = useExportPDF()

const descargar = () => {
  if (reporteRef.value) exportarPDF(reporteRef.value, 'reporte-inspeccion')
}
</script>

<template>
  <div ref="reporteRef">
    <!-- Contenido del reporte -->
  </div>
  <button @click="descargar">Exportar PDF</button>
</template>
```

---

## 17. FontAwesome

**Paquetes:** `@fortawesome/fontawesome-svg-core@6.5.1` + `@fortawesome/free-solid-svg-icons@6.5.1` + `@fortawesome/vue-fontawesome@3.0.6`

Iconos SVG vectoriales. Se usan en botones, menús y badges de estado.

**Registro en `main.ts`:**

```typescript
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// Importa solo los iconos que uses (tree-shaking)
import { faCheck, faTriangleExclamation, faGear, faWrench, faUser } from '@fortawesome/free-solid-svg-icons'

library.add(faCheck, faTriangleExclamation, faGear, faWrench, faUser)
app.component('FontAwesomeIcon', FontAwesomeIcon)
```

**Uso en plantillas:**

```vue
<template>
  <FontAwesomeIcon icon="check" class="text-success me-2" />
  <FontAwesomeIcon icon="triangle-exclamation" class="text-warning" />
  <FontAwesomeIcon :icon="['fas', 'gear']" spin />
</template>
```

> [!TIP]
> Importa solo los iconos que efectivamente uses. No hagas `import { fas } from '@fortawesome/free-solid-svg-icons'` ya que incluirá todos los iconos y aumentará el bundle.

---

## 18. Prisma ORM

**Paquetes:** `prisma@latest` (devDependency) + `@prisma/client@latest`
**Ubicación:** `apps/backend/`

Prisma es el ORM del backend. Vive exclusivamente en la capa `infrastructure/` de la arquitectura DDD-Lite. Sus responsabilidades son: definir el esquema de la base de datos, generar el cliente tipado y ejecutar migraciones. Los componentes de las capas superiores (`application/`, `interfaces/`) nunca importan `PrismaClient` directamente; lo reciben a través de inyección de dependencias.

> [!IMPORTANT]
> Prisma se instala **únicamente en `apps/backend`**, no en el frontend ni en la raíz del monorepo.

### Instalación

```powershell
# Desde la raíz del monorepo
pnpm --filter @sinergy/backend add @prisma/client
pnpm --filter @sinergy/backend add --save-dev prisma
```

### Inicialización

Ejecuta esto una sola vez para generar el esquema base y la carpeta `prisma/`:

```powershell
# Desde apps/backend/
npx prisma init --datasource-provider postgresql
```

Esto crea:
```
apps/backend/
├── prisma/
│   └── schema.prisma   ← Defines tu modelo de datos aquí
└── .env                ← Agrega aquí DATABASE_URL
```

Configura `DATABASE_URL` en `apps/backend/.env`:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/sinergy_db"
```

### Definición del Esquema (`prisma/schema.prisma`)

Ejemplo con las entidades centrales de Sinergy:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Planta {
  id        Int       @id @default(autoincrement())
  nombre    String    @unique
  ubicacion String
  equipos   Equipo[]
  creadoEn  DateTime  @default(now())
}

model Equipo {
  id           Int           @id @default(autoincrement())
  codigo       String        @unique
  nombre       String
  tipo         String
  planta       Planta        @relation(fields: [plantaId], references: [id])
  plantaId     Int
  inspecciones Inspeccion[]
}

model Usuario {
  id           Int          @id @default(autoincrement())
  nombre       String
  email        String       @unique
  rol          Rol
  inspecciones Inspeccion[]
  creadoEn     DateTime     @default(now())
}

enum Rol {
  TECNICO
  SUPERVISOR
  ADMIN
}

model Inspeccion {
  id          Int      @id @default(autoincrement())
  equipo      Equipo   @relation(fields: [equipoId], references: [id])
  equipoId    Int
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])
  usuarioId   Int
  datos       Json
  observacion String?
  realizadaEn DateTime @default(now())

  @@index([equipoId])
  @@index([realizadaEn])
}
```

### Comandos Prisma

```powershell
# Desde apps/backend/

# Crear una migración nueva (al cambiar el schema)
npx prisma migrate dev --name nombre_de_la_migracion

# Aplicar migraciones en producción (sin generar archivos)
npx prisma migrate deploy

# Regenerar el cliente TypeScript después de cambios en el schema
npx prisma generate

# Explorar la base de datos visualmente
npx prisma studio

# Verificar el estado de las migraciones
npx prisma migrate status
```

### Cliente Prisma en la Infraestructura

Crea una instancia singleton de `PrismaClient` para reutilizarla en todos los repositorios:

```typescript
// apps/backend/src/infrastructure/prisma/prismaClient.ts
import { PrismaClient } from '@prisma/client'

// Singleton: evita crear múltiples conexiones en desarrollo
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error']
})

export default prisma
```

### Repositorio en la Capa de Infraestructura

Ejemplo de un repositorio que implementa una interfaz del dominio:

```typescript
// apps/backend/src/domain/repositories/IInspeccionRepository.ts
export interface IInspeccionRepository {
  findByEquipo(equipoId: number): Promise<Inspeccion[]>
  save(inspeccion: Omit<Inspeccion, 'id'>): Promise<Inspeccion>
}
```

```typescript
// apps/backend/src/infrastructure/repositories/PrismaInspeccionRepository.ts
import prisma from '../prisma/prismaClient'
import type { IInspeccionRepository } from '../../domain/repositories/IInspeccionRepository'

export class PrismaInspeccionRepository implements IInspeccionRepository {
  async findByEquipo(equipoId: number) {
    return prisma.inspeccion.findMany({
      where: { equipoId },
      orderBy: { realizadaEn: 'desc' },
      include: { usuario: { select: { nombre: true } } }
    })
  }

  async save(datos: Omit<Inspeccion, 'id'>) {
    return prisma.inspeccion.create({ data: datos })
  }
}
```

> [!WARNING]
> Nunca ejecutes `prisma migrate dev` contra la base de datos de producción. Ese comando elimina y recrea la base de datos en caso de conflicto. En producción usa **siempre** `prisma migrate deploy`.

> [!CAUTION]
> Antes de cualquier migración sobre datos reales, genera un respaldo del archivo `Maestros.xlsx` y un dump de la base de datos.

---

## 19. Comandos de Referencia Rápida

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia frontend + backend simultáneamente |
| `pnpm dev:frontend` | Inicia solo el frontend (Vite, puerto 5173) |
| `pnpm dev:backend` | Inicia solo el backend (Express, puerto 3000) |
| `pnpm build` | Compila ambos proyectos para producción |
| `pnpm --filter @sinergy/frontend add <paquete>` | Instala dependencia en el frontend |
| `pnpm --filter @sinergy/backend add <paquete>` | Instala dependencia en el backend |
| `pnpm install --ignore-scripts` | Instala sin ejecutar scripts de build |

---

## 20. Solución de Errores Comunes

**`ERR_PNPM_IGNORED_BUILDS`**
- **Causa:** pnpm bloquea scripts de instalación de paquetes que requieren compilación nativa por seguridad.
- **Solución:** Agrega los paquetes a `pnpm.ignoredBuiltDependencies` en el `package.json` raíz, o ejecuta `pnpm approve-builds`.

**`Command "dev" not found`**
- **Causa:** Estás ejecutando el comando en la carpeta de un workspace, no en la raíz.
- **Solución:** Ejecuta siempre desde `c:\xampp\htdocs\Sinergy\`.

**`Module ... has no exported member 'defineConfig'`**
- **Causa:** Configuración de `moduleResolution` incorrecta en `tsconfig.node.json`.
- **Solución:** Usa `"module": "ESNext"` y `"moduleResolution": "bundler"` en `tsconfig.node.json`.

**`UND_ERR_DESTROYED`**
- **Causa:** Problema de red temporal durante `pnpm install`.
- **Solución:** Ejecuta `pnpm install --network-concurrency 1`.
