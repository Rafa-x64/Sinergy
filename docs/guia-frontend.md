# Guía del Desarrollador Frontend — Sinergy

Esta guía es la referencia técnica definitiva para hacer crecer el frontend de Sinergy. Está escrita a partir del código real del proyecto. Al terminar de leerla serás capaz de agregar vistas, stores, formularios y rutas nuevas sin consultar a nadie.

---

## Tabla de Contenidos

- [1. Mapa Arquitectónico del Frontend](#1-mapa-arquitectónico-del-frontend)
  - [1.1 Estructura de carpetas](#11-estructura-de-carpetas)
  - [1.2 Estructura interna de cada módulo](#12-estructura-interna-de-cada-módulo)
  - [1.3 Tecnologías y sus roles](#13-tecnologías-y-sus-roles)
- [2. La Instancia HTTP — `api` de `@/core/api`](#2-la-instancia-http--api-de-coreapi)
  - [2.1 Por qué se usa Axios y no `fetch` directo](#21-por-qué-se-usa-axios-y-no-fetch-directo)
  - [2.2 Qué hace el interceptor de request](#22-qué-hace-el-interceptor-de-request)
  - [2.3 Qué hace el interceptor de response (auto-refresh)](#23-qué-hace-el-interceptor-de-response-auto-refresh)
  - [2.4 Cómo importar y usar `api` en un store](#24-cómo-importar-y-usar-api-en-un-store)
- [3. El Contrato de la API — `RespuestaApi<T>`](#3-el-contrato-de-la-api--respuestaapi)
  - [3.1 La interfaz `RespuestaApi<T>`](#31-la-interfaz-respuestaapi)
  - [3.2 Cómo manejar la respuesta en el store](#32-cómo-manejar-la-respuesta-en-el-store)
- [4. Los Stores de Pinia — `*.store.ts`](#4-los-stores-de-pinia--storets)
  - [4.1 Sintaxis obligatoria: Composition API](#41-sintaxis-obligatoria-composition-api)
  - [4.2 Estructura completa de un store](#42-estructura-completa-de-un-store)
  - [4.3 Los tipos propios del módulo (DTOs e interfaces)](#43-los-tipos-propios-del-módulo-dtos-e-interfaces)
  - [4.4 Manejo de errores con `AxiosError`](#44-manejo-de-errores-con-axioserror)
  - [4.5 Cómo consumir el store en una vista](#45-cómo-consumir-el-store-en-una-vista)
- [5. Las Vistas — `*View.vue`](#5-las-vistas--viewvue)
  - [5.1 Estructura obligatoria de una vista](#51-estructura-obligatoria-de-una-vista)
  - [5.2 El componente `AppTabs` — vistas con pestañas](#52-el-componente-apptabs--vistas-con-pestañas)
  - [5.3 La tabla de datos — `v-data-table`](#53-la-tabla-de-datos--v-data-table)
  - [5.4 El diálogo de confirmación — `v-dialog`](#54-el-diálogo-de-confirmación--v-dialog)
  - [5.5 Feedback al usuario — `useToast`](#55-feedback-al-usuario--usetoast)
  - [5.6 Carga inicial de datos](#56-carga-inicial-de-datos)
- [6. Los Formularios — `*Form.vue` y `validations/`](#6-los-formularios--formvue-y-validations)
  - [6.1 El tipo `VuetifyForm`](#61-el-tipo-vuetifyform)
  - [6.2 Estructura de un formulario reusable](#62-estructura-de-un-formulario-reusable)
  - [6.3 El archivo de validaciones (`validations/registro.ts`)](#63-el-archivo-de-validaciones-validationsregistrots)
  - [6.4 Cómo reutilizar el mismo formulario para crear y editar](#64-cómo-reutilizar-el-mismo-formulario-para-crear-y-editar)
- [7. Los Tipos del Core — `src/core/types/`](#7-los-tipos-del-core--srccoreTypes)
  - [7.1 `VuetifyForm` — Referencia al formulario de Vuetify](#71-vuetifyform--referencia-al-formulario-de-vuetify)
  - [7.2 `TabItem` — Definición de pestañas para `AppTabs`](#72-tabitem--definición-de-pestañas-para-apptabs)
- [8. El Router — `src/core/router.ts`](#8-el-router--srccorerouterts)
  - [8.1 Cómo registrar una ruta nueva](#81-cómo-registrar-una-ruta-nueva)
  - [8.2 El Navigation Guard — cómo funciona la autenticación de rutas](#82-el-navigation-guard--cómo-funciona-la-autenticación-de-rutas)
- [9. Tutorial Completo: Agregar un Módulo Nuevo (de cero a funcional)](#9-tutorial-completo-agregar-un-módulo-nuevo-de-cero-a-funcional)
  - [9.1 Paso 1 — Crear la estructura de carpetas](#91-paso-1--crear-la-estructura-de-carpetas)
  - [9.2 Paso 2 — Crear el Store](#92-paso-2--crear-el-store)
  - [9.3 Paso 3 — Crear el archivo de validaciones](#93-paso-3--crear-el-archivo-de-validaciones)
  - [9.4 Paso 4 — Crear el componente Formulario](#94-paso-4--crear-el-componente-formulario)
  - [9.5 Paso 5 — Crear la Vista principal](#95-paso-5--crear-la-vista-principal)
  - [9.6 Paso 6 — Registrar la ruta](#96-paso-6--registrar-la-ruta)
- [10. Solución a Errores Comunes](#10-solución-a-errores-comunes)

---

## 1. Mapa Arquitectónico del Frontend

### 1.1 Estructura de carpetas

```
apps/frontend/
└── src/
    ├── components/              ← Componentes globales reutilizables en toda la app
    │   ├── AppTabs.vue          ← Wrapper de v-tabs con slots dinámicos
    │   ├── Menu.vue             ← Navegación lateral de la aplicación
    │   ├── SinergyChip.vue      ← Chip de estado reutilizable
    │   └── ThemeToggle.vue      ← Interruptor de tema claro/oscuro
    ├── core/                    ← Infraestructura transversal (no toca negocio)
    │   ├── api.ts               ← Instancia Axios con interceptores JWT
    │   ├── router.ts            ← Vue Router con Navigation Guard de auth
    │   ├── config/              ← Configuración de plugins (vuetify.ts, toast.ts)
    │   ├── constants/           ← Constantes globales del frontend
    │   └── types/
    │       ├── vuetifyForm.ts   ← Tipo para referenciar el formulario de Vuetify
    │       └── tabs.ts          ← Tipo para las pestañas de AppTabs
    ├── modules/                 ← Funcionalidades organizadas por dominio
    │   ├── auth/
    │   ├── dashboard/
    │   ├── plantas/             ← Módulo de referencia para esta guía
    │   ├── ubicaciones/
    │   ├── equipo/
    │   └── mantenimiento/
    └── views/
        └── NotFoundView.vue     ← Vista de ruta no encontrada (404)
```

### 1.2 Estructura interna de cada módulo

Cada módulo dentro de `src/modules/` sigue esta estructura. Es la misma en todos los módulos existentes:

```
src/modules/plantas/
├── components/              ← Componentes UI exclusivos de este módulo
│   └── PlantaForm.vue       ← Formulario reutilizable (crear + editar)
├── validations/             ← Reglas de validación de Vuetify para los campos
│   └── registro.ts
├── views/                   ← Componentes de página (se montan en el router)
│   └── PlantasView.vue
└── plantas.store.ts         ← Estado global del módulo (Pinia)
```

### 1.3 Tecnologías y sus roles

| Tecnología | Rol en el proyecto |
|---|---|
| **Vue 3** + Composition API (`<script setup lang="ts">`) | Framework base de la SPA |
| **Pinia** | Estado global reactivo por módulo (`*.store.ts`) |
| **Vuetify 3** | Librería de componentes UI (tablas, formularios, diálogos, chips) |
| **Vue Router 4** | Navegación entre vistas con guard de autenticación |
| **Axios** (`src/core/api.ts`) | Cliente HTTP con interceptores automáticos de JWT y refresh |
| **vue-toastification** | Notificaciones de feedback al usuario |
| **TypeScript** | Tipado estricto en todos los archivos (sin `any`) |

---

## 2. La Instancia HTTP — `api` de `@/core/api`

### 2.1 Por qué se usa Axios y no `fetch` directo

La instancia `api` definida en `src/core/api.ts` resuelve dos problemas de forma automática:

1. **Inyecta el token de autenticación** en cada petición sin que lo tengas que hacer manualmente.
2. **Maneja el refresco del token** cuando expira (error 401): reintenta la petición original transparentemente, haciendo la cola de las peticiones pendientes mientras se refresca.

Si usaras `fetch` directamente (como en `authStore.apiFetch`), tendrías que gestionar esto manualmente en cada llamada. **Usa siempre `api` de `@/core/api`**.

### 2.2 Qué hace el interceptor de request

Antes de enviar cualquier petición HTTP, Axios ejecuta este código automáticamente:

```typescript
// apps/frontend/src/core/api.ts
api.interceptors.request.use((config) => {
    // Lee el token de Pinia en el momento de la petición (lazy import para evitar circularidad)
    const authStore = useAuthStore()

    if (authStore.accessToken) {
        // Agrega el header: Authorization: Bearer <token>
        config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }

    return config
})
```

Esto significa que cualquier petición que hagas con `api.get(...)`, `api.post(...)`, etc., automáticamente llevará el token si el usuario está autenticado.

### 2.3 Qué hace el interceptor de response (auto-refresh)

Cuando el backend responde con `401 Unauthorized` (token expirado), el interceptor:

1. Pausa la petición fallida.
2. Llama a `/auth/refresh` para obtener un nuevo token.
3. Guarda el nuevo token en `authStore.accessToken`.
4. Reintenta la petición original con el token nuevo.
5. Si el refresh también falla, cierra la sesión y redirige al login.

Si varias peticiones fallan al mismo tiempo con 401, se encolan y se resuelven todas en cuanto el refresh tenga éxito, evitando múltiples llamadas simultáneas al endpoint de refresh.

**Todo esto ocurre sin que el store o la vista sepa nada.** Desde tu código, la petición simplemente tarda un poco más y regresa con los datos.

### 2.4 Cómo importar y usar `api` en un store

```typescript
// En cualquier *.store.ts
import api from '../../core/api'
import { AxiosError } from 'axios'

// GET
const { data } = await api.get<RespuestaApi<TipoRespuesta>>('/plantas/listar')

// POST
const { data } = await api.post<RespuestaApi<TipoRespuesta>>('/plantas/crear', payload)

// PATCH
const { data } = await api.patch<RespuestaApi<TipoRespuesta>>(`/plantas/editar/${id}`, payload)

// DELETE
const { data } = await api.delete<RespuestaApi<TipoRespuesta>>(`/plantas/eliminar/${id}`)
```

El parámetro genérico `<RespuestaApi<TipoRespuesta>>` le dice a TypeScript qué forma tiene `data.data`. Axios ya desestructura la respuesta HTTP, por lo que `data` aquí es el body JSON.

---

## 3. El Contrato de la API — `RespuestaApi<T>`

### 3.1 La interfaz `RespuestaApi<T>`

Toda respuesta del backend sigue el formato `ResponseDTO`. En el frontend, esta interfaz está definida en `src/modules/auth/auth.store.ts` y se reexporta desde ahí para usarse en todos los stores:

```typescript
// apps/frontend/src/modules/auth/auth.store.ts
export interface RespuestaApi<T = void> {
  status: 'ok' | 'error'
  message?: string
  data?: T
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `status` | `'ok' \| 'error'` | Siempre presente. Indica si la operación fue exitosa. |
| `message` | `string \| undefined` | Mensaje descriptivo del backend. Mostrar al usuario en toasts. |
| `data` | `T \| undefined` | El recurso o colección retornada. Solo presente en respuestas exitosas. |

### 3.2 Cómo manejar la respuesta en el store

El patrón real del proyecto (`plantas.store.ts`):

```typescript
// Tipado: la respuesta será { status, message, data: Planta }
const { data } = await api.post<RespuestaApi<Planta>>('/plantas/crear', planta)

// Verificar el status antes de confiar en data
if (data.status === 'ok' && data.data) {
    plantas.value.push(data.data)  // data.data es de tipo Planta
}

// Siempre retornar la respuesta completa hacia la vista
return data
```

La vista recibe este retorno y decide cómo mostrárselo al usuario mediante `useToast`.

---

## 4. Los Stores de Pinia — `*.store.ts`

### 4.1 Sintaxis obligatoria: Composition API

Todos los stores usan la sintaxis de **Composition API** de Pinia (`defineStore('id', () => { ... })`). No usar la sintaxis de options (`defineStore('id', { state: ..., actions: ... })`).

### 4.2 Estructura completa de un store

Este es el patrón real extraído de `plantas.store.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type RespuestaApi } from '../auth/auth.store'   // Importar el tipo desde auth
import api from '../../core/api'                         // Instancia HTTP centralizada
import { AxiosError } from 'axios'                       // Para tipar errores de red

// ─── DTOs e interfaces del módulo ────────────────────────────────────────────
// Se definen en el mismo archivo del store y se exportan para usarlos en vistas y componentes

export interface RegistrarPlantaDTO {
    codigo: string
    nombre: string
    activa: boolean
}

export interface Planta {
    id: number
    codigo: string
    nombre: string
    activa: boolean
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const usePlantasStore = defineStore('plantas', () => {

    // Estado: variables reactivas (equivalente a `data` en Options API)
    const plantas = ref<Planta[]>([])

    // Acción de lectura
    async function listarPlantas(): Promise<RespuestaApi<Planta[]>> {
        try {
            const { data } = await api.get<RespuestaApi<Planta[]>>('/plantas/listar')

            if (data.status === 'ok' && data.data) {
                plantas.value = data.data   // Actualizar el estado reactivo
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al listar las plantas'
            }
        }
    }

    // Acción de escritura — CREATE
    async function registrarPlanta(planta: RegistrarPlantaDTO): Promise<RespuestaApi<Planta>> {
        try {
            const { data } = await api.post<RespuestaApi<Planta>>('/plantas/crear', planta)

            if (data.status === 'ok' && data.data) {
                plantas.value.push(data.data)   // Actualización optimista del estado
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al registrar la planta'
            }
        }
    }

    // Acción de escritura — UPDATE
    async function editarPlanta(id: number, planta: Partial<RegistrarPlantaDTO>): Promise<RespuestaApi<Planta>> {
        try {
            const { data } = await api.patch<RespuestaApi<Planta>>(`/plantas/editar/${id}`, planta)

            if (data.status === 'ok' && data.data) {
                // Actualizar solo el item modificado en el array local
                const index = plantas.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    plantas.value[index] = { ...plantas.value[index], ...data.data }
                }
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al actualizar la planta'
            }
        }
    }

    // Acción de escritura — DELETE (soft delete)
    async function eliminarPlanta(id: number): Promise<RespuestaApi<Planta>> {
        try {
            const { data } = await api.delete<RespuestaApi<Planta>>(`/plantas/eliminar/${id}`)

            if (data.status === 'ok') {
                // Soft delete: marcar como inactiva localmente
                const index = plantas.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    plantas.value[index].activa = false
                }
            }

            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return {
                status: 'error',
                message: err.response?.data?.message ?? 'Error de red al eliminar la planta'
            }
        }
    }

    // Exponer estado y acciones (solo lo que las vistas necesitan)
    return {
        plantas,
        listarPlantas,
        registrarPlanta,
        editarPlanta,
        eliminarPlanta
    }
})
```

### 4.3 Los tipos propios del módulo (DTOs e interfaces)

Los DTOs se definen en el mismo archivo del store y se exportan con `export interface`. No crear un archivo separado de tipos para el frontend.

| Nombre | Propósito |
|---|---|
| `RegistrarPlantaDTO` | Datos que se envían al backend para crear. Coincide con el body del POST. |
| `EditarPlantaDTO` (o `Partial<RegistrarPlantaDTO>`) | Datos para actualizar. Los campos son opcionales. |
| `Planta` | Forma del objeto que regresa el backend. Incluye el `id` y campos de auditoría. |

### 4.4 Manejo de errores con `AxiosError`

El `catch` de cada acción siempre:
1. Tipifica el error como `AxiosError<RespuestaApi>`.
2. Intenta extraer el mensaje del backend desde `err.response?.data?.message`.
3. Si no hay mensaje (error de red puro), usa un texto genérico de fallback.
4. Retorna un objeto `RespuestaApi` de error en lugar de lanzar la excepción.

Esto garantiza que **la vista siempre recibe una respuesta estructurada** y nunca tiene que manejar excepciones crudas.

### 4.5 Cómo consumir el store en una vista

```typescript
import { storeToRefs } from 'pinia'
import { usePlantasStore } from '../plantas.store'

const plantaStore = usePlantasStore()

// storeToRefs convierte el estado reactivo en refs individuales
// SIN storeToRefs perderías la reactividad al desestructurar
const { plantas } = storeToRefs(plantaStore)

// Los métodos se acceden directamente en el store (no necesitan storeToRefs)
const resultado = await plantaStore.registrarPlanta(datos)
```

---

## 5. Las Vistas — `*View.vue`

### 5.1 Estructura obligatoria de una vista

Toda vista sigue este esqueleto. Está basado en `PlantasView.vue`:

```vue
<script setup lang="ts">
// 1. Imports de Vue
import { ref } from 'vue'
import { storeToRefs } from 'pinia'

// 2. Imports de plugins
import { useToast } from 'vue-toastification'

// 3. Imports de componentes globales
import AppTabs from '../../../components/AppTabs.vue'

// 4. Imports de componentes del módulo
import PlantaForm from '../components/PlantaForm.vue'

// 5. Imports del store y sus tipos
import { usePlantasStore, type RegistrarPlantaDTO, type Planta } from '../plantas.store'

// 6. Imports de tipos del core
import type { TabItem } from '../../../core/types/tabs'

// ─── Inicialización ──────────────────────────────────────────────────────────
const toast = useToast()
const plantaStore = usePlantasStore()
const { plantas } = storeToRefs(plantaStore)

// ─── Estado local de la vista ────────────────────────────────────────────────
const cargando = ref<boolean>(false)
const pestañaActiva = ref<string | number>('lista')

// ─── Carga inicial de datos (sin onMounted para ejecución inmediata) ─────────
const listarPlantas = async (): Promise<void> => {
    const resultado = await plantaStore.listarPlantas()
    if (resultado.status === 'error') toast.error(resultado.message ?? 'Error al listar')
}
listarPlantas()   // Se llama directamente en el setup, no en onMounted
</script>

<template>
    <v-container fluid class="nombre-modulo-dashboard">
        <!-- Contenido de la vista -->
    </v-container>
</template>
```

### 5.2 El componente `AppTabs` — vistas con pestañas

`AppTabs` es el componente global que estructura las vistas con múltiples pestañas (lista, registrar, editar). Acepta un array de `TabItem[]` y expone slots dinámicos con el nombre `tab-{id}`.

**Definición de las pestañas:**
```typescript
import type { TabItem } from '../../../core/types/tabs'

const pestañasPlantas: TabItem[] = [
    { id: 'lista',     name: 'Lista de Plantas' },
    { id: 'registrar', name: 'Añadir Planta' },
    { id: 'editar',    name: 'Editar Planta' }
]
```

**Uso en el template:**
```vue
<AppTabs v-model="pestañaActiva" :tabs="pestañasPlantas">

    <!-- El slot se llama tab-{id} donde id es el campo id de TabItem -->
    <template #tab-lista>
        <!-- Contenido de la pestaña Lista -->
    </template>

    <template #tab-registrar>
        <!-- Contenido de la pestaña Añadir -->
    </template>

    <template #tab-editar>
        <!-- Contenido de la pestaña Editar -->
    </template>

</AppTabs>
```

El `v-model="pestañaActiva"` es bidireccional: puedes cambiar la pestaña desde el código (`pestañaActiva.value = 'editar'`) y el componente lo reflejará automáticamente.

### 5.3 La tabla de datos — `v-data-table`

Vuetify 3 provee `v-data-table`. La forma real de usarla en el proyecto:

```typescript
// Definir los headers
const headersTabla = [
    { title: 'Código',              key: 'codigo' },
    { title: 'Nombre',              key: 'nombre' },
    { title: 'Estado',              key: 'activa' },
    { title: 'Fecha Creación',      key: 'creadoEn' },
    { title: 'Última Actualización',key: 'actualizadoEn' },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const }
]
```

```vue
<v-data-table :items="plantas" :headers="headersTabla">

    <!-- Columna personalizada: chip de estado activo/inactivo -->
    <template #item.activa="{ item }">
        <v-chip :color="item.activa ? 'success' : 'error'" size="small">
            {{ item.activa ? 'Activa' : 'Inactiva' }}
        </v-chip>
    </template>

    <!-- Columna de acciones -->
    <template #item.acciones="{ item }">
        <v-btn color="primary" variant="text" size="small" @click="prepararEdicion(item)">Editar</v-btn>
        <v-btn color="error" variant="text" size="small" @click="prepararEliminacion(item.id)" :disabled="!item.activa">Eliminar</v-btn>
    </template>

</v-data-table>
```

> La sintaxis `#item.{key}` permite personalizar el renderizado de cualquier columna cuyo `key` coincida.

### 5.4 El diálogo de confirmación — `v-dialog`

Patrón real del proyecto para confirmar eliminaciones:

```typescript
// Estado del diálogo
const mostrarDialogoEliminar = ref<boolean>(false)
const idAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref<boolean>(false)

// Abrir el diálogo
const prepararEliminacion = (id: number): void => {
    idAEliminar.value = id
    mostrarDialogoEliminar.value = true
}

// Ejecutar la eliminación
const ejecutarEliminacion = async (): Promise<void> => {
    if (idAEliminar.value === null) return
    cargandoEliminacion.value = true
    try {
        const resultado = await plantaStore.eliminarPlanta(idAEliminar.value)
        if (resultado.status === 'ok') {
            toast.success(resultado.message ?? 'Elemento eliminado')
            mostrarDialogoEliminar.value = false
        } else {
            toast.error(resultado.message ?? 'Error al eliminar')
        }
    } catch {
        toast.error('Error de conexión')
    } finally {
        cargandoEliminacion.value = false
        if (!mostrarDialogoEliminar.value) idAEliminar.value = null
    }
}
```

```vue
<v-dialog v-model="mostrarDialogoEliminar" max-width="500px" persistent>
    <v-card>
        <v-card-title class="text-h6 font-weight-bold text-error">Confirmar Acción</v-card-title>
        <v-card-text>¿Está seguro de que desea desactivar este elemento?</v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="mostrarDialogoEliminar = false" :disabled="cargandoEliminacion">Cancelar</v-btn>
            <v-btn color="error" variant="flat" @click="ejecutarEliminacion" :loading="cargandoEliminacion">Eliminar</v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>
```

### 5.5 Feedback al usuario — `useToast`

`useToast` de `vue-toastification` es el sistema de notificaciones global. Se inicializa siempre al comienzo del script:

```typescript
import { useToast } from 'vue-toastification'

const toast = useToast()

// Uso según el resultado de la API:
if (resultado.status === 'ok') {
    toast.success(resultado.message ?? 'Operación exitosa')
} else {
    toast.error(resultado.message ?? 'Ocurrió un error')
}

// Para errores de conexión puros (bloque catch):
toast.error('Error de conexión con el servidor')
```

| Método | Cuándo usarlo |
|---|---|
| `toast.success(msg)` | Operación completada con `status: 'ok'` |
| `toast.error(msg)` | Operación con `status: 'error'` o excepción en catch |
| `toast.info(msg)` | Información neutral para el usuario |
| `toast.warning(msg)` | Advertencia que no impide la operación |

### 5.6 Carga inicial de datos

El patrón del proyecto es llamar la función de carga **directamente en el setup**, no dentro de `onMounted`. Esto hace que los datos se soliciten en el mismo tick de inicialización del componente:

```typescript
// Patrón del proyecto (extraído de PlantasView.vue):
const listarPlantas = async (): Promise<void> => {
    const resultado = await plantaStore.listarPlantas()
    if (resultado.status === 'error') toast.error(resultado.message ?? 'Error al listar las plantas')
}
listarPlantas()   // ← Llamada directa en el setup, sin onMounted
```

---

## 6. Los Formularios — `*Form.vue` y `validations/`

### 6.1 El tipo `VuetifyForm`

Para obtener referencia tipada a un `<v-form>` de Vuetify y poder llamar `.validate()`, `.reset()`, etc., se usa el tipo `VuetifyForm` del core:

```typescript
// apps/frontend/src/core/types/vuetifyForm.ts
export interface VuetifyForm {
    validate: () => Promise<{ valid: boolean, errors: unknown[] }>
    reset: () => void
    resetValidation: () => void
}
```

Úsalo siempre como tipo del `ref` que referencia el formulario:

```typescript
import type { VuetifyForm } from '../../../core/types/vuetifyForm'

const formRef = ref<VuetifyForm | null>(null)

// Para validar:
const { valid } = await formRef.value.validate()

// Para resetear los campos y los errores:
formRef.value.reset()

// Para limpiar solo los mensajes de error sin resetear valores:
formRef.value.resetValidation()
```

En el template, vincular la referencia al componente:
```vue
<v-form ref="formRef" @submit.prevent="manejarEnvio">
```

### 6.2 Estructura de un formulario reusable

El componente formulario (ej. `PlantaForm.vue`) recibe datos iniciales, emite los datos al padre y valida con Vuetify. Este patrón permite reusar el mismo componente para crear y editar:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { registroRules } from '../validations/registro.ts'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import type { RegistrarPlantaDTO } from '../plantas.store'

// Props que recibe del padre
const props = defineProps<{
    datosIniciales: Partial<RegistrarPlantaDTO>  // Para editar, se precargan datos
    cargando: boolean                             // Deshabilita campos mientras se guarda
    textoBoton: string                            // "Guardar Planta" o "Actualizar Planta"
}>()

// Eventos que emite hacia el padre
const emit = defineEmits<{
    (e: 'submit', datos: RegistrarPlantaDTO): void  // Datos validados listos para guardar
    (e: 'cancelar'): void                            // El usuario canceló
}>()

const formRef = ref<VuetifyForm | null>(null)
// Copia local de los datos para no mutar la prop directamente
const formulario = ref<Partial<RegistrarPlantaDTO>>({ ...props.datosIniciales })

// Si el padre cambia datosIniciales (por ejemplo, al seleccionar otra planta para editar),
// el formulario local se actualiza automáticamente
watch(() => props.datosIniciales, (nuevosDatos) => {
    formulario.value = { ...nuevosDatos }
}, { deep: true })

const manejarEnvio = async () => {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()

    if (valid) {
        emit('submit', formulario.value as RegistrarPlantaDTO)
    }
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="manejarEnvio">
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="formulario.codigo"
                    :rules="registroRules.codigo"
                    label="Código de la Planta"
                    variant="outlined"
                    required
                    :disabled="cargando"
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="formulario.nombre"
                    :rules="registroRules.nombre"
                    label="Nombre de la Planta"
                    variant="outlined"
                    required
                    :disabled="cargando"
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-switch
                    v-model="formulario.activa"
                    color="success"
                    label="Estado de la Planta (Activa)"
                    hide-details
                    :disabled="cargando"
                ></v-switch>
            </v-col>
        </v-row>
        <v-card-actions class="px-0 mt-6">
            <v-spacer></v-spacer>
            <v-btn color="grey" variant="text" class="mr-2" @click="emit('cancelar')" :disabled="cargando">
                Cancelar
            </v-btn>
            <v-btn type="submit" color="primary" variant="flat" :loading="cargando" :disabled="cargando">
                {{ textoBoton }}
            </v-btn>
        </v-card-actions>
    </v-form>
</template>
```

### 6.3 El archivo de validaciones (`validations/registro.ts`)

Cada módulo tiene su carpeta `validations/` con un archivo `registro.ts`. Contiene un objeto exportado con arrays de funciones validadoras para cada campo:

```typescript
// apps/frontend/src/modules/plantas/validations/registro.ts
export const registroRules = {
    codigo: [
        (value: string): boolean | string => {
            if (!value) return 'El código de la planta es obligatorio'
            // Puedes agregar más validaciones en el mismo array:
            // if (value.length < 3) return 'El código debe tener al menos 3 caracteres'
            return true
        }
    ],
    nombre: [
        (value: string): boolean | string => {
            if (!value) return 'El nombre de la planta es obligatorio'
            return true
        }
    ],
    activa: [
        (value: boolean): boolean | string => {
            if (value === undefined || value === null) return 'El estado es obligatorio'
            return true
        }
    ]
}
```

**Reglas de cada función validadora:**
- Recibe el valor actual del campo como primer argumento.
- Retorna `true` si el valor es válido.
- Retorna un `string` con el mensaje de error si es inválido.
- Vuetify ejecuta todas las funciones del array y muestra todos los errores.

Para vincular al campo:
```vue
<v-text-field v-model="formulario.codigo" :rules="registroRules.codigo" ...>
```

### 6.4 Cómo reutilizar el mismo formulario para crear y editar

En la vista padre (`PlantasView.vue`), el mismo componente `PlantaForm` se usa en ambas pestañas. La diferencia está en los datos iniciales y el texto del botón:

```typescript
// Estado inicial vacío para "Crear"
const plantaVacia: Partial<RegistrarPlantaDTO> = { codigo: '', nombre: '', activa: true }
const datosFormulario = ref<Partial<RegistrarPlantaDTO>>({ ...plantaVacia })
const idPlantaEditar = ref<number | null>(null)

// Preparar para editar: copiar datos de la planta seleccionada y cambiar de pestaña
const prepararEdicion = (planta: Planta): void => {
    idPlantaEditar.value = planta.id
    datosFormulario.value = { codigo: planta.codigo, nombre: planta.nombre, activa: planta.activa }
    pestañaActiva.value = 'editar'
}

// Función unificada que decide si crear o editar según la pestaña activa
const manejarGuardado = async (datosEmitidos: RegistrarPlantaDTO): Promise<void> => {
    cargando.value = true
    try {
        let resultado;

        if (pestañaActiva.value === 'registrar') {
            resultado = await plantaStore.registrarPlanta(datosEmitidos)
        } else {
            if (!idPlantaEditar.value) throw new Error('ID no válido para edición')
            resultado = await plantaStore.editarPlanta(idPlantaEditar.value, datosEmitidos)
        }

        if (resultado.status === 'ok') {
            toast.success(resultado.message ?? 'Operación exitosa')
            pestañaActiva.value = 'lista'
            datosFormulario.value = { ...plantaVacia }  // Limpiar el formulario
        } else {
            toast.error(resultado.message ?? 'Error en la operación')
        }
    } catch {
        toast.error('Error de conexión o datos inválidos')
    } finally {
        cargando.value = false
    }
}
```

En el template, la pestaña "registrar" usa `plantaVacia` y la pestaña "editar" usa `datosFormulario`:

```vue
<template #tab-registrar>
    <v-card class="pa-4" elevation="0">
        <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Registrar Nueva Planta</v-card-title>
        <PlantaForm
            :datos-iniciales="plantaVacia"
            :cargando="cargando"
            texto-boton="Guardar Planta"
            @submit="manejarGuardado"
            @cancelar="cancelarEdicion"
        />
    </v-card>
</template>

<template #tab-editar>
    <v-card class="pa-4" elevation="0">
        <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Editar Planta</v-card-title>
        <!-- Mostrar aviso si el usuario entró a la pestaña sin seleccionar un elemento -->
        <v-alert
            v-if="pestañaActiva === 'editar' && idPlantaEditar === null"
            type="info" variant="tonal" class="mb-4"
        >
            Seleccione una planta desde la pestaña "Lista de Plantas".
        </v-alert>
        <PlantaForm
            v-else
            :datos-iniciales="datosFormulario"
            :cargando="cargando"
            texto-boton="Actualizar Planta"
            @submit="manejarGuardado"
            @cancelar="cancelarEdicion"
        />
    </v-card>
</template>
```

---

## 7. Los Tipos del Core — `src/core/types/`

### 7.1 `VuetifyForm` — Referencia al formulario de Vuetify

```typescript
// apps/frontend/src/core/types/vuetifyForm.ts
export interface VuetifyForm {
    validate: () => Promise<{ valid: boolean, errors: unknown[] }>
    reset: () => void
    resetValidation: () => void
}
```

Úsalo con `ref<VuetifyForm | null>(null)` y vincúlalo al `<v-form ref="formRef">`.

### 7.2 `TabItem` — Definición de pestañas para `AppTabs`

```typescript
// apps/frontend/src/core/types/tabs.ts
export interface TabItem {
  id: string | number   // Identificador único de la pestaña (usado en el slot #tab-{id})
  name: string          // Texto visible en la pestaña
  color?: string        // Color opcional (ej. 'primary', 'error')
}
```

---

## 8. El Router — `src/core/router.ts`

### 8.1 Cómo registrar una ruta nueva

Edita `apps/frontend/src/core/router.ts` y agrega el objeto de ruta al array `routes`:

```typescript
const routes: RouteRecordRaw[] = [
  // ... rutas existentes ...

  // Nueva ruta:
  {
    path: '/proveedores',               // URL de la ruta
    name: 'proveedores',                // Nombre único para navegar programáticamente
    component: () => import('../modules/proveedores/views/ProveedoresView.vue'),  // Lazy loading
    meta: {
        requiresAuth: true,             // true = requiere sesión activa
        hideLayout: false               // false = muestra el menú lateral
    },
  },
]
```

Para navegar a la ruta desde código:
```typescript
import { useRouter } from 'vue-router'
const router = useRouter()

// Navegar por nombre
await router.push({ name: 'proveedores' })

// Navegar con parámetros
await router.push({ name: 'proveedor-detalle', params: { id: '42' } })
```

### 8.2 El Navigation Guard — cómo funciona la autenticación de rutas

El guard global en `router.ts` intercepta cada cambio de ruta:

```typescript
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const requiereAuth = to.meta.requiresAuth === true

  // Si la ruta requiere auth y no hay token en memoria:
  if (requiereAuth && !authStore.estaAutenticado) {
    // Intentar restaurar sesión desde la HttpOnly Cookie
    const sesionRestaurada = await authStore.refrescarToken()
    if (!sesionRestaurada) {
      return { name: 'login' }   // Redirigir al login si falla
    }
  }

  // Si el usuario ya está logueado e intenta ir al login, redirigir al dashboard
  if (!requiereAuth && authStore.estaAutenticado && to.name === 'login') {
    return { name: 'dashboard' }
  }
})
```

**Lo que esto significa para ti:**
- Agrega `meta: { requiresAuth: true }` a todas las rutas privadas y el guard las protege automáticamente.
- El usuario nunca se queda sin sesión en una recarga de página: el guard intenta el refresh antes de redirigir al login.
- Las rutas con `meta: { hideLayout: true }` ocultan el menú lateral (usado en login y 404).

---

## 9. Tutorial Completo: Agregar un Módulo Nuevo (de cero a funcional)

Vamos a crear el módulo `proveedores`. Al finalizar tendrás una vista completa con lista, registro y edición.

### 9.1 Paso 1 — Crear la estructura de carpetas

```
apps/frontend/src/modules/proveedores/
├── components/
│   └── ProveedorForm.vue
├── validations/
│   └── registro.ts
├── views/
│   └── ProveedoresView.vue
└── proveedores.store.ts
```

### 9.2 Paso 2 — Crear el Store

Crea `apps/frontend/src/modules/proveedores/proveedores.store.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type RespuestaApi } from '../auth/auth.store'
import api from '../../core/api'
import { AxiosError } from 'axios'

export interface RegistrarProveedorDTO {
    codigo: string
    nombre: string
    contacto?: string
    activo: boolean
}

export interface Proveedor {
    id: number
    codigo: string
    nombre: string
    contacto: string | null
    activo: boolean
}

export const useProveedoresStore = defineStore('proveedores', () => {

    const proveedores = ref<Proveedor[]>([])

    async function listarProveedores(): Promise<RespuestaApi<Proveedor[]>> {
        try {
            const { data } = await api.get<RespuestaApi<Proveedor[]>>('/proveedores/listar')
            if (data.status === 'ok' && data.data) {
                proveedores.value = data.data
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return { status: 'error', message: err.response?.data?.message ?? 'Error de red al listar proveedores' }
        }
    }

    async function registrarProveedor(proveedor: RegistrarProveedorDTO): Promise<RespuestaApi<Proveedor>> {
        try {
            const { data } = await api.post<RespuestaApi<Proveedor>>('/proveedores/crear', proveedor)
            if (data.status === 'ok' && data.data) {
                proveedores.value.push(data.data)
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return { status: 'error', message: err.response?.data?.message ?? 'Error de red al registrar' }
        }
    }

    async function editarProveedor(id: number, proveedor: Partial<RegistrarProveedorDTO>): Promise<RespuestaApi<Proveedor>> {
        try {
            const { data } = await api.patch<RespuestaApi<Proveedor>>(`/proveedores/editar/${id}`, proveedor)
            if (data.status === 'ok' && data.data) {
                const index = proveedores.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    proveedores.value[index] = { ...proveedores.value[index], ...data.data }
                }
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return { status: 'error', message: err.response?.data?.message ?? 'Error de red al editar' }
        }
    }

    async function eliminarProveedor(id: number): Promise<RespuestaApi<Proveedor>> {
        try {
            const { data } = await api.delete<RespuestaApi<Proveedor>>(`/proveedores/eliminar/${id}`)
            if (data.status === 'ok') {
                const index = proveedores.value.findIndex(p => p.id === id)
                if (index !== -1) proveedores.value[index].activo = false
            }
            return data
        } catch (error: unknown) {
            const err = error as AxiosError<RespuestaApi>
            return { status: 'error', message: err.response?.data?.message ?? 'Error de red al eliminar' }
        }
    }

    return { proveedores, listarProveedores, registrarProveedor, editarProveedor, eliminarProveedor }
})
```

### 9.3 Paso 3 — Crear el archivo de validaciones

Crea `apps/frontend/src/modules/proveedores/validations/registro.ts`:

```typescript
export const registroRules = {
    codigo: [
        (value: string): boolean | string => {
            if (!value) return 'El código del proveedor es obligatorio'
            if (value.length > 20) return 'El código no puede superar los 20 caracteres'
            return true
        }
    ],
    nombre: [
        (value: string): boolean | string => {
            if (!value) return 'El nombre del proveedor es obligatorio'
            return true
        }
    ]
}
```

### 9.4 Paso 4 — Crear el componente Formulario

Crea `apps/frontend/src/modules/proveedores/components/ProveedorForm.vue`:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { registroRules } from '../validations/registro.ts'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import type { RegistrarProveedorDTO } from '../proveedores.store'

const props = defineProps<{
    datosIniciales: Partial<RegistrarProveedorDTO>
    cargando: boolean
    textoBoton: string
}>()

const emit = defineEmits<{
    (e: 'submit', datos: RegistrarProveedorDTO): void
    (e: 'cancelar'): void
}>()

const formRef = ref<VuetifyForm | null>(null)
const formulario = ref<Partial<RegistrarProveedorDTO>>({ ...props.datosIniciales })

watch(() => props.datosIniciales, (nuevosDatos) => {
    formulario.value = { ...nuevosDatos }
}, { deep: true })

const manejarEnvio = async () => {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()
    if (valid) {
        emit('submit', formulario.value as RegistrarProveedorDTO)
    }
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="manejarEnvio">
        <v-row>
            <v-col cols="12" md="4">
                <v-text-field v-model="formulario.codigo" :rules="registroRules.codigo"
                    label="Código" variant="outlined" required :disabled="cargando">
                </v-text-field>
            </v-col>
            <v-col cols="12" md="8">
                <v-text-field v-model="formulario.nombre" :rules="registroRules.nombre"
                    label="Nombre del Proveedor" variant="outlined" required :disabled="cargando">
                </v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.contacto"
                    label="Contacto (opcional)" variant="outlined" :disabled="cargando">
                </v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-switch v-model="formulario.activo" color="success"
                    label="Estado del Proveedor (Activo)" hide-details :disabled="cargando">
                </v-switch>
            </v-col>
        </v-row>
        <v-card-actions class="px-0 mt-6">
            <v-spacer></v-spacer>
            <v-btn color="grey" variant="text" class="mr-2" @click="emit('cancelar')" :disabled="cargando">
                Cancelar
            </v-btn>
            <v-btn type="submit" color="primary" variant="flat" :loading="cargando" :disabled="cargando">
                {{ textoBoton }}
            </v-btn>
        </v-card-actions>
    </v-form>
</template>
```

### 9.5 Paso 5 — Crear la Vista principal

Crea `apps/frontend/src/modules/proveedores/views/ProveedoresView.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import AppTabs from '../../../components/AppTabs.vue'
import ProveedorForm from '../components/ProveedorForm.vue'
import { useProveedoresStore, type RegistrarProveedorDTO, type Proveedor } from '../proveedores.store'
import type { TabItem } from '../../../core/types/tabs'

const toast = useToast()
const proveedorStore = useProveedoresStore()
const { proveedores } = storeToRefs(proveedorStore)

const cargando = ref<boolean>(false)
const pestañaActiva = ref<string | number>('lista')
const idProveedorEditar = ref<number | null>(null)
const mostrarDialogoEliminar = ref<boolean>(false)
const idAEliminar = ref<number | null>(null)
const cargandoEliminacion = ref<boolean>(false)

const headersTabla = [
    { title: 'Código',   key: 'codigo' },
    { title: 'Nombre',   key: 'nombre' },
    { title: 'Contacto', key: 'contacto' },
    { title: 'Estado',   key: 'activo' },
    { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const }
]

const pestañasProveedores: TabItem[] = [
    { id: 'lista',     name: 'Lista de Proveedores' },
    { id: 'registrar', name: 'Añadir Proveedor' },
    { id: 'editar',    name: 'Editar Proveedor' }
]

const proveedorVacio: Partial<RegistrarProveedorDTO> = { codigo: '', nombre: '', contacto: '', activo: true }
const datosFormulario = ref<Partial<RegistrarProveedorDTO>>({ ...proveedorVacio })

const listar = async (): Promise<void> => {
    const resultado = await proveedorStore.listarProveedores()
    if (resultado.status === 'error') toast.error(resultado.message ?? 'Error al listar proveedores')
}
listar()

const prepararEdicion = (proveedor: Proveedor): void => {
    idProveedorEditar.value = proveedor.id
    datosFormulario.value = {
        codigo: proveedor.codigo,
        nombre: proveedor.nombre,
        contacto: proveedor.contacto ?? '',
        activo: proveedor.activo
    }
    pestañaActiva.value = 'editar'
}

const manejarGuardado = async (datosEmitidos: RegistrarProveedorDTO): Promise<void> => {
    cargando.value = true
    try {
        let resultado;
        if (pestañaActiva.value === 'registrar') {
            resultado = await proveedorStore.registrarProveedor(datosEmitidos)
        } else {
            if (!idProveedorEditar.value) throw new Error('ID no válido')
            resultado = await proveedorStore.editarProveedor(idProveedorEditar.value, datosEmitidos)
        }

        if (resultado.status === 'ok') {
            toast.success(resultado.message ?? 'Operación exitosa')
            pestañaActiva.value = 'lista'
            datosFormulario.value = { ...proveedorVacio }
        } else {
            toast.error(resultado.message ?? 'Error en la operación')
        }
    } catch {
        toast.error('Error de conexión o datos inválidos')
    } finally {
        cargando.value = false
    }
}

const cancelarEdicion = (): void => {
    pestañaActiva.value = 'lista'
    datosFormulario.value = { ...proveedorVacio }
}

const prepararEliminacion = (id: number): void => {
    idAEliminar.value = id
    mostrarDialogoEliminar.value = true
}

const ejecutarEliminacion = async (): Promise<void> => {
    if (idAEliminar.value === null) return
    cargandoEliminacion.value = true
    try {
        const resultado = await proveedorStore.eliminarProveedor(idAEliminar.value)
        if (resultado.status === 'ok') {
            toast.success(resultado.message ?? 'Proveedor desactivado')
            mostrarDialogoEliminar.value = false
        } else {
            toast.error(resultado.message ?? 'Error al desactivar')
        }
    } catch {
        toast.error('Error de conexión')
    } finally {
        cargandoEliminacion.value = false
        if (!mostrarDialogoEliminar.value) idAEliminar.value = null
    }
}
</script>

<template>
    <v-container fluid class="proveedores-dashboard">
        <AppTabs v-model="pestañaActiva" :tabs="pestañasProveedores">

            <template #tab-lista>
                <v-data-table :items="proveedores" :headers="headersTabla">
                    <template #item.activo="{ item }">
                        <v-chip :color="item.activo ? 'success' : 'error'" size="small">
                            {{ item.activo ? 'Activo' : 'Inactivo' }}
                        </v-chip>
                    </template>
                    <template #item.acciones="{ item }">
                        <v-btn color="primary" variant="text" size="small" @click="prepararEdicion(item)">Editar</v-btn>
                        <v-btn color="error" variant="text" size="small" @click="prepararEliminacion(item.id)" :disabled="!item.activo">Eliminar</v-btn>
                    </template>
                </v-data-table>
            </template>

            <template #tab-registrar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Registrar Nuevo Proveedor</v-card-title>
                    <ProveedorForm
                        :datos-iniciales="proveedorVacio"
                        :cargando="cargando"
                        texto-boton="Guardar Proveedor"
                        @submit="manejarGuardado"
                        @cancelar="cancelarEdicion"
                    />
                </v-card>
            </template>

            <template #tab-editar>
                <v-card class="pa-4" elevation="0">
                    <v-card-title class="px-0 mb-4 text-h5 font-weight-bold">Editar Proveedor</v-card-title>
                    <v-alert v-if="pestañaActiva === 'editar' && idProveedorEditar === null"
                        type="info" variant="tonal" class="mb-4">
                        Seleccione un proveedor desde la pestaña "Lista de Proveedores".
                    </v-alert>
                    <ProveedorForm
                        v-else
                        :datos-iniciales="datosFormulario"
                        :cargando="cargando"
                        texto-boton="Actualizar Proveedor"
                        @submit="manejarGuardado"
                        @cancelar="cancelarEdicion"
                    />
                </v-card>
            </template>

        </AppTabs>

        <v-dialog v-model="mostrarDialogoEliminar" max-width="500px" persistent>
            <v-card>
                <v-card-title class="text-h6 font-weight-bold text-error">Confirmar Acción</v-card-title>
                <v-card-text>¿Está seguro de que desea desactivar este proveedor?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey-darken-1" variant="text" @click="mostrarDialogoEliminar = false" :disabled="cargandoEliminacion">Cancelar</v-btn>
                    <v-btn color="error" variant="flat" @click="ejecutarEliminacion" :loading="cargandoEliminacion">Eliminar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>
```

### 9.6 Paso 6 — Registrar la ruta

Edita `apps/frontend/src/core/router.ts`:

```typescript
// Agregar en el array routes:
{
    path: '/proveedores',
    name: 'proveedores',
    component: () => import('../modules/proveedores/views/ProveedoresView.vue'),
    meta: { requiresAuth: true, hideLayout: false },
},
```

El módulo ya está funcional. También puedes agregar el enlace al menú lateral en `src/components/Menu.vue`.

---

## 10. Solución a Errores Comunes

**Error: `storeToRefs` no está disponible o los valores no son reactivos**

Asegúrate de importar desde `pinia` y no desde `vue`:
```typescript
import { storeToRefs } from 'pinia'   // Correcto
```
Si desestructuras directamente (`const { plantas } = plantaStore`), perderás la reactividad. Siempre usa `storeToRefs` para el estado y accede directamente al store para los métodos.

---

**Error: `Cannot read properties of null (reading 'validate')` en el formulario**

El `formRef` es `null` porque el elemento `<v-form ref="formRef">` no está en el DOM cuando se llama `validate()`. Verifica que el `v-form` no esté condicionado por un `v-if` que lo desmonte.

Si el formulario usa `v-else` (como en la pestaña editar), agregar una verificación:
```typescript
if (!formRef.value) return   // Ya está en el código, verificar que no se saltó
```

---

**Error: Los datos del formulario no se actualizan al cambiar de elemento para editar**

El `watch` sobre `props.datosIniciales` en el componente formulario necesita `{ deep: true }` para detectar cambios en objetos anidados:
```typescript
watch(() => props.datosIniciales, (nuevosDatos) => {
    formulario.value = { ...nuevosDatos }
}, { deep: true })   // ← Obligatorio para objetos
```

---

**Error: La petición llega al backend sin el token de Authorization**

La instancia `api` toma el token de `authStore.accessToken` en el momento de la petición. Si el token es `null`, es porque el usuario no ha iniciado sesión o el token expiró y el refresh falló. Verifica en las DevTools de Vue que `authStore.accessToken` no sea `null`.

---

**Error: `AxiosError` no captura el mensaje del backend**

El mensaje del backend está en `err.response?.data?.message`. Si `err.response` es `undefined`, es un error de red (el backend no respondió). Si `err.response.data.message` es `undefined`, el backend no está siguiendo el formato `ResponseDTO`. Verifica la respuesta en la pestaña Network de las DevTools del navegador.

---

**El `v-data-table` muestra columnas vacías aunque los datos existan**

El campo `key` en los headers debe coincidir exactamente con el nombre de la propiedad en los objetos del array. Si el backend retorna `creadoEn` pero el header tiene `key: 'creado_en'`, la columna estará vacía. Verifica la respuesta real del backend en Network.

---

**Al navegar a una ruta protegida directamente (recargar la página), redirige al login**

Esto es correcto si el refresh token también falló (cookie expirada o inválida). Si el refresh debería funcionar, verifica que:
1. La cookie `refreshToken` se esté enviando (el navegador debe tener `withCredentials: true` y el backend debe tener `credentials: true` en CORS).
2. El endpoint `/auth/refresh` en el backend esté funcionando correctamente.
