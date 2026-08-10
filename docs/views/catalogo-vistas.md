# Catálogo de Vistas SPA — Sinergy

Este manual documenta todas las vistas (componentes de página) de la Single Page Application (SPA) de Sinergy, ubicadas en `apps/frontend/src/modules/<modulo>/views/` y `apps/frontend/src/views/`.

---

## Tabla de Contenidos

- [1. Mapa General de Vistas](#1-mapa-general-de-vistas)
- [2. Vista `LoginView.vue`](#2-vista-loginviewvue)
- [3. Vista `DashboardView.vue`](#3-vista-dashboardviewvue)
- [4. Vista `PlantasView.vue`](#4-vista-plantasviewvue)
- [5. Vista `UbicacionesView.vue`](#5-vista-ubicacionesviewvue)
- [6. Vista `LineasView.vue`](#6-vista-lineasviewvue)
- [7. Vista `EquipoView.vue`](#7-vista-equipoviewvue)
- [8. Vista `MantenimientoView.vue`](#8-vista-mantenimientoviewvue)
- [9. Vista `NotFoundView.vue` (404)](#9-vista-notfoundviewvue-404)

---

## 1. Mapa General de Vistas

| Vista | Ruta | Autenticación (`meta`) | Layout | Propósito |
|---|---|---|---|---|
| `LoginView.vue` | `/login` | Pública (`requiresAuth: false`) | Sin Menú (`hideLayout: true`) | Inicio de sesión mediante usuario y contraseña |
| `DashboardView.vue` | `/dashboard` | Privada (`requiresAuth: true`) | Con Menú Lateral | Muestra métricas de estado operativo e indicadores |
| `PlantasView.vue` | `/plantas` | Privada (`requiresAuth: true`) | Con Menú Lateral | Catálogo de plantas industriales (CRUD + Soft Delete) |
| `UbicacionesView.vue` | `/ubicaciones` | Privada (`requiresAuth: true`) | Con Menú Lateral | Gestión de ubicaciones técnicas vinculadas a plantas |
| `LineasView.vue` | `/lineas` | Privada (`requiresAuth: true`) | Con Menú Lateral | Administración de líneas de producción por ubicación |
| `EquipoView.vue` | `/equipo` | Privada (`requiresAuth: true`) | Con Menú Lateral | Catálogo de activos/equipos y tipos de equipo |
| `MantenimientoView.vue` | `/mantenimiento` | Privada (`requiresAuth: true`) | Con Menú Lateral | Órdenes de trabajo, inspecciones e historial técnico |
| `NotFoundView.vue` | `/:pathMatch(.*)*` | Pública (`requiresAuth: false`) | Sin Menú (`hideLayout: true`) | Pantalla 404 para rutas inexistentes |

---

## 2. Vista `LoginView.vue`

- **Ubicación**: `apps/frontend/src/modules/auth/views/LoginView.vue`
- **Store Consumido**: `useAuthStore` (`auth.store.ts`)
- **Comportamiento**:
  - Renderiza el formulario de credenciales (`usuario` y `password`).
  - Llama a `authStore.login(credenciales)`.
  - Si la autenticación es exitosa, almacena el Access Token en memoria y redirige a `/dashboard`.

---

## 3. Vista `DashboardView.vue`

- **Ubicación**: `apps/frontend/src/modules/dashboard/views/DashboardView.vue`
- **Comportamiento**:
  - Muestra tarjetas resumen con totales de equipos, inspecciones activas y plantas operativas.
  - Diseñada responsive para visualización en computadoras y tabletas de supervisores.

---

## 4. Vista `PlantasView.vue`

- **Ubicación**: `apps/frontend/src/modules/plantas/views/PlantasView.vue`
- **Store Consumido**: `usePlantasStore` (`plantas.store.ts`)
- **Componentes Incrustados**: `AppTabs.vue`, `PlantaForm.vue`
- **Estructura y Pestañas**:
  1. `tab-lista`: Tabla `<v-data-table>` con columnas `codigo`, `nombre`, `activa` y botones de acción.
  2. `tab-registrar`: Formulario para registrar una nueva planta.
  3. `tab-editar`: Formulario precargado para modificar una planta existente.

```vue
<!-- Patron de inicialización inmediata de datos en PlantasView.vue -->
<script setup lang="ts">
import { usePlantasStore } from '../plantas.store'
import { useToast } from 'vue-toastification'

const toast = useToast()
const plantaStore = usePlantasStore()

// Carga directa en el setup sin esperar a onMounted
const inicializarDatos = async () => {
    const res = await plantaStore.listarPlantas()
    if (res.status === 'error') toast.error(res.message ?? 'Error al listar plantas')
}
inicializarDatos()
</script>
```

---

## 5. Vista `UbicacionesView.vue`

- **Ubicación**: `apps/frontend/src/modules/ubicaciones/views/UbicacionesView.vue`
- **Store Consumido**: `useUbicacionesStore`, `usePlantasStore`
- **Componentes Incrustados**: `AppTabs.vue`, `UbicacionForm.vue`
- **Propósito**: Administrar las ubicaciones dentro de cada planta. Incluye selectores reactivos para asociar una ubicación a su planta padre.

---

## 6. Vista `LineasView.vue`

- **Ubicación**: `apps/frontend/src/modules/lineas/views/LineasView.vue`
- **Store Consumido**: `useLineasStore`, `useUbicacionesStore`
- **Propósito**: Gestionar las líneas operativas (ej: Línea de Extrusión 1, Línea de Inyección 2) asignadas a ubicaciones técnicas.

---

## 7. Vista `EquipoView.vue`

- **Ubicación**: `apps/frontend/src/modules/equipo/views/EquipoView.vue`
- **Store Consumido**: `useEquipoStore`
- **Componentes Incrustados**: `AppTabs.vue`, `EquipoForm.vue`
- **Propósito**: Catálogo principal de activos industriales. Permite filtrar equipos por planta/línea, gestionar tipos de equipo y consultar el estado operativo.

---

## 8. Vista `MantenimientoView.vue`

- **Ubicación**: `apps/frontend/src/modules/mantenimiento/views/MantenimientoView.vue`
- **Store Consumido**: `useMantenimientoStore`
- **Propósito**: Registro de órdenes de mantenimiento preventivo y correctivo, captura de métricas por técnicos y supervisión de tareas pendientes.

---

## 9. Vista `NotFoundView.vue` (404)

- **Ubicación**: `apps/frontend/src/views/NotFoundView.vue`
- **Propósito**: Captura cualquier ruta no registrada en Vue Router y ofrece un botón de retorno seguro al Dashboard o Login.
