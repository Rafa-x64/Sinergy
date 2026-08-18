# Mapa Integrado de Módulos (Backend & Frontend) — Sinergy

Este documento presenta la matriz completa de trazabilidad entre los **Módulos Backend** (Express + Prisma) y los **Módulos Frontend** (Vue 3 + Pinia + Vuetify 3).

---

## Tabla de Contenidos

- [1. Visión General de Dominios](#1-visión-general-de-dominios)
- [2. Matriz de Trazabilidad End-to-End](#2-matriz-de-trazabilidad-end-to-end)
- [3. Descripción por Módulo](#3-descripción-por-módulo)
  - [3.1 Módulo `auth`](#31-módulo-auth)
  - [3.2 Módulo `roles` y `usuarios`](#32-módulo-roles-y-usuarios)
  - [3.3 Módulo `plantas`](#33-módulo-plantas)
  - [3.4 Módulo `ubicaciones`](#34-módulo-ubicaciones)
  - [3.5 Módulo `lineas`](#35-módulo-lineas)
  - [3.6 Módulo `equipo`](#36-módulo-equipo)
  - [3.7 Módulo `componentes`](#37-módulo-componentes)
  - [3.8 Módulo `mantenimiento`](#38-módulo-mantenimiento)
  - [3.9 Módulo `variables-criticas`](#39-módulo-variables-criticas)
  - [3.10 Módulo `inspecciones`](#310-módulo-inspecciones)

---

## 1. Visión General de Dominios

El sistema Sinergy está dividido en 8 dominios funcionales. Cada dominio es autocontenido en el backend (`apps/backend/src/modules/<dominio>/`) y en el frontend (`apps/frontend/src/modules/<dominio>/`).

---

## 2. Matriz de Trazabilidad End-to-End

| Dominio | Modelo Prisma | Endpoints Backend | Store Pinia | Vista Frontend |
|---|---|---|---|---|
| **Auth** | `Usuario`, `RefreshToken` | `/api/auth/*` | `useAuthStore` | `LoginView.vue` |
| **Roles** | `Rol`, `UsuarioRol` | `/api/roles/*` | Inyectado en `authStore` | Integrado en Admin |
| **Plantas** | `Planta` | `/api/plantas/*` | `usePlantasStore` | `PlantasView.vue` |
| **Ubicaciones**| `Ubicacion` | `/api/ubicaciones/*` | `useUbicacionesStore` | `UbicacionesView.vue` |
| **Líneas** | `Linea` | `/api/lineas/*` | `useLineasStore` | `LineasView.vue` |
| **Equipo** | `Equipo`, `TipoEquipo` | `/api/equipos/*` | `useEquipoStore` | `EquipoView.vue` |
| **Componentes**| `Componente` | `/api/componentes/*` | Integrado en `equipoStore` | Integrado en `EquipoView` |
| **Variables Críticas** | `Variable`, `OpcionSeleccion` | `/api/variables-criticas/*` | Pendiente frontend | Pendiente frontend |
| **Inspecciones** | `Inspeccion`, `InspeccionDetalle`, `InspeccionAdjunto` | `/api/inspecciones/*` | Pendiente frontend | Pendiente frontend |
| **Mantenimiento**| `OrdenMantenimiento` | `/api/mantenimiento/*` | `useMantenimientoStore` | `MantenimientoView.vue` |

---

## 3. Descripción por Módulo

### 3.1 Módulo `auth`
- **Backend**: `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.schemas.ts`.
- **Frontend**: `auth.store.ts`, `LoginView.vue`.
- **Flujo**: Gestiona el login mediante credenciales, emite Access Token corto en memoria y Refresh Token HttpOnly Cookie.

### 3.2 Módulo `roles` y `usuarios`
- **Backend**: `roles.routes.ts`, `roles.controller.ts`, `roles.service.ts`.
- **Flujo**: Control de acceso basado en roles (`TECNICO`, `SUPERVISOR`, `ADMIN`).

### 3.3 Módulo `plantas`
- **Backend**: `planta.routes.ts`, `planta.controller.ts`, `planta.service.ts`, `planta.schemas.ts`.
- **Frontend**: `plantas.store.ts`, `validations/registro.ts`, `PlantaForm.vue`, `PlantasView.vue`.
- **Flujo**: Gestión del catálogo de plantas de producción (Extrusión, Inyección, Mezcla).

### 3.4 Módulo `ubicaciones`
- **Backend**: `ubicacion.routes.ts`, `ubicacion.controller.ts`, `ubicacion.service.ts`, `ubicacion.schemas.ts`.
- **Frontend**: `ubicaciones.store.ts`, `UbicacionForm.vue`, `UbicacionesView.vue`.

### 3.5 Módulo `lineas`
- **Backend**: `linea.routes.ts`, `linea.controller.ts`, `linea.service.ts`, `linea.schemas.ts`.
- **Frontend**: `lineas.store.ts`, `LineasView.vue`.

### 3.6 Módulo `equipo`
- **Backend**: `equipo.routes.ts`, `equipo.controller.ts`, `equipo.service.ts`, `equipo.schemas.ts`.
- **Frontend**: `equipo.store.ts`, `EquipoForm.vue`, `EquipoView.vue`.

### 3.7 Módulo `componentes`
- **Backend**: `componente.routes.ts`, `componente.controller.ts`, `componente.service.ts`.
- **Flujo**: Partes y piezas constitutivas de cada equipo técnico. El borrado es lógico (`activo = false`).

### 3.8 Módulo `mantenimiento`
- **Backend**: `mantenimiento.routes.ts`, `mantenimiento.controller.ts`, `mantenimiento.service.ts`.
- **Frontend**: `mantenimiento.store.ts`, `MantenimientoView.vue`.
- **Flujo**: Gestión de órdenes de trabajo técnicas.

### 3.9 Módulo `variables-criticas`
- **Backend**: `variable-critica.routes.ts`, `variable-critica.controller.ts`, `variable-critica.service.ts`, `variable-critica.schemas.ts`.
- **Ruta base**: `/api/variables-criticas/`
- **Frontend**: Pendiente de desarrollo (se consumirá desde el store de inspecciones).
- **Flujo**: Gestiona el catálogo de variables evaluables (`Variable`) vinculadas a componentes de equipos. Soporta los tipos de evaluación `NUMERICO_ENTERO`, `NUMERICO_DECIMAL`, `TEMPERATURA` y `SELECCION`. El borrado es lógico (`activa = false`) para preservar el historial en `InspeccionDetalle`.
- **Relaciones Prisma**: `Componente` → `Variable` → `OpcionSeleccion`, `InspeccionDetalle`.

### 3.10 Módulo `inspecciones`
- **Backend**: `inspeccion.routes.ts`, `inspeccion.controller.ts`, `inspeccion.service.ts`, `inspeccion.schemas.ts`.
- **Ruta base**: `/api/inspecciones/`
- **Frontend**: `inspecciones.store.ts`, `types/inspeccion.types.ts`, `components/`, `InspeccionesView.vue`, `CapturaInspeccionView.vue`.
- **Flujo**: Registro y gestión de inspecciones técnicas de campo por línea completa (agrupando todos los equipos de la línea) o por equipo individual. La creación es transaccional atómica (inspección + N detalles en una sola operación). Los campos de tipo `BigInt` (`id`, `inspeccionId`, `detalleId`) se serializan como strings en todas las respuestas JSON.
- **Relaciones Prisma**: `Linea` / `Equipo` → `Inspeccion` → `InspeccionDetalle` → `InspeccionAdjunto`.
- **Flujo de estados**: `BORRADOR` → `PENDIENTE` → `APROBADO` | `RECHAZADO`.
- **Endpoints clave**: 
  - `GET /arbol-linea/:lineaId` — sirve la jerarquía completa de la línea lista para la captura en frontend.
  - `POST /crear` — registra inspección por línea o equipo con sus detalles.
  - `PATCH /editar-estado/:id` — permite avanzar el flujo de revisión y aprobación registrando `revisadoPorId` y `aprobadoPorId` del usuario responsable.
