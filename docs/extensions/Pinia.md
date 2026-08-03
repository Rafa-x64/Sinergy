# Pinia Store Management en Sinergy - Guía Completa y Tutorial

Pinia (`pinia@2.1.7`) es el gestor de estado global oficial para Vue 3. Reemplaza por completo a Vuex. Proporciona soporte nativo para TypeScript, autocompletado automático y excelente integración con la Composition API.

En Sinergy, cada store representa un dominio específico y autocontenido (Principios SRP - Single Responsibility Principle): `authStore`, `appStore`, `inspeccionStore`.

---

## 1. Registro Global (`main.ts`)

```typescript
// apps/frontend/src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

---

## 2. Definición de Stores (Sintaxis Setup Recomendada)

Se debe utilizar la **Setup Syntax** (`defineStore` con función compuso), que imita el patrón de `<script setup>`:

### Store de Autenticación (`src/stores/authStore.ts`)

```typescript
// apps/frontend/src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/utils/http'
import type { ApiResponse } from '@/types/api.types'

export interface Usuario {
  id: number
  email: string
  nombre: string
  rol: 'ADMIN' | 'SUPERVISOR' | 'TECNICO'
}

export const useAuthStore = defineStore('auth', () => {
  // 1. Estado (State = ref)
  const token = ref<string | null>(localStorage.getItem('token_auth'))
  const usuario = ref<Usuario | null>(null)
  const cargando = ref(false)

  // 2. Getters (Getters = computed)
  const isAuthenticated = computed<boolean>(() => !!token.value)
  const esAdmin = computed<boolean>(() => usuario.value?.rol === 'ADMIN')

  // 3. Acciones (Actions = functions)
  const setSession = (nuevoToken: string, datosUsuario: Usuario) => {
    token.value = nuevoToken
    usuario.value = datosUsuario
    localStorage.setItem('token_auth', nuevoToken)
  }

  const login = async (email: string, password: string) => {
    cargando.value = true
    try {
      const { data } = await http.post<ApiResponse<{ token: string; usuario: Usuario }>>('/auth/login', {
        email,
        password
      })
      setSession(data.datos.token, data.datos.usuario)
      return true
    } finally {
      cargando.value = false
    }
  }

  const logout = () => {
    token.value = null
    usuario.value = null
    localStorage.removeItem('token_auth')
  }

  return {
    token,
    usuario,
    cargando,
    isAuthenticated,
    esAdmin,
    login,
    logout,
    setSession
  }
})
```

---

## 3. Uso en Componentes Vue 3 y Conservación de Reactividad

> [!IMPORTANT]
> Desestructurar directamente las propiedades de un store romperá su reactividad. Para desestructurar **estado** y **getters** manteniendo la reactividad, debes utilizar `storeToRefs()`. Las **acciones** se desestructuran directamente.

```vue
<!-- apps/frontend/src/components/common/HeaderUserMenu.vue -->
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// Usar storeToRefs para mantener la reactividad del estado y getters
const { usuario, isAuthenticated, esAdmin } = storeToRefs(authStore)

// Desestructurar acciones directamente
const { logout } = authStore

function cerrarSesion() {
  logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div v-if="isAuthenticated" class="d-flex align-center gap-2">
    <v-avatar color="primary" size="32">
      <span class="text-caption text-white">{{ usuario?.nombre.charAt(0) }}</span>
    </v-avatar>

    <span>{{ usuario?.nombre }}</span>

    <v-chip v-if="esAdmin" color="error" size="x-small">ADMIN</v-chip>

    <v-btn icon="mdi-logout" variant="text" size="small" @click="cerrarSesion" />
  </div>
</template>
```

---

## 4. Reglas de Uso en Sinergy

1. **Mutaciones a través de Acciones:** Nunca mutes la propiedad de un store directamente desde la plantilla o componente (`authStore.token = 'xyz'` ❌). Crea siempre una función / acción explicita (`authStore.setToken('xyz')` ✅).
2. **Stores Autocontenidos:** No acumules todo el estado de la aplicación en un solo store masivo. Separa la lógica en stores modulares por dominio.
