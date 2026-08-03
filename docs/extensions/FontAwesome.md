# FontAwesome 6 SVG en Sinergy - Guía Completa y Tutorial de Uso

FontAwesome 6 SVG (`@fortawesome/vue-fontawesome@3.0.6`) proporciona íconos vectoriales secundarios para casos de uso específicos donde se requieran gráficos vectoriales renderizados directamente en el DOM.

---

## 1. Instalación y Registro Selectivo (Tree-Shaking)

### Instalación de Paquetes
```powershell
# En apps/frontend
pnpm --filter @sinergy/frontend add @fortawesome/fontawesome-svg-core@6.5.1 @fortawesome/free-solid-svg-icons@6.5.1 @fortawesome/vue-fontawesome@3.0.6
```

### Configuración del Plugin (`apps/frontend/src/plugins/fontawesome.ts`)

Para evitar inflar el tamaño de la aplicación (bundle size), **nunca importes la suite completa de íconos**. Registra explícitamente solo los íconos que vas a utilizar:

```typescript
// apps/frontend/src/plugins/fontawesome.ts
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Importar únicamente los íconos solid requeridos
import {
  faCheck,
  faTriangleExclamation,
  faGear,
  faWrench,
  faUser,
  faFilePdf,
  faFileExcel,
  faRotate
} from '@fortawesome/free-solid-svg-icons'

// Agregar íconos a la librería global
library.add(
  faCheck,
  faTriangleExclamation,
  faGear,
  faWrench,
  faUser,
  faFilePdf,
  faFileExcel,
  faRotate
)

export { FontAwesomeIcon }
```

### Registro en `main.ts`

```typescript
// apps/frontend/src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { FontAwesomeIcon } from './plugins/fontawesome'

const app = createApp(App)
app.component('FontAwesomeIcon', FontAwesomeIcon)
app.mount('#app')
```

---

## 2. Tutorial de Uso en Plantillas Vue 3

### Ejemplos Básicos y Modificadores

```vue
<template>
  <div class="d-flex align-center gap-3">
    <!-- Ícono simple -->
    <font-awesome-icon icon="wrench" class="text-primary" />

    <!-- Ícono con tamaño y animación de rotación (Spin) -->
    <font-awesome-icon icon="rotate" spin size="2x" class="text-info" />

    <!-- Íconos de exportación -->
    <font-awesome-icon icon="file-pdf" size="lg" class="text-danger" />
    <font-awesome-icon icon="file-excel" size="lg" class="text-success" />

    <!-- Ícono con sintaxis de arreglo implícita -->
    <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-warning" />
  </div>
</template>
```

---

## 3. Criterio de Selección de Íconos en Sinergy

- **Material Design Icons (`@mdi/font`):** Es el estándar principal para todos los componentes de la interfaz Vuetify 3 (`v-btn`, `v-text-field`, `v-navigation-drawer`, `v-data-table`).
- **FontAwesome:** Reservado como respaldo para reportes impresos, botones de exportación a documentos (PDF/Excel) o componentes aislados donde se requiera un glifo específico de FontAwesome.
