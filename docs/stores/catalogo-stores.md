# Catálogo de Stores Pinia — Sinergy

Este manual documenta técnicamente todos los stores de estado global reactivo construidos con Pinia y Composition API (`defineStore`), ubicados en `apps/frontend/src/modules/<modulo>/<modulo>.store.ts`.

---

## Tabla de Contenidos

- [1. Estándar de Construcción de Stores](#1-estándar-de-construcción-de-stores)
- [2. Store `auth.store.ts`](#2-store-authstorets)
- [3. Store `usuarios.store.ts`](#3-store-usuariosstorets)
- [4. Store `plantas.store.ts`](#4-store-plantasstorets)
- [5. Store `ubicaciones.store.ts`](#5-store-ubicacionesstorets)
- [6. Store `lineas.store.ts`](#6-store-lineasstorets)
- [7. Store `equipo.store.ts`](#7-store-equipostorets)
- [8. Store `componente.store.ts`](#8-store-componentestorets)
- [9. Store `variables.store.ts`](#9-store-variablesstorets)
- [10. Store `inspecciones.store.ts`](#10-store-inspeccionesstorets)
- [11. Store `notificaciones.store.ts`](#11-store-notificacionesstorets)
- [12. Guía de Consumo Reactivo con `storeToRefs`](#12-guía-de-consumo-reactivo-con-storetorefs)

---

## 1. Estándar de Construcción de Stores

Todos los stores del sistema Sinergy siguen de forma estricta las siguientes convenciones:
1. **Sintaxis**: Composition API `defineStore('nombre', () => { ... })`.
2. **Consumo HTTP**: Peticiones ejecutadas mediante `apiFetch` (de `useAuthStore`) o la instancia `api` de `@/core/api`, inyectando Bearer tokens y credenciales HttpOnly.
3. **Contrato de Respuesta**: Todas las acciones asíncronas retornan una promesa de `RespuestaApi<T>`.
4. **Manejo de Errores**: Todo bloque `catch` procesa errores estructurados retornando `{ status: 'error', message }`.
5. **DTOs Exportados**: Las interfaces TypeScript de las entidades se definen al inicio del archivo del store y se exportan para ser usadas por componentes y vistas.

---

## 2. Store `auth.store.ts`

- **Ubicación**: `apps/frontend/src/modules/auth/auth.store.ts`
- **Estado Reactivo**:
  - `accessToken`: `ref<string | null>(null)` — Token JWT en memoria.
  - `usuario`: `ref<Usuario | null>(null)` — Payload del usuario autenticado (id, nombre, email, roles, plantaId).
- **Getters Computados**:
  - `estaAutenticado`: `computed<boolean>`
  - `rolesUsuario`: `computed<string[]>`
  - `tieneRol`: `(rol: string) => boolean`
  - `esAdmin`: `computed<boolean>`
- **Acciones Clave**:
  - `login(credenciales)`: Autentica al usuario, guarda el Access Token y establece la sesión.
  - `refrescarToken()`: Consume la cookie HttpOnly en `/auth/refresh` para restaurar la sesión de forma transparente.
  - `logout()`: Invalida la sesión local y remueve el token en memoria y la cookie.
  - `apiFetch(endpoint, options)`: Wrapper nativo de fetch configurado con Bearer token y cabeceras base.

---

## 3. Store `usuarios.store.ts`

- **Ubicación**: `apps/frontend/src/modules/usuarios/usuarios.store.ts`
- **Estado Reactivo**:
  - `usuarios`: `ref<UsuarioItem[]>([])` — Lista de usuarios registrados.
  - `rolesDisponibles`: `ref<RolItem[]>([])` — Catálogo de roles del sistema.
  - `cargando`: `ref<boolean>(false)`
- **DTOs Exportados**: `UsuarioItem`, `RolItem`, `CrearUsuarioPayload`, `ActualizarUsuarioPayload`.
- **Acciones**:
  - `obtenerUsuarios()`: GET `/auth/usuarios`
  - `obtenerRoles()`: GET `/roles`
  - `crearUsuario(payload)`: POST `/auth/crear-usuario`
  - `actualizarUsuario(id, payload)`: PATCH `/auth/usuarios/:id`
  - `asignarRoles(usuarioId, rolesIds)`: POST `/auth/roles/asignar`

---

## 4. Store `plantas.store.ts`

- **Ubicación**: `apps/frontend/src/modules/plantas/plantas.store.ts`
- **Estado Reactivo**: `plantas`: `ref<Planta[]>([])`.
- **DTOs Exportados**: `RegistrarPlantaDTO`, `EditarPlantaDTO`, `Planta`.
- **Acciones Clave**: `listarPlantas()`, `registrarPlanta()`, `editarPlanta()`, `eliminarPlanta()`.

---

## 5. Store `ubicaciones.store.ts`

- **Ubicación**: `apps/frontend/src/modules/ubicaciones/ubicacion.store.ts`
- **Estado Reactivo**: `ubicaciones`: `ref<Ubicacion[]>([])`.
- **DTOs Exportados**: `RegistrarUbicacionDTO`, `Ubicacion`.
- **Acciones**: `listarUbicaciones()`, `registrarUbicacion()`, `editarUbicacion()`, `eliminarUbicacion()`.

---

## 6. Store `lineas.store.ts`

- **Ubicación**: `apps/frontend/src/modules/lineas/lineas.store.ts`
- **Estado Reactivo**: `lineas`: `ref<Linea[]>([])`.
- **Acciones**: `listarLineas()`, `registrarLinea()`, `editarLinea()`, `eliminarLinea()`.

---

## 7. Store `equipo.store.ts`

- **Ubicación**: `apps/frontend/src/modules/equipo/equipo.store.ts`
- **Estado Reactivo**: `equipos`: `ref<Equipo[]>([])`, `tiposEquipo`: `ref<TipoEquipo[]>([])`.
- **DTOs Exportados**: `Equipo`, `TipoEquipo`, `RegistrarEquipoDTO`, `RegistrarTipoEquipoDTO`, `EstadoOperativo`.
- **Acciones de Equipos**: `listarEquipos()`, `registrarEquipo()`, `editarEquipo()`, `eliminarEquipo()`.
- **Acciones de Tipos de Equipo**: `listarTiposEquipo()`, `registrarTipoEquipo()`, `editarTipoEquipo()`, `eliminarTipoEquipo()`.

---

## 8. Store `componente.store.ts`

- **Ubicación**: `apps/frontend/src/modules/componentes/componente.store.ts`
- **Estado Reactivo**: `componentes`: `ref<Componente[]>([])`.
- **Acciones**: `listarComponentes(equipoId?)`, `crearComponente()`, `actualizarComponente()`, `eliminarComponente()`.

---

## 9. Store `variables.store.ts`

- **Ubicación**: `apps/frontend/src/modules/variables/variables.store.ts`
- **Estado Reactivo**:
  - `arbolJerarquico`: `ref<PlantaJerarquia[]>` — Estructura en árbol (Planta → Ubicación → Equipo → Componentes).
  - `plantillasPorTipo`: `ref<Record<number, PlantillaVariable[]>>` — Cache de plantillas por tipo de equipo.
  - `variablesComponente`: `ref<VariableComponente[]>` — Variables asignadas al componente seleccionado.
  - `cargando`: `ref<boolean>`
- **Acciones**:
  - `cargarArbolJerarquico()`: GET `/variables-criticas/arbol`
  - `cargarPlantillasPorTipo(tipoEquipoId)`: GET `/variables-criticas/plantillas/tipo/:tipoEquipoId`
  - `crearPlantilla(dto)` / `editarPlantilla(id, dto)` / `eliminarPlantilla(id)`
  - `sincronizarTipoEquipo(tipoEquipoId)` / `sincronizarComponente(componenteId)`
  - `crearVariable(dto)` / `editarVariable(id, dto)` / `eliminarVariable(id)`

---

## 10. Store `inspecciones.store.ts`

- **Ubicación**: `apps/frontend/src/modules/inspecciones/inspecciones.store.ts`
- **Estado Reactivo**:
  - `inspecciones`: `ref<InspeccionResumen[]>` — Lista histórica de inspecciones.
  - `inspeccionActiva`: `ref<InspeccionDetallada | null>`
  - `borradorLocal`: `ref<BorradorInspeccion | null>`
  - `estadisticas`: `ref<EstadisticasSupervision | null>`
- **Acciones**:
  - `cargarInspecciones(filtros)`: GET `/inspecciones`
  - `cargarArbolLinea(lineaId)` / `cargarEquiposOperativos(plantaId)`
  - `crearInspeccion(dto)`: POST `/inspecciones/crear`
  - `cambiarEstadoInspeccion(id, estado, observaciones)`: PATCH `/inspecciones/editar-estado/:id`
  - `guardarBorrador(datos)` / `recuperarBorrador()` / `limpiarBorrador()`

---

## 11. Store `notificaciones.store.ts`

- **Ubicación**: `apps/frontend/src/modules/notificaciones/notificaciones.store.ts`
- **Estado Reactivo**:
  - `notificaciones`: `ref<Notificacion[]>`
  - `noLeidasCount`: `computed<number>`
  - `conectado`: `ref<boolean>`
- **Acciones**:
  - `inicializarSocket()`: Conecta cliente WebSocket a Socket.io.
  - `marcarComoLeida(id)` / `marcarTodasComoLeidas()`
  - `obtenerHistorial()`

---

## 12. Guía de Consumo Reactivo con `storeToRefs`

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
