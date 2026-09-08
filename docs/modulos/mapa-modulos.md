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

El sistema Sinergy está dividido en 9 dominios funcionales. Cada dominio es autocontenido en el backend (`apps/backend/src/modules/<dominio>/`) y en el frontend (`apps/frontend/src/modules/<dominio>/`).

---

## 2. Matriz de Trazabilidad End-to-End

| Dominio | Modelo Prisma | Endpoints Backend | Store Pinia | Vista / Componente Frontend |
|---|---|---|---|---|
| **Auth** | `Usuario`, `RefreshToken` | `/api/auth/*` | `useAuthStore` | `LoginView.vue`, `Menu.vue` |
| **Usuarios** | `Usuario`, `Rol`, `UsuarioRol` | `/api/auth/*`, `/api/roles/*` | `useUsuariosStore`, `useRolesStore` | `UsuariosView.vue`, `FormularioUsuario.vue` |
| **Plantas** | `Planta` | `/api/plantas/*` | `usePlantasStore` | `PlantasView.vue`, `PlantaForm.vue` |
| **Ubicaciones**| `Ubicacion` | `/api/ubicaciones/*` | `useUbicacionesStore` | `UbicacionesView.vue`, `FormularioUbicacion.vue` |
| **Líneas** | `Linea` | `/api/lineas/*` | `useLineasStore` | `LineasView.vue` |
| **Equipo** | `Equipo`, `TipoEquipo` | `/api/equipos/*` | `useEquipoStore` | `EquipoView.vue`, `EquiposPorTipoView.vue` |
| **Componentes**| `Componente` | `/api/componentes/*` | `useComponenteStore` | `ComponentesView.vue`, integrado en `JerarquiaTreeView` |
| **Variables Críticas** | `PlantillaVariable`, `PlantillaOpcionSeleccion`, `Variable`, `OpcionSeleccion` | `/api/variables-criticas/*` | `useVariablesStore` | `VariablesCriticasView.vue`, `JerarquiaTreeView.vue`, `PlantillasVariablesPanel.vue`, `DetalleVariablesPanel.vue`, `DialogoPlantillaVariable.vue` |
| **Inspecciones** | `Inspeccion`, `InspeccionDetalle`, `InspeccionAdjunto` | `/api/inspecciones/*` | `useInspeccionesStore` | `InspeccionesView.vue`, `FormWizardInspeccion.vue`, `WizardSeleccionAlcance.vue`, `BandejaSupervisionPanel.vue`, `DetalleInspeccionModal.vue` |
| **Notificaciones** | `Notificacion` | `/api/notificaciones/*`, WebSocket Socket.io | `useNotificationStore` | `NotificationBell.vue`, `NotificacionesGlobalesView.vue` |
| **Dashboard & Reportes** | `Equipo`, `Inspeccion`, `Planta` | `/api/dashboard/*` | `useDashboardStore` | `DashboardView.vue`, `PanelReportes.vue` (R1 a R6) |
| **Lubricación (Planificación)** | `PuntoLubricacion`, `CatalogoLubricante`, `HistorialHorometro`, `RutinaLubricacion` | `/api/lubricacion/*` | `useLubricacionStore` | `MatrizLubricacionView.vue`, `ReportesLubricacionView.vue` |

---

## 3. Descripción por Módulo

### 3.1 Módulo `auth`
- **Backend**: `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.schemas.ts`.
- **Frontend**: `auth.store.ts`, `LoginView.vue`.
- **Flujo**: Gestiona el login mediante credenciales, emite Access Token corto en memoria y Refresh Token HttpOnly Cookie. Inyecta `plantaId` y `roles` en el payload JWT.

