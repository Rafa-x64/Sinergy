# Sinergy - Sistema de Mantenimiento

**Sinergy** es una aplicación de gestión de mantenimiento industrial construida con **Vue 3**, **TypeScript**, **Bootstrap** y un ecosistema de herramientas modernas para la captura de datos, visualización, reportes y sincronización offline.

---

## Paquetes Instalados y su Propósito

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `vue` | 3.4.21 | Framework principal |
| `vue-router` | 4.3.0 | Enrutamiento de la aplicación |
| `pinia` | 2.1.7 | Gestión de estado global |
| `bootstrap` | 5.3.3 | Framework CSS (estilos y componentes) |
| `bootstrap-vue-next` | 0.24.14 | Componentes Bootstrap para Vue 3 |
| `@vueuse/core` | 10.9.0 | Utilidades reactivas (localStorage, etc.) |
| `apexcharts` | 3.49.1 | Gráficos interactivos |
| `vue-apexcharts` | 1.7.0 | Wrapper Vue para ApexCharts |
| `chart.js` | 4.4.2 | Gráficos ligeros |
| `vue-chartjs` | 5.3.0 | Wrapper Vue para Chart.js |
| `echarts` | 5.4.3 | Gráficos avanzados (mapas, 3D) |
| `vue-echarts` | 6.7.0 | Wrapper Vue para ECharts |
| `xlsx` | 0.18.5 | Exportar/leer archivos Excel |
| `jspdf` | 2.5.1 | Generar archivos PDF |
| `html2canvas` | 1.4.1 | Capturar HTML a imagen para PDF |
| `axios` | 1.6.8 | Cliente HTTP con interceptores |
| `@auth0/auth0-vue` | 2.6.0 | Autenticación con Auth0 |
| `vee-validate` | 4.12.4 | Validación de formularios |
| `yup` | 1.4.0 | Esquemas de validación |
| `date-fns` | 3.6.0 | Manipulación de fechas |
| `vue-toastification` | 2.0.0-rc.5 | Notificaciones toast |
| `dexie` | 4.0.1 | IndexedDB (almacenamiento offline) |
| `@fortawesome/fontawesome-svg-core` | 6.5.1 | Iconos FontAwesome |
| `@fortawesome/free-solid-svg-icons` | 6.5.1 | Iconos sólidos FontAwesome |
| `@fortawesome/vue-fontawesome` | 3.0.6 | Componente Vue para FontAwesome |

### Dependencias de Desarrollo

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@vitejs/plugin-vue` | 5.0.4 | Plugin Vite para Vue |
| `vite` | 5.2.8 | Bundler y servidor de desarrollo |
| `typescript` | 5.4.5 | Tipado estático |
| `vue-tsc` | 2.0.6 | Verificación de tipos para Vue |
| `@types/node` | 20.12.7 | Tipos para Node.js |
| `@types/bootstrap` | 5.2.10 | Tipos para Bootstrap |
| `@vue/tsconfig` | 0.5.1 | Configuración base de TypeScript para Vue |

---

## Instalación y Configuración

1. Clonar el repositorio (o crear proyecto)
```bash
git clone <tu-repositorio>
cd sinergy
```

2. Instalar dependencias
```
bash
pnpm install
```
> **Nota**: Si aparece un error sobre scripts bloqueados, ejecuta `pnpm approve-builds` y selecciona todos los paquetes.

## 3. Variables de entorno
Crea un archivo `.env` en la raíz:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Sinergy
# Opcional para Sentry
VITE_SENTRY_DSN=tu_dsn
```

---

## 4. Iniciar servidor de desarrollo
```bash
pnpm dev
```
La aplicación estará disponible en `http://localhost:5173`.

## Uso de los Paquetes (Ejemplos Básicos)

---

### Vue Router
**Archivo**: `src/router/index.ts`
```typescript
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
```
**Uso en componentes:**
```vue
<template>
  <router-link to="/dashboard">Ir a Dashboard</router-link>
  <router-view />
</template>
```

---

### Pinia (Store de Autenticación)
**Archivo**: `src/stores/authStore.ts`
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const isAuthenticated = computed(() => !!token.value)

  const login = async (email: string, password: string) => {
    // Llamada a API
    const response = await axios.post('/auth/login', { email, password })
    token.value = response.data.token
    localStorage.setItem('token', token.value)
    return true
  }

  const logout = () => {
    token.value = null
    localStorage.removeItem('token')
  }

  return { token, isAuthenticated, login, logout }
})
```
**Uso en componentes:**
```vue
<script setup>
import { useAuthStore } from '@/stores/authStore'
const auth = useAuthStore()
auth.login('user@example.com', 'password')
</script>
```

---

## ApexCharts (Gráficos)
 **Ejemplo en un componente:**
```vue
<template>
  <apexchart type="bar" :options="chartOptions" :series="series" />
