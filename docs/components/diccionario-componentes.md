# Diccionario de Componentes Globales — Sinergy

Este manual documenta técnicamente los componentes UI reutilizables ubicados en `apps/frontend/src/components/`. Todos los componentes cumplen con la arquitectura modular del proyecto, utilizando Vue 3 Composition API (`<script setup lang="ts">`) y Vuetify 3.

---

## Tabla de Contenidos

- [1. Componente `AppTabs.vue`](#1-componente-apptabsvue)
  - [1.1 Descripción y propósito](#11-descripción-y-propósito)
  - [1.2 Props e interfaces (`TabItem`)](#12-props-e-interfaces-tabitem)
  - [1.3 Emits y eventos](#13-emits-y-eventos)
  - [1.4 Slots dinámicos](#14-slots-dinámicos)
  - [1.5 Ejemplo de integración con comentarios inline](#15-ejemplo-de-integración-con-comentarios-inline)
- [2. Componente `Menu.vue`](#2-componente-menuvue)
  - [2.1 Descripción y propósito](#21-descripción-y-propósito)
  - [2.2 Integración con Vue Router y AuthStore](#22-integración-con-vue-router-y-authstore)
- [3. Componente `SinergyChip.vue`](#3-componente-sinergychipvue)
  - [3.1 Descripción y propósito](#31-descripción-y-propósito)
- [4. Componente `ThemeToggle.vue`](#4-componente-themetogglevue)
  - [4.1 Descripción y cambio de tema claro/oscuro](#41-descripción-y-cambio-de-tema-clarooscuro)
- [5. Componente `FiltroGenerico.vue`](#5-componente-filtrogenericovue)
  - [5.1 Descripción y propósito](#51-descripción-y-propósito)
  - [5.2 Tipos y configuración (`ConfiguracionCampoFiltro`)](#52-tipos-y-configuración-configuracioncampofiltro)
  - [5.3 Props y Emits](#53-props-y-emits)
  - [5.4 Ejemplo de integración en Equipos](#54-ejemplo-de-integración-en-equipos)

---

## 1. Componente `AppTabs.vue`

### 1.1 Descripción y propósito

`AppTabs.vue` es un componente wrapper de alto nivel que encapsula `<v-tabs>` y `<v-tabs-window>` de Vuetify 3. Proporciona una interfaz unificada para vistas estructuradas por pestañas (por ejemplo: Lista, Añadir, Editar).

### 1.2 Props e interfaces (`TabItem`)

El componente consume la interfaz `TabItem` declarada en `src/core/types/tabs.ts`:

```typescript
// src/core/types/tabs.ts
export interface TabItem {
    id: string | number // Identificador único de la pestaña (utilizado en la ranura #tab-{id})
    name: string        // Nombre visible en la barra de pestañas
    color?: string      // Color opcional de la pestaña Vuetify
}
```

**Props de `AppTabs.vue`:**
| Prop | Tipo | Requerido | Valor por defecto | Descripción |
|---|---|---|---|---|
| `tabs` | `TabItem[]` | **Sí** | - | Array de pestañas a renderizar |
| `modelValue` | `string \| number` | No | `undefined` | ID de la pestaña activa (para `v-model`) |

### 1.3 Emits y eventos

| Evento | Payload | Descripción |
|---|---|---|
| `update:modelValue` | `string \| number` | Emitido bidireccionalmente cuando el usuario cambia de pestaña |

### 1.4 Slots dinámicos

`AppTabs` genera slots dinámicos basados en la propiedad `id` de cada objeto `TabItem`:
- Slot format: `#tab-{item.id}`
- Scope: `{ tab: TabItem }`

### 1.5 Ejemplo de integración con comentarios inline

```vue
<!-- Ejemplo de uso de AppTabs.vue en una vista principal -->
<script setup lang="ts">
import { ref } from 'vue'
import AppTabs from '@/components/AppTabs.vue' // Importar el componente global
import type { TabItem } from '@/core/types/tabs' // Tipo oficial para pestañas

// Estado reactivo para controlar la pestaña activa mediante v-model
const pestañaActiva = ref<string | number>('lista')

// Definición del array de pestañas consumido por AppTabs
const pestañasModulo: TabItem[] = [
    { id: 'lista', name: 'Lista de Recursos' },
    { id: 'registrar', name: 'Añadir Nuevo Recurso' },
    { id: 'editar', name: 'Editar Recurso' }
]
</script>

<template>
    <!-- Vinculación v-model bidireccional y paso del array de pestañas -->
    <AppTabs v-model="pestañaActiva" :tabs="pestañasModulo">
        
        <!-- Slot para la pestaña Lista (#tab-lista) -->
        <template #tab-lista>
            <v-card class="pa-4" elevation="0">
                <p>Contenido de la lista de elementos...</p>
            </v-card>
        </template>

        <!-- Slot para la pestaña Registrar (#tab-registrar) -->
        <template #tab-registrar>
            <v-card class="pa-4" elevation="0">
                <p>Formulario de creación...</p>
            </v-card>
        </template>

        <!-- Slot para la pestaña Editar (#tab-editar) -->
        <template #tab-editar>
            <v-card class="pa-4" elevation="0">
                <p>Formulario de actualización...</p>
            </v-card>
        </template>

    </AppTabs>
</template>
```

---

## 2. Componente `Menu.vue`

### 2.1 Descripción y propósito

`Menu.vue` es el componente de navegación lateral permanente (`<v-navigation-drawer>`). Renderiza la marca corporativa (`SinergyChip`), la lista de enlaces de navegación protegidos por rol y el botón de cierre de sesión.

### 2.2 Integración con Vue Router y AuthStore

```vue
<!-- Fragmento conceptual de Menu.vue -->
<script setup lang="ts">
import { useAuthStore } from '@/modules/auth/auth.store' // Para acceder a roles y cerrar sesión
import { useRouter } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'

const authStore = useAuthStore()
const router = useRouter()

// Acción de cierre de sesión
const cerrarSesion = async () => {
    await authStore.logout() // Eliminar token en memoria y cookie
    router.push({ name: 'login' }) // Redirigir al inicio de sesión
}
</script>
```

---

## 3. Componente `SinergyChip.vue`

### 3.1 Descripción y propósito

`SinergyChip.vue` es el distintivo visual oficial de la marca Sinergy. Incluye un fondo en gradiente azul (`linear-gradient`), tipografía adaptativa (`clamp()`) y el subtítulo corporativo *"Control total, cero sorpresas"*. Se adapta responsivamente entre pantallas desktop y dispositivos móviles.

---

## 4. Componente `ThemeToggle.vue`

### 4.1 Descripción y cambio de tema claro/oscuro

`ThemeToggle.vue` proporciona un botón flotante con icono dinámico (`mdi-weather-night` / `mdi-weather-sunny`) que conmuta el tema visual de Vuetify 3 entre `sinergyLightTheme` y `sinergyDarkTheme`.

```typescript
// Lógica de conmutación de tema en ThemeToggle.vue
import { useTheme } from 'vuetify'

const theme = useTheme()

// Cambia reactivamente el tema global del framework Vuetify 3
const toggleTheme = () => {
  theme.global.name.value =
    theme.global.name.value === 'sinergyLightTheme'
      ? 'sinergyDarkTheme'
      : 'sinergyLightTheme'
}
```

---

## 5. Componente `FiltroGenerico.vue`

### 5.1 Descripción y propósito

`FiltroGenerico.vue` es la barra de filtrado universal reutilizable para las vistas del sistema. Permite renderizar dinámicamente controles de formulario (campos de texto con *debounce*, selects, selectores de fecha y checkboxes) según una configuración declarativa.

### 5.2 Tipos y configuración (`ConfiguracionCampoFiltro`)

Consume los tipos ubicados en `apps/shared/types/index.ts`:

```typescript
export type TipoControlFiltro = 'text' | 'select' | 'date' | 'boolean';

export interface OpcionSelect<T = string | number> {
  titulo: string;
  valor: T;
}

export interface ConfiguracionCampoFiltro<TKey extends string = string> {
  key: TKey;
  nombre: string;
  tipo: TipoControlFiltro;
  placeholder?: string;
  valorDefault?: string | number | boolean | null;
  opciones?: OpcionSelect[];
  inhabilitado?: boolean;
  retrasoMs?: number; // Tiempo de debounce en ms para campos tipo 'text'
  ancho?: number;     // Columnas de 1 a 12 en Vuetify grid
}

export type ContenidoFiltro = Record<string, string | number | boolean>;
```

### 5.3 Props y Emits

**Props:**
| Prop | Tipo | Requerido | Valor por defecto | Descripción |
|---|---|---|---|---|
| `config` | `ConfiguracionCampoFiltro<TKey>[]` | **Sí** | - | Lista de configuraciones de campos |
| `loading` | `boolean` | No | `false` | Deshabilita controles mientras se realiza la consulta |

**Emits:**
| Evento | Payload | Descripción |
|---|---|---|
| `cambiar-filtro` | `ContenidoFiltro` | Emitido con el payload de filtros limpios (sin valores nulos o vacíos) |
| `refrescar-filtro` | `void` | Emitido al presionar el botón "Limpiar Filtros" |

### 5.4 Vistas que Implementan `FiltroGenerico.vue`

1. **Equipos (`EquipoView.vue` - Pestaña Equipos)**:
   - Filtros: `busqueda`, `codigo`, `nombre`, `marca`, `modelo`, `serial`, `estadoOperativo`, `tipoEquipoId`, `ubicacionTecnicaId`.
2. **Tipos de Equipo (`EquipoView.vue` - Pestaña Tipos)**:
   - Filtros: `busqueda`, `nombre`, `descripcion`.
3. **Equipos Filtrados por Tipo (`EquiposPorTipoView.vue`)**:
   - Filtros: `busqueda`, `codigo`, `nombre`, `marca`, `modelo`, `serial`, `estadoOperativo`, `ubicacionTecnicaId`.
4. **Componentes (`ComponentesView.vue`)**:
   - Filtros: `busqueda`, `nombre`, `descripcion`, `equipoId`, `activo`.

### 5.5 Ejemplo de Integración Estándar

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import FiltroGenerico from '@/components/FiltroGenerico.vue'
import type { ConfiguracionCampoFiltro, ContenidoFiltro } from '@/../../shared/types'
import { useComponenteStore } from '@/modules/componentes/componente.store'

const componenteStore = useComponenteStore()
const cargando = ref(false)

type ComponenteFilterKeys = 'busqueda' | 'nombre' | 'descripcion' | 'activo'

const componentesFiltersConfig: ConfiguracionCampoFiltro<ComponenteFilterKeys>[] = [
  {
    key: 'busqueda',
    nombre: 'Búsqueda Global',
    tipo: 'text',
    placeholder: 'Nombre o descripción...',
    retrasoMs: 400,
    ancho: 4
  },
  {
    key: 'nombre',
    nombre: 'Nombre',
    tipo: 'text',
    placeholder: 'Filtrar por nombre...',
    retrasoMs: 400,
    ancho: 4
  },
  {
    key: 'activo',
    nombre: 'Estado',
    tipo: 'select',
    ancho: 4,
    opciones: [
      { titulo: 'Activos', valor: 'true' },
      { titulo: 'Inactivos', valor: 'false' }
    ]
  }
]

const handleFilterChange = async (payload: ContenidoFiltro): Promise<void> => {
  cargando.value = true
  try {
    await componenteStore.listarComponentes(payload)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <FiltroGenerico 
    :config="componentesFiltersConfig" 
    :loading="cargando" 
    @cambiar-filtro="handleFilterChange" 
  />
</template>
```

