# Vuetify 3 + @mdi/font (Cimientos y Layout Base)

**Paquetes:** `vuetify@^3.7.0` + `@mdi/font@^7.4.47`

Vuetify 3 es la librería **principal de UI** recomendada para Sinergy. Implementa el estándar **Material Design 3**, ofreciendo una suite completa de componentes avanzados (`v-app`, `v-navigation-drawer`, `v-app-bar`, `v-data-table`, `v-dialog`, `v-form`, `v-card`, `v-btn`) e íconos vectoriales `@mdi/font`.

---

### Concepto Arquitectónico Central: Regla de Oro de Vuetify (`<v-app>`)

Para que Vuetify calcule correctamente los tamaños, capas (z-index), portales (diálogos, menús desplegables), drawers navegables y barras de herramientas, **toda la aplicación DEBE estar envuelta en un componente `<v-app>`**.

```
App.vue
  └── <v-app>
        ├── <v-navigation-drawer>  (Menú lateral colapsable)
        ├── <v-app-bar>            (Barra superior de navegación)
        ├── <v-main>               (Área de contenido principal donde renderiza <router-view />)
        │     └── <router-view />
        └── <v-footer>             (Pie de página global)
```

---

### Paso 1: Configuración e Inicialización del Plugin (`src/plugins/vuetify.ts`)

En `apps/frontend/src/plugins/vuetify.ts`, configuramos el tema visual, los colores institucionales de Sinergy y los íconos por defecto:

```typescript
// apps/frontend/src/plugins/vuetify.ts
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Tema claro personalizado de Sinergy
const sinergyLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary: '#1E88E5',     // Azul Corporativo
    secondary: '#424242',   // Gris Oscuro
    accent: '#00E676',      // Verde Neón / Éxito
    error: '#FF5252',       // Rojo Alerta
    info: '#2196F3',        // Azul Info
    success: '#4CAF50',     // Verde Estado
    warning: '#FB8C00',     // Naranja Advertencia
    background: '#F4F6F9',  // Fondo claro descansado
    surface: '#FFFFFF'      // Fondo de tarjetas y tablas
  }
}

// Tema oscuro personalizado de Sinergy
const sinergyDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#90CAF9',
    secondary: '#B0BEC5',
    accent: '#69F0AE',
    error: '#FF5252',
    background: '#121212',
    surface: '#1E1E1E'
  }
}

export const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi'
  },
  theme: {
    defaultTheme: 'sinergyLightTheme',
    themes: {
      sinergyLightTheme,
      sinergyDarkTheme
    }
  }
})

export default vuetify
```

---

### Paso 2: Registro en `main.ts`

En `apps/frontend/src/main.ts`:

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify) // Registrar Vuetify en la app Vue 3

app.mount('#app')
```

---

### Paso 3: Construcción del Layout Base en `App.vue`

Este es el **cimiento visual y funcional** de Sinergy. `App.vue` estructura el menú lateral, la barra superior y la zona dinámica del Router:

```vue
<!-- apps/frontend/src/App.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from 'vuetify'

const drawer = ref(true)
const theme = useTheme()

// Alternar entre modo Claro y Oscuro
function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark
    ? 'sinergyLightTheme'
    : 'sinergyDarkTheme'
}
</script>

<template>
  <v-app>
    <!-- Menú Lateral de Navegación -->
    <v-navigation-drawer v-model="drawer" app elevation="2">
      <v-list-item
        title="Sinergy System"
        subtitle="Gestión de Inspecciones"
        prepend-icon="mdi-shield-check-outline"
        class="py-3"
      ></v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
          to="/dashboard"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-clipboard-list-outline"
          title="Inspecciones"
          value="inspecciones"
          to="/inspecciones"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-cog"
          title="Configuración"
          value="config"
          to="/configuracion"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Barra Superior (Top Bar) -->
    <v-app-bar color="primary" density="compact" elevation="2">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-bold">Sinergy App</v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- Botón de Tema (Claro / Oscuro) -->
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <!-- Notificaciones -->
      <v-btn icon>
        <v-badge dot color="error">
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </v-app-bar>

    <!-- Contenido Principal Dinámico -->
    <v-main>
      <v-container fluid class="pa-4">
        <router-view />
      </v-container>
    </v-main>

    <!-- Pie de Página Global -->
    <v-footer app class="text-caption text-grey d-flex justify-space-between px-4">
      <span>&copy; 2026 Sinergy Industrial - Plataforma Modular</span>
      <span>v1.0.0</span>
    </v-footer>
  </v-app>
