# VueUse (`@vueuse/core`) en Sinergy - Guía Completa y Tutorial de Uso

VueUse (`@vueuse/core@10.9.0`) es una colección de composables utilitarios basados en la Composition API de Vue 3. Proporciona soluciones reactivas listas para interactuar con la API del navegador, almacenamiento, red y responsividad.

No requiere registro en `main.ts`; los composables se importan directamente donde se necesitan.

---

## 1. Composables Principales Utilizados en Sinergy

### A. Almacenamiento Reactivo (`useLocalStorage`)

Sincroniza un `ref` de Vue directamente con el `localStorage` del navegador de forma reactiva y transparente:

```typescript
import { useLocalStorage } from '@vueuse/core'

// El valor se guarda automáticamente en localStorage con la clave 'token_auth'
const token = useLocalStorage<string | null>('token_auth', null)

// Para actualizar:
token.value = 'eyJhbGciOi...'

// Para limpiar:
token.value = null
```

---

### B. Detección de Conexión a Internet (`useOnline`)

Fundamental para la arquitectura **Offline-First** de Sinergy:

```vue
<script setup lang="ts">
import { useOnline } from '@vueuse/core'
import { watch } from 'vue'
import { useNotifications } from '@/composables/useNotifications'

const isOnline = useOnline()
const { notifySuccess, notifyOfflineWarning } = useNotifications()

watch(isOnline, (online) => {
  if (online) {
    notifySuccess('Conexión reestablecida. Sincronizando datos...')
  } else {
    notifyOfflineWarning()
  }
})
</script>

<template>
  <v-chip :color="isOnline ? 'success' : 'warning'" size="small">
    <v-icon :icon="isOnline ? 'mdi-wifi' : 'mdi-wifi-off'" class="me-1" />
    {{ isOnline ? 'Conectado' : 'Modo Offline' }}
  </v-chip>
</template>
```

---

### C. Responsividad y Tamaño de Ventana (`useWindowSize` y `useBreakpoints`)

```typescript
import { useWindowSize, useBreakpoints, breakpointsBootstrapV5 } from '@vueuse/core'
import { computed } from 'vue'

const { width, height } = useWindowSize()
const breakpoints = useBreakpoints(breakpointsBootstrapV5)

// Booleans reactivos para detectar pantallas
const isMobile = breakpoints.smaller('md') // true si ancho < 768px
const isDesktop = breakpoints.greaterOrEqual('lg')
```

---

### D. Optimización de Búsqueda con Debounce (`useDebounceFn`)

Evita realizar llamadas excesivas a la API por cada pulsación de tecla en un buscador:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import http from '@/utils/http'

const filtro = ref('')
const resultados = ref([])
const cargando = ref(false)

// La función solo se ejecuta 400ms después de que el usuario deje de escribir
const buscarEnServidor = useDebounceFn(async (termino: string) => {
  if (!termino.trim()) return
  cargando.value = true
  try {
    const { data } = await http.get(`/equipos/buscar?q=${termino}`)
    resultados.value = data
  } finally {
    cargando.value = false
  }
}, 400)

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  buscarEnServidor(target.value)
}
</script>

<template>
  <v-text-field
    v-model="filtro"
    label="Buscar equipo..."
    @input="onInput"
    :loading="cargando"
  />
</template>
```

---

### E. Copiar al Portapapeles (`useClipboard`)

```typescript
import { useClipboard } from '@vueuse/core'

const { copy, copied, isSupported } = useClipboard()

function copiarCodigo(codigo: string) {
  if (isSupported.value) {
    copy(codigo)
  }
}
```