### 3.2 Módulo `usuarios` y `roles`
- **Backend**: `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `roles.routes.ts`.
- **Frontend**: `usuarios.store.ts`, `roles.store.ts`, `UsuariosView.vue`, `FormularioUsuario.vue`.
- **Flujo**: Gestión completa de usuarios (creación, edición de nombre, correo, contraseña, asignación a planta y asignación múltiple de roles como `ADMINISTRADOR`, `SUPERVISOR`, `TECNICO`).

### 3.3 Módulo `plantas`
- **Backend**: `planta.routes.ts`, `planta.controller.ts`, `planta.service.ts`, `planta.schemas.ts`.
- **Frontend**: `plantas.store.ts`, `validations/registro.ts`, `PlantaForm.vue`, `PlantasView.vue`.
- **Flujo**: Gestión del catálogo de plantas de producción (Extrusión, Inyección, Mezcla). Filtrado de visibilidad por PBAC.

### 3.4 Módulo `ubicaciones`
- **Backend**: `ubicacion.routes.ts`, `ubicacion.controller.ts`, `ubicacion.service.ts`, `ubicacion.schemas.ts`.
- **Frontend**: `ubicacion.store.ts`, `FormularioUbicacion.vue`, `UbicacionesView.vue`.

### 3.5 Módulo `lineas`
- **Backend**: `linea.routes.ts`, `linea.controller.ts`, `linea.service.ts`, `linea.schemas.ts`.
- **Frontend**: `lineas.store.ts`, `LineasView.vue`.

### 3.6 Módulo `equipo`
- **Backend**: `equipo.routes.ts`, `equipo.controller.ts`, `equipo.service.ts`, `equipo.schemas.ts`.
- **Frontend**: `equipo.store.ts`, `EquipoForm.vue`, `FormularioTipoEquipo.vue`, `EquipoView.vue`, `EquiposPorTipoView.vue`.

### 3.7 Módulo `componentes`
- **Backend**: `componente.routes.ts`, `componente.controller.ts`, `componente.service.ts`.
- **Frontend**: `componente.store.ts`, `ComponentesView.vue`.
- **Flujo**: Partes y piezas constitutivas de cada equipo técnico. El borrado es lógico (`activo = false`).

### 3.8 Módulo `variables-criticas`
- **Backend**: `variable-critica.routes.ts`, `variable-critica.controller.ts`, `variable-critica.service.ts`, `variable-critica.schemas.ts`.
- **Ruta base**: `/api/variables-criticas/`
- **Frontend**: `variables.store.ts`, `VariablesCriticasView.vue`, `JerarquiaTreeView.vue`, `PlantillasVariablesPanel.vue`, `DetalleVariablesPanel.vue`, `DialogoPlantillaVariable.vue`.
- **Flujo**: Gestión dual de Plantillas de Variables por Tipo de Equipo e Instancias de Variables por Componente. Soporta tipos de evaluación `NUMERICO_ENTERO`, `NUMERICO_DECIMAL`, `TEMPERATURA` y `SELECCION` con opciones dinámicas. Propagación reactiva y en cascada a todos los componentes del tipo de equipo.

### 3.9 Módulo `inspecciones`
- **Backend**: `inspeccion.routes.ts`, `inspecciones.controller.ts`, `inspecciones.service.ts`, `inspecciones.schemas.ts`.
- **Ruta base**: `/api/inspecciones/`
- **Frontend**: `inspecciones.store.ts`, `InspeccionesView.vue`, `FormWizardInspeccion.vue`, `WizardSeleccionAlcance.vue`, `BandejaSupervisionPanel.vue`, `DetalleInspeccionModal.vue`, `ResumenInspeccionDialog.vue`.
- **Flujo**: Flujo técnico de captura paso a paso (Planta → Tipo → Equipo/Línea → Captura de variables con validación de rangos operativos y borrador local). Bandeja de supervisión con evaluación técnica (Aprobación/Rechazo) y trazabilidad completa.

### 3.10 Módulo `notificaciones`
- **Backend**: `notificaciones.routes.ts`, `notificaciones.controller.ts`, `notification.service.ts`, `notification.socket.ts`, `notification.events.ts`.
- **Ruta base**: `/api/notificaciones/` + WebSockets Socket.io.
- **Frontend**: `notificaciones.store.ts`, `NotificationBell.vue`, `NotificacionesGlobalesView.vue`.
- **Flujo**: Desacoplado mediante EventBus interno (`core/eventBus.ts`). Distribución en tiempo real con salas por rol (`rol_admin`, `rol_supervisor`, `rol_tecnico`) y por planta. Notificaciones dirigidas por criticidad (`ERROR`, `WARNING`, `ALERT`, `SUCCESS`) y panel global de auditoría para administradores.

### 3.11 Módulo `dashboard` y Reportes Normativos
- **Backend**: `dashboard.routes.ts`, `dashboard.controller.ts`, `dashboard.service.ts`.
- **Ruta base**: `/api/dashboard/`
- **Frontend**: `dashboard.store.ts`, `DashboardView.vue`, `PanelReportes.vue`, utilitarios de exportación `pdfExport.ts` y biblioteca `xlsx`.
- **Flujo**: Métricas operativas en tiempo real (disponibilidad, distribución de flota, ranking de fallas, productividad por técnico) y Centro de Emisión de Reportes Normativos R1 a R6 (Flota, Inspecciones, No-Conformidades, Ejecutivo Mensual, Criticidad ABC y Tarjeta de Ronda física F-MANT-04) con filtros reactivos y tolerancia a fallos mediante `Promise.allSettled`.

### 3.12 Módulo `lubricacion` y Horómetros (En Planificación)
- **Backend**: `lubricacion.routes.ts`, `lubricacion.controller.ts`, `lubricacion.service.ts`, `lubricacion.schemas.ts`.
- **Ruta base**: `/api/lubricacion/`
- **Frontend**: `lubricacion.store.ts`, `MatrizLubricacionView.vue`, `ReportesLubricacionView.vue`.
- **Flujo**: Gestión preventiva basada en uso. Control de horas acumuladas de horómetro con bloqueo anti-retroceso, cálculo dinámico de $\Delta \text{Horas}$ de vida útil de lubricante con semáforo porcentual, captura ágil mediante matriz estilo hoja de cálculo, reporte de consumos/fugas y disparadores de alertas tempranas vía WebSockets. Documentación completa en [`docs/modulos/lubricacion/README.md`](../lubricacion/README.md).

