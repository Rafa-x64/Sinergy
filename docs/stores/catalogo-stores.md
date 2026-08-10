# Catálogo de Stores Pinia — Sinergy

Este manual documenta técnicamente todos los stores de estado global reactivo construidos con Pinia y Composition API (`defineStore`), ubicados en `apps/frontend/src/modules/<modulo>/<modulo>.store.ts`.

---

## Tabla de Contenidos

- [1. Estándar de Construcción de Stores](#1-estándar-de-construcción-de-stores)
- [2. Store `auth.store.ts`](#2-store-authstorets)
- [3. Store `plantas.store.ts`](#3-store-plantasstorets)
- [4. Store `ubicaciones.store.ts`](#4-store-ubicacionesstorets)
- [5. Store `lineas.store.ts`](#5-store-lineasstorets)
- [6. Store `equipo.store.ts`](#6-store-equipostorets)
- [7. Store `mantenimiento.store.ts`](#7-store-mantenimientostorets)
- [8. Guía de Consumo Reactivo con `storeToRefs`](#8-guía-de-consumo-reactivo-con-storetorefs)

---

## 1. Estándar de Construcción de Stores

Todos los stores del sistema Sinergy siguen de forma estricta las siguientes convenciones:
1. **Sintaxis**: Composition API `defineStore('nombre', () => { ... })`.
2. **Uso de Axios**: Peticiones HTTP ejecutadas mediante la instancia centralizada `api` importada de `@/core/api`.
3. **Contrato de Respuesta**: Todas las acciones asíncronas retornan una promesa de `RespuestaApi<T>`.
4. **Manejo de Errores**: Todo `catch` convierte excepciones de red o HTTP en `{ status: 'error', message: err.response?.data?.message }` tipado con `AxiosError<RespuestaApi>`.
5. **DTOs Exportados**: Las interfaces TypeScript de las entidades se definen al inicio del archivo del store y se exportan para ser usadas por componentes y vistas.

---

## 2. Store `auth.store.ts`

- **Ubicación**: `apps/frontend/src/modules/auth/auth.store.ts`
- **Estado Reactivo**:
  - `accessToken`: `ref<string | null>(null)` — Token JWT en memoria.
  - `usuario`: `ref<Usuario | null>(null)` — Payload del usuario autenticado.
- **Acciones Clave**:
  - `login(credenciales)`: Autentica al usuario, guarda el Access Token y establece la sesión.
  - `refrescarToken()`: Consume la cookie HttpOnly en `/auth/refresh` para restaurar la sesión al recargar la página.
  - `logout()`: Invalida la sesión local y remueve el token.

---

## 3. Store `plantas.store.ts`

- **Ubicación**: `apps/frontend/src/modules/plantas/plantas.store.ts`
- **Estado Reactivo**:
  - `plantas`: `ref<Planta[]>([])` — Array de plantas cargadas.
- **DTOs Exportados**: `RegistrarPlantaDTO`, `EditarPlantaDTO`, `Planta`.
- **Acciones Clave**:
  - `listarPlantas()`: GET `/plantas/listar`.
  - `registrarPlanta(dto)`: POST `/plantas/crear`.
  - `editarPlanta(id, dto)`: PATCH `/plantas/editar/:id`.
  - `eliminarPlanta(id)`: DELETE `/plantas/eliminar/:id` (Soft delete).

```typescript
// Ejemplo de acción en plantas.store.ts con comentarios explicativos
async function listarPlantas(): Promise<RespuestaApi<Planta[]>> {
    try {
        // Petición HTTP usando la instancia api centralizada
        const { data } = await api.get<RespuestaApi<Planta[]>>('/plantas/listar')

        if (data.status === 'ok' && data.data) {
            plantas.value = data.data // Actualización del ref reactivo
        }

        return data
    } catch (error: unknown) {
        const err = error as AxiosError<RespuestaApi>
        return {
            status: 'error',
            message: err.response?.data?.message ?? 'Error de red al listar plantas'
        }
    }
}
```

---

## 4. Store `ubicaciones.store.ts`

- **Ubicación**: `apps/frontend/src/modules/ubicaciones/ubicaciones.store.ts`
- **Estado Reactivo**: `ubicaciones`: `ref<Ubicacion[]>([])`.
- **DTOs Exportados**: `RegistrarUbicacionDTO`, `Ubicacion`.
- **Acciones**: `listarUbicaciones()`, `registrarUbicacion()`, `editarUbicacion()`, `eliminarUbicacion()`.

---

## 5. Store `lineas.store.ts`

- **Ubicación**: `apps/frontend/src/modules/lineas/lineas.store.ts`
- **Estado Reactivo**: `lineas`: `ref<Linea[]>([])`.
- **Acciones**: `listarLineas()`, `registrarLinea()`, `editarLinea()`, `eliminarLinea()`.

---

## 6. Store `equipo.store.ts`

- **Ubicación**: `apps/frontend/src/modules/equipo/equipo.store.ts`
- **Estado Reactivo**: `equipos`: `ref<Equipo[]>([])`, `tiposEquipo`: `ref<TipoEquipo[]>([])`.
- **DTOs Exportados**: `Equipo`, `TipoEquipo`, `RegistrarEquipoDTO`, `RegistrarTipoEquipoDTO`, `EstadoOperativo`.
- **Acciones de Equipos**: `listarEquipos()`, `registrarEquipo()`, `editarEquipo()`, `eliminarEquipo()`.
- **Acciones de Tipos de Equipo**: `listarTiposEquipo()`, `registrarTipoEquipo()`, `editarTipoEquipo()`, `eliminarTipoEquipo()`.
- **Patrón Reactivo**: Cada acción de mutación invoca automáticamente la recarga (`listarEquipos()` / `listarTiposEquipo()`), garantizando que la UI se actualice en tiempo real sin recargar la página.


---

## 7. Store `mantenimiento.store.ts`

- **Ubicación**: `apps/frontend/src/modules/mantenimiento/mantenimiento.store.ts`
- **Estado Reactivo**: `ordenes`: `ref<OrdenMantenimiento[]>([])`, `inspecciones`: `ref<Inspeccion[]>([])`.
- **Acciones**: `listarOrdenes()`, `crearOrden()`, `completarOrden()`, `registrarInspeccion()`.

---

## 8. Guía de Consumo Reactivo con `storeToRefs`

Para evitar la pérdida accidental de reactividad en Vue 3 al desestructurar un store en una vista o componente:

```typescript
import { storeToRefs } from 'pinia'
import { usePlantasStore } from '../plantas.store'

const plantaStore = usePlantasStore()

// CORRECTO: Usar storeToRefs únicamente para las propiedades de estado reactivo
const { plantas } = storeToRefs(plantaStore)

// CORRECTO: Invocar las acciones directamente desde el objeto store
await plantaStore.listarPlantas()
```