</template>
```

---

### Paso 4: Sistema de Grillas Responsivo de Vuetify (`v-container`, `v-row`, `v-col`)

Vuetify posee un sistema de grid de 12 columnas idéntico a Bootstrap en concepto, pero totalmente integrado con sus componentes:

- `v-container`: Contenedor principal con padding automático. `fluid` hace que ocupe el 100% del ancho.
- `v-row`: Fila que agrupa columnas (Flexbox).
- `v-col`: Columnas configurables según breakpoint (`cols` para móvil, `sm`, `md`, `lg`, `xl` para pantallas más grandes).

**Ejemplo de Grid Responsiva:**

```vue
<template>
  <v-row>
    <!-- Ocupa 12 columnas en móvil y 4 en pantallas medianas (3 tarjetas por fila) -->
    <v-col cols="12" md="4" v-for="n in 3" :key="n">
      <v-card elevation="2" class="pa-2">
        <v-card-title>Tarjeta {{ n }}</v-card-title>
        <v-card-text>Contenido responsivo adaptado automáticamente.</v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
```

---

### Paso 5: Componentes Esenciales para Sinergy

#### A. Formularios e Inputs (`v-form`, `v-text-field`, `v-select`)

```vue
<script setup lang="ts">
import { ref } from 'vue'

const formValido = ref(false)
const equipo = ref('')
const planta = ref(null)

const plantas = [
  { title: 'Planta Norte - Extrusión', value: 1 },
  { title: 'Planta Sur - Mezclado', value: 2 }
]

function guardar() {
  if (formValido.value) {
    console.log('Guardando equipo:', equipo.value, planta.value)
  }
}
</script>

<template>
  <v-form v-model="formValido" @submit.prevent="guardar">
    <v-text-field
      v-model="equipo"
      label="Nombre del Equipo"
      prepend-inner-icon="mdi-engine"
      variant="outlined"
      :rules="[v => !!v || 'El nombre es obligatorio']"
      required
    ></v-text-field>

    <v-select
      v-model="planta"
      :items="plantas"
      label="Seleccionar Planta"
      prepend-inner-icon="mdi-factory"
      variant="outlined"
      :rules="[v => !!v || 'Debe seleccionar una planta']"
    ></v-select>

    <v-btn type="submit" color="primary" :disabled="!formValido" prepend-icon="mdi-check">
      Registrar
    </v-btn>
  </v-form>
</template>
```

#### B. Tablas de Datos Dinámicas (`v-data-table`)

```vue
<script setup lang="ts">
import { ref } from 'vue'

const headers = [
  { title: 'ID', key: 'id', align: 'start' },
  { title: 'Código', key: 'codigo' },
  { title: 'Equipo', key: 'nombre' },
  { title: 'Estado', key: 'estado' },
  { title: 'Acciones', key: 'acciones', sortable: false }
]

const items = ref([
  { id: 1, codigo: 'EQ-01', nombre: 'Compresor Principal', estado: 'Operativo' },
  { id: 2, codigo: 'EQ-02', nombre: 'Motor de Arrastre', estado: 'Alerta' }
])
</script>

<template>
  <v-card elevation="2">
    <v-card-title class="d-flex align-center gap-2 pa-4">
      <v-icon icon="mdi-table-large" color="primary" />
      Listado de Equipos
    </v-card-title>

    <v-data-table :headers="headers" :items="items" class="elevation-0">
      <template #item.estado="{ item }">
        <v-chip
          :color="item.estado === 'Operativo' ? 'success' : 'warning'"
          size="small"
          label
        >
          {{ item.estado }}
        </v-chip>
      </template>

      <template #item.acciones="{ item }">
        <v-btn icon="mdi-pencil" size="small" variant="text" color="info" />
        <v-btn icon="mdi-delete" size="small" variant="text" color="error" />
      </template>
    </v-data-table>
  </v-card>
</template>
```

#### C. Modales de Diálogo (`v-dialog`)

```vue
<script setup lang="ts">
import { ref } from 'vue'

const dialog = ref(false)
</script>

<template>
  <v-btn color="error" prepend-icon="mdi-alert-circle" @click="dialog = true">
    Eliminar Registro
  </v-btn>

  <v-dialog v-model="dialog" max-width="500">
    <v-card title="Confirmar Eliminación">
      <v-card-text>
        ¿Estás seguro de que deseas eliminar esta inspección? Esta acción no se puede deshacer.
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text="Cancelar" @click="dialog = false"></v-btn>
        <v-btn color="error" variant="elevated" text="Eliminar" @click="dialog = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

---

### Convivencia con Bootstrap 5 en Sinergy

Tanto Vuetify 3 como Bootstrap 5 están instalados en el monorepo. Para trabajar de forma armónica sin conflictos de estilos:

1. **Usa Vuetify 3 como el Framework de UI Principal:** Estructura Layouts (`v-app`, `v-main`), componentes complejos (Tablas, Formularios, Diálogos, Cards, Drawers) con componentes `v-*`.
2. **Usa Bootstrap 5 como complemento de utilidades:** Aprovecha sus clases de utilidad rápida (`d-flex`, `gap-3`, `text-center`, `align-items-center`) en elementos contenedores donde sea conveniente.
