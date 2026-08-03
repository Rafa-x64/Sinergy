# Vue Router 4 en Sinergy - Guía Completa y Tutorial de Uso

Vue Router 4 (`vue-router@4.3.0`) gestiona el enrutamiento de la SPA (Single Page Application). Permite navegar entre vistas sin recargar la página, proteger rutas que requieren autenticación y gestionar parámetros de URL.

---

## 1. Definición de Rutas (`src/router/index.ts`)

Todas las rutas se definen con **lazy loading** (`import(...)`) para dividir el bundle en trozos (code splitting) y optimizar la carga inicial:

```typescript
// apps/frontend/src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/equipos/:id',
    name: 'detalle-equipo',
    component: () => import('@/views/DetalleEquipoView.vue'),
    props: true, // Pasa el parámetro :id como prop al componente
    meta: { requiresAuth: true }
  },
  // Catch-all para ruta 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

export default router
```

---

## 2. Guard Global de Autenticación (`router.beforeEach`)

El middleware de navegación valida los meta-campos de la ruta antes de permitir la entrada:

```typescript
// apps/frontend/src/router/index.ts
import { useAuthStore } from '@/stores/authStore'

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirigir a login si la ruta requiere autenticación
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    // Evitar que usuarios autenticados vayan al Login
    return next({ name: 'dashboard' })
  }

  next()
})
```

---

## 3. Uso en Componentes Vue 3 (`useRouter` y `useRoute`)

### Navegación Programática y Lectura de Parámetros

```vue
<!-- apps/frontend/src/views/DetalleEquipoView.vue -->
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

// Props recibidas desde la ruta (gracias a props: true en el router)
const props = defineProps<{
  id: string
}>()

const route = useRoute()   // Información de la ruta actual
const router = useRouter() // Métodos de navegación

const cargando = ref(true)

onMounted(() => {
  console.log('ID del equipo desde props:', props.id)
  console.log('Parámetro directo de la ruta:', route.params.id)
  console.log('Query params de la URL:', route.query)
})

function volverAlDashboard() {
  router.push({ name: 'dashboard' })
}

function irAInspeccion() {
  router.push(`/inspecciones/nueva?equipoId=${props.id}`)
}
</script>

<template>
  <v-card class="pa-4">
    <h2>Detalle del Equipo #{{ props.id }}</h2>
    <div class="d-flex gap-2 mt-4">
      <v-btn color="secondary" @click="volverAlDashboard">Volver</v-btn>
      <v-btn color="primary" @click="irAInspeccion">Nueva Inspección</v-btn>
    </div>
  </v-card>
</template>
```

---

## 4. Renderizado con `<router-view>` y Enlaces con `<router-link>`

En las plantillas:

```vue
<template>
  <!-- Enlaces Declarativos -->
  <router-link :to="{ name: 'dashboard' }" class="text-primary">
    Ir al Dashboard
  </router-link>

  <!-- Outlet Dinámico donde se renderiza la vista activa -->
  <router-view />
</template>
```