</template>

<script setup>
const chartOptions = {
  chart: { id: 'vuechart-example' },
  xaxis: { categories: ['Ene', 'Feb', 'Mar'] }
}
const series = [{ name: 'Inspecciones', data: [30, 40, 35] }]
</script>
```

---

## Exportación a Excel, PDF y Word
**Excel (xlsx):**
```typescript
import * as XLSX from 'xlsx'

const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}
```
**PDF (jspdf + html2canvas):**

```typescript
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const exportToPDF = async (element: HTMLElement, fileName: string) => {
  const canvas = await html2canvas(element)
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF()
  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
  pdf.save(`${fileName}.pdf`)
}
```
**Word (HTML a .doc)**:
```typescript
const exportToWord = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'application/msword' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.doc`
  link.click()
}
```

---

### Notificaciones (Toastification)
```vue
<script setup>
import { useToast } from 'vue-toastification'
const toast = useToast()

const showSuccess = () => {
  toast.success('¡Datos guardados correctamente!')
}
const showError = () => {
  toast.error('Ocurrió un error')
}
</script>
<template>
  <button @click="showSuccess">Mostrar éxito</button>
</template>
```

---

### Almacenamiento Offline (Dexie + IndexedDB)
**Archivo**: `src/db/database.ts`
```typescript
import Dexie from 'dexie'

const db = new Dexie('SinergyDB')
db.version(1).stores({
  inspections: '++id, plantId, date, technicianId'
})

export default db

// Guardar datos offline
await db.inspections.add({ plantId: 1, date: new Date(), technicianId: 2 })
```
**Sincronización cuando haya internet**:
```typescript
import db from '@/db/database'

const syncOfflineData = async () => {
  const localData = await db.inspections.toArray()
  // Enviar a servidor
  await axios.post('/api/sync', localData)
  // Limpiar después de sincronizar
  await db.inspections.clear()
}
```
---
### Validación de Formularios (vee-validate + yup)

```vue
<template>
  <form @submit="onSubmit">
    <input v-model="email" placeholder="Email" />
    <span>{{ errors.email }}</span>
    <button type="submit">Enviar</button>
  </form>
</template>

<script setup>
import { useForm } from 'vee-validate'
import * as yup from 'yup'

const schema = yup.object({
  email: yup.string().required().email()
})

const { handleSubmit, errors } = useForm({
  validationSchema: schema
})

const onSubmit = handleSubmit(values => {
  console.log('Formulario válido', values)
})
</script>
```

---

## Estructura de Carpetas Recomendada

```text
src/
├── assets/          # Imágenes, estilos globales
├── components/      # Componentes reutilizables
│   ├── NavBar.vue
│   ├── InspectionForm.vue
│   └── VariableTable.vue
├── composables/     # Composables (useInspection, useChart)
├── db/              # Configuración de Dexie (database.ts)
├── router/          # Configuración del router (index.ts)
├── stores/          # Stores de Pinia (authStore.ts, appStore.ts)
├── utils/           # Utilidades (axiosInterceptor.ts, exportHelpers.ts)
├── views/           # Vistas principales
│   ├── HomeView.vue
│   ├── DashboardView.vue
│   ├── LoginView.vue
│   └── ReportsView.vue
├── App.vue
├── main.ts
└── vite-env.d.ts
```
---

## Comandos Útiles
| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia servidor de desarrollo |
| `pnpm build` | Compila para producción |
| `pnpm preview` | Vista previa de la build de producción |
| `pnpm add <paquete>` | Instala una dependencia |
| `pnpm remove <paquete>` | Elimina una dependencia |
| `pnpm list --depth=0` | Lista las dependencias instaladas |
| `pnpm approve-builds` | Autoriza scripts de construcción bloqueados |
| `pnpm store prune` | Limpia la caché de paquetes |

---
## Solución de Errores Comunes
- **Error**: `Command "dev" not found`
**Causa**: No estás en la carpeta raíz del proyecto.
**Solución**: Asegúrate de ejecutar `cd sinergy` y luego `pnpm dev`.

- **Error**: `ERR_PNPM_IGNORED_BUILDS`
**Causa**: `PNPM` bloquea scripts de instalación por seguridad.
**Solución**: Ejecuta `pnpm approve-builds` y selecciona todos los paquetes.

- **Error**: `No matching version found for ...`
**Causa**: Estás pidiendo una versión que no existe.
**Solución**: Usa las versiones exactas indicadas en el `package.json` de este `README`.

- **Error**: `UND_ERR_DESTROYED`
**Causa**: Problema de red temporal.
**Solución**: Vuelve a ejecutar `pnpm install` o usa `pnpm install --network-concurrency 1`.
