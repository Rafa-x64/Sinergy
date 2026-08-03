# Vue 3 (Composition API & TypeScript) en Sinergy - Guía Completa y Tutorial

Vue 3 (`vue@3.5.13`) es el núcleo del frontend SPA de Sinergy. Todo componente debe escribirse obligatoriamente utilizando la **Composition API** con la sintaxis `<script setup lang="ts">`.

---

## 1. Fundamentos de Reactividad: `ref`, `reactive` y `computed`

### `ref` vs `reactive`
- **`ref<T>()`**: Se usa para valores primitivos (strings, números, booleans) y objetos/arrays individuales. Se accede a su contenido con `.value` en el script (en la plantilla `<template>` se desempaqueta automáticamente).
- **`computed<T>()`**: Propiedad calculada reactiva en base a otros refs. Se almacena en caché y solo se reevalúa cuando cambian sus dependencias.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// Estado reactivo con ref
const contador = ref<number>(0)
const nombreTecnico = ref<string>('Rafa')

// Propiedad computada
const esMayorDeDiez = computed<boolean>(() => contador.value > 10)
const saludoLegible = computed<string>(() => `Técnico asignado: ${nombreTecnico.value.toUpperCase()}`)

function incrementar() {
  contador.value++
}
</script>

<template>
  <v-card class="pa-4">
    <h3>{{ saludoLegible }}</h3>
    <p>Valor actual: {{ contador }}</p>
    <v-chip :color="esMayorDeDiez ? 'error' : 'success'">
      {{ esMayorDeDiez ? 'Límite superado' : 'Dentro del rango' }}
    </v-chip>
    <v-btn color="primary" class="mt-2" @click="incrementar">Incrementar</v-btn>
  </v-card>
</template>
```

---

## 2. Watchers (`watch` y `watchEffect`)

Los watchers ejecutan efectos colaterales cuando una fuente reactiva cambia:

```typescript
import { ref, watch, watchEffect } from 'vue'

const busqueda = ref('')

// Observar un valor específico
watch(busqueda, (nuevoValor, viejoValor) => {
  console.log(`Buscando: ${nuevoValor} (anterior: ${viejoValor})`)
})

// watchEffect: Ejecuta inmediatamente y rastrea dependencias automáticamente
watchEffect(() => {
  console.log(`Filtro actual aplicado: ${busqueda.value}`)
})
```

---

## 3. Props y Emits Tipados con TypeScript

En Sinergy está prohibido usar la Options API o props no tipadas. Usamos macros de compilador:

### Componente Hijo (`StatusChip.vue`):

```vue
<script setup lang="ts">
// 1. Definición de Props Tipadas
interface Props {
  estado: 'OPERATIVO' | 'MANTENIMIENTO' | 'CRITICO'
  mostrarTexto?: boolean // Opcional
}

const props = withDefaults(defineProps<Props>(), {
  mostrarTexto: true
})

// 2. Definición de Emits Tipados
const emit = defineEmits<{
  (e: 'cambiarEstado', nuevoEstado: string): void
}>()

function notificarCambio() {
  emit('cambiarEstado', props.estado)
}
</script>

<template>
  <v-chip
    :color="props.estado === 'OPERATIVO' ? 'success' : props.estado === 'CRITICO' ? 'error' : 'warning'"
    size="small"
    @click="notificarCambio"
  >
    <span v-if="props.mostrarTexto">{{ props.estado }}</span>
  </v-chip>
</template>
```

---

## 4. Hooks del Ciclo de Vida (`Lifecycle Hooks`)

Para inicialización y limpieza de recursos (event listeners, timers, subscripciones):

```typescript
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  console.log('El componente se ha montado en el DOM')
})

onUnmounted(() => {
  console.log('Limpiando event listeners para evitar fugas de memoria')
})
```

---

## 5. Reglas de Estilo y Buenas Prácticas Sinergy

1. **Uso Obligatorio de TypeScript:** Queda estrictamente prohibido usar el tipo `any`. Define interfaces en `src/types/` o interfaces locales.
2. **Descomposición Modular:** Si un componente supera las 200-250 líneas, divídelo en subcomponentes o extrae su lógica a un *composable* (`src/composables/`).
