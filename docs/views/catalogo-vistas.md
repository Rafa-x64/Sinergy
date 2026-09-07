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
- [8. Vista `EquiposPorTipoView.vue`](#8-vista-equiposportipoviewvue)
- [9. Vista `MantenimientoView.vue`](#9-vista-mantenimientoviewvue)
- [10. Vista `NotFoundView.vue` (404)](#10-vista-notfoundviewvue-404)

---

## 1. Mapa General de Vistas

| Vista | Ruta | Autenticación (`meta`) | Roles Permitidos | Layout | Propósito |
|---|---|---|---|---|---|
| `LoginView.vue` | `/login` | Pública (`requiresAuth: false`) | Todos | Sin Menú (`hideLayout: true`) | Inicio de sesión mediante usuario y contraseña |
| `DashboardView.vue` | `/dashboard` | Privada (`requiresAuth: true`) | Todos | Con Menú Lateral | Muestra métricas de estado operativo e indicadores |
| `PlantasView.vue` | `/plantas` | Privada (`requiresAuth: true`) | `ADMINISTRADOR`, `SUPERVISOR` | Con Menú Lateral | Catálogo de plantas industriales (CRUD + PBAC) |
| `UbicacionesView.vue` | `/ubicaciones` | Privada (`requiresAuth: true`) | `ADMINISTRADOR`, `SUPERVISOR` | Con Menú Lateral | Gestión de ubicaciones técnicas vinculadas a plantas |
| `LineasView.vue` | `/lineas` | Privada (`requiresAuth: true`) | `ADMINISTRADOR`, `SUPERVISOR` | Con Menú Lateral | Administración de líneas de producción por ubicación |
| `EquipoView.vue` | `/equipos` | Privada (`requiresAuth: true`) | Todos (Escritura: `ADMINISTRADOR`, `SUPERVISOR`) | Con Menú Lateral | Catálogo general de equipos y administración de Tipos de Equipo |
| `EquiposPorTipoView.vue` | `/montacargas`, `/compresor`, `/generador`, `/chiller` | Privada (`requiresAuth: true`) | Todos | Con Menú Lateral | Vista reutilizable parametrizada que filtra la maquinaria por su tipo |
| `ComponentesView.vue` | `/componentes` | Privada (`requiresAuth: true`) | Todos | Con Menú Lateral | Administración de componentes mecánicos/eléctricos de equipos |
| `VariablesCriticasView.vue` | `/variables-criticas` | Privada (`requiresAuth: true`) | `ADMINISTRADOR`, `SUPERVISOR` | Con Menú Lateral | Gestión jerárquica de variables críticas y plantillas por tipo de equipo |
| `InspeccionesView.vue` | `/inspecciones` | Privada (`requiresAuth: true`) | Todos (Técnico: captura, Supervisor: aprobación) | Con Menú Lateral | Form Wizard de captura en campo y bandeja de supervisión |
| `UsuariosView.vue` | `/usuarios` | Privada (`requiresAuth: true`) | `ADMINISTRADOR` | Con Menú Lateral | Administración de usuarios, asignación a planta y control de roles |
| `NotificacionesGlobalesView.vue` | `/notificaciones-globales` | Privada (`requiresAuth: true`) | `ADMINISTRADOR` | Con Menú Lateral | Panel de auditoría global y supervisión en tiempo real de actividades |
| `NotFoundView.vue` | `/:pathMatch(.*)*` | Pública (`requiresAuth: false`) | Todos | Sin Menú (`hideLayout: true`) | Pantalla 404 para rutas inexistentes |

---

## 2. Vista `LoginView.vue`

- **Ubicación**: `apps/frontend/src/modules/auth/views/LoginView.vue`
- **Store Consumido**: `useAuthStore` (`auth.store.ts`)
- **Comportamiento**:
  - Renderiza el formulario de credenciales (`usuario` y `password`).
  - Llama a `authStore.login(credenciales)`.
  - Si la autenticación es exitosa, almacena el Access Token en memoria y redirige a `/dashboard`.
  - Al iniciar sesión, el watcher global en `Menu.vue` conecta inmediatamente el WebSocket y descarga las notificaciones.

---

## 3. Vista `DashboardView.vue`

- **Ubicación**: `apps/frontend/src/modules/dashboard/views/DashboardView.vue`
- **Store Consumido**: `useDashboardStore` (`dashboard.store.ts`)
- **Componentes Incrustados**:
  - `PanelReportes.vue`: Centro de Emisión de Reportes Normativos (R1 a R6) con descargas en Excel y PDF estructurado:
    - **R1: Estado de Flota Completo**: Filtros reactivos por Planta Industrial (`listaPlantas`), Tipo de Maquinaria (`listaTiposEquipo`) y Estado Operativo (`OPERATIVO`, `INOPERATIVO`, `EN_MANTENIMIENTO`).
    - **R2: Inspecciones del Período**: Registro histórico con rangos de fechas y exportación.
    - **R3: Equipos Críticos / No Conformidades**: Monitoreo de variables fuera de límites normativos.
    - **R4: Resumen Ejecutivo Mensual**: Indicadores clave de disponibilidad, fallas e inoperatividad.
    - **R5: Matriz de Criticidad ABC**: Clasificación de priorización de mantenimiento preventivo.
    - **R6: Tarjeta de Ronda Física**: Formato imprimible para levantamiento en campo.
  - Tarjetas de KPIs ejecutivos de disponibilidad industrial y gráficas dinámicas.
- **Comportamiento**:
  - Diseñada responsive para visualización en computadoras de oficina y tabletas de supervisores.

---

## 4. Vista `PlantasView.vue`

- **Ubicación**: `apps/frontend/src/modules/plantas/views/PlantasView.vue`
- **Store Consumido**: `usePlantasStore` (`plantas.store.ts`)
- **Componentes Incrustados**: `AppTabs.vue`, `PlantaForm.vue`
- **Estructura y Pestañas**:
  1. `tab-lista`: Tabla `<v-data-table>` con columnas `codigo`, `nombre`, `activa` y botones de acción condicionados por rol.
  2. `tab-registrar`: Formulario para registrar una nueva planta.
  3. `tab-editar`: Formulario precargado para modificar una planta existente.

---

## 5. Vista `UbicacionesView.vue`

- **Ubicación**: `apps/frontend/src/modules/ubicaciones/views/UbicacionesView.vue`
- **Store Consumido**: `useUbicacionesStore`, `usePlantasStore`
- **Componentes Incrustados**: `AppTabs.vue`, `FormularioUbicacion.vue`
- **Propósito**: Administrar las ubicaciones dentro de cada planta. Incluye selectores reactivos para asociar una ubicación a su planta padre con aislamiento PBAC.

---

## 6. Vista `LineasView.vue`

- **Ubicación**: `apps/frontend/src/modules/lineas/views/LineasView.vue`
- **Store Consumido**: `useLineasStore`, `useUbicacionesStore`
- **Propósito**: Gestionar las líneas operativas asignadas a ubicaciones técnicas.

---

## 7. Vista `EquipoView.vue`

- **Ubicación**: `apps/frontend/src/modules/equipo/views/EquipoView.vue`
- **Store Consumido**: `useEquipoStore`
- **Componentes Incrustados**: `AppTabs.vue`, `FormularioEquipo.vue`, `FormularioTipoEquipo.vue`
- **Propósito**: Catálogo principal de activos industriales. Muestra pestañas de primer nivel para alternar entre la gestión de Equipos y la administración de Tipos de Equipo. Protege acciones de escritura con `authStore.tieneRol`.

---

## 8. Vista `EquiposPorTipoView.vue`

- **Ubicación**: `apps/frontend/src/modules/equipo/views/EquiposPorTipoView.vue`
- **Store Consumido**: `useEquipoStore`, `useLineaStore`
- **Componentes Incrustados**: `AppTabs.vue`, `FormularioEquipo.vue`
- **Propósito**: Vista reutilizable parametrizada mediante metadatos de ruta (`route.meta.tipoFiltro`). Servida en las rutas `/montacargas`, `/compresor`, `/generador` y `/chiller`.

---

## 9. Vista `VariablesCriticasView.vue`

- **Ubicación**: `apps/frontend/src/modules/variables/views/VariablesCriticasView.vue`
- **Store Consumido**: `useVariablesStore`
- **Componentes Incrustados**: `JerarquiaTreeView.vue`, `PlantillasVariablesPanel.vue`, `DetalleVariablesPanel.vue`, `DialogoPlantillaVariable.vue`, `DialogosJerarquia.vue`
- **Propósito**: Panel dual de ingeniería para administración de variables de inspección. Permite navegación en árbol por Planta → Ubicación → Equipo → Componentes, edición de límites operativos (min/max), y gestión global de plantillas por tipo de equipo con auto-propagación.

---

## 10. Vista `InspeccionesView.vue`

- **Ubicación**: `apps/frontend/src/modules/inspecciones/views/InspeccionesView.vue`
- **Store Consumido**: `useInspeccionesStore`, `useAuthStore`
- **Componentes Incrustados**: `FormWizardInspeccion.vue`, `WizardSeleccionAlcance.vue`, `BandejaSupervisionPanel.vue`, `DetalleInspeccionModal.vue`, `ResumenInspeccionDialog.vue`
- **Propósito**: Módulo operativo para ejecución y supervisión de inspecciones industriales:
  - **Técnicos**: Asistente guiado por pasos (Planta, Maquinaria/Línea, Captura de variables con alerta de desvío e ingreso rápido para variables sin rango). Soporte de borrador local.
  - **Supervisores**: Bandeja de entrada con filtros, inspección detallada de desvíos, modal de resolución y cambio de estado (`APROBADO` / `RECHAZADO` con justificación).

---

## 11. Vista `UsuariosView.vue`

- **Ubicación**: `apps/frontend/src/modules/usuarios/views/UsuariosView.vue`
- **Store Consumido**: `useUsuariosStore`, `usePlantasStore`
- **Componentes Incrustados**: `FormularioUsuario.vue`
- **Propósito**: Panel exclusivo para usuarios con rol `ADMINISTRADOR`. Permite listar usuarios registrados, dar de alta nuevos operadores, modificar credenciales, asignar la planta base y conceder roles múltiples (`ADMINISTRADOR`, `SUPERVISOR`, `TECNICO`).

---

## 12. Vista `NotificacionesGlobalesView.vue` y Componente `NotificationBell.vue`

- **Ubicación de la Vista**: `apps/frontend/src/modules/notificaciones/views/NotificacionesGlobalesView.vue`
- **Ubicación del Componente Flotante**: `apps/frontend/src/modules/notificaciones/components/NotificationBell.vue`
- **Store Consumido**: `useNotificationStore` (`notificaciones.store.ts`)
- **Propósito y Capacidades**:
  - **`NotificationBell.vue` (Menú Superior)**: Icono de campana con badge dinámico de notificaciones no leídas, chip indicador de estado de WebSocket ("En vivo" / "Desconectado"), popover con scroll de alertas recientes segmentadas por criticidad (`ERROR`, `WARNING`, `ALERT`, `SUCCESS`), acción de marcar todas como leídas y acceso rápido al Panel Global para Administradores.
  - **`NotificacionesGlobalesView.vue` (`/notificaciones-globales`)**: Panel de supervisión y auditoría en tiempo real para Administradores del Sistema. Permite filtrar por categorías (`INSPECCION_PENDIENTE`, `INSPECCION_APROBADA`, `INSPECCION_RECHAZADA`, `AUDITORIA_SISTEMA`), buscar por texto libre, y visualizar el usuario responsable, entidad afectada y timestamp exacto de cada evento.

---

## 13. Vista `NotFoundView.vue` (404)

- **Ubicación**: `apps/frontend/src/views/NotFoundView.vue`
- **Propósito**: Captura cualquier ruta no registrada en Vue Router y ofrece un botón de retorno seguro al Dashboard o Login.


