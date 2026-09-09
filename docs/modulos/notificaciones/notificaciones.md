# Módulo de Notificaciones en Tiempo Real y Auditoría

## 1. Visión General
El módulo de notificaciones de Sinergy provee una arquitectura desacoplada para emisión, persistencia y entrega en tiempo real de eventos críticos del sistema (inspecciones, cambios operativos de maquinaria, desvíos y auditoría de entidades).

Combina:
- **EventBus Interno de Node.js (`core/eventBus.ts`)**: Para comunicación asíncrona no bloqueante entre servicios (ej. `inspeccionService` emite `INSPECCION_CREADA`).
- **Persistencia en Base de Datos (`notifications` table con Prisma)**: Para garantizar que las notificaciones no se pierdan si el usuario está offline o si el cliente no ha conectado su socket.
- **WebSockets con Socket.io (`notification.socket.ts`)**: Para entrega instantánea bidireccional a clientes activos.
- **Distribución por Roles (RBAC) y Contexto de Planta (PBAC)**: Segmentación de salas por usuario, rol (`rol_admin`, `rol_supervisor`, `rol_tecnico`) y planta.

---

## 2. Decisiones Arquitectónicas (ADR)

### ADR-008: Corrección de Identificador de Usuario y Salas por Rol en Notificaciones
- **Contexto**: Las notificaciones en la campana del frontend reportaban estado "Desconectado" tras el login y "No tienes notificaciones registradas", a pesar de existir registros de auditoría en base de datos. Además, los reportes normativos no podían listar plantas ni tipos de maquinaria debido a rutas no sincronizadas.
- **Decisión**:
  1. En `notificaciones.controller.ts`, unificar la extracción de la clave primaria del usuario hacia `req.usuario.sub` (definido en `TokenPayload`), eliminando el acceso inválido `(req as any).usuario?.id` que producía respuestas HTTP 401.
  2. Implementar unión automática a salas por rol (`rol_admin`, `rol_supervisor`, `rol_tecnico`) y por planta (`planta_${plantaId}`) en `notification.socket.ts`, permitiendo emisiones dirigidas (`emitirNotificacionARol`, `emitirNotificacionAUsuario`, `emitirNotificacionGlobal`).
  3. En `Menu.vue`, sustituir la invocación estática de `onMounted` por un `watch` reactivo e inmediato sobre `authStore.accessToken` para conectar/desconectar el socket y sincronizar notificaciones en tiempo real al iniciar y cerrar sesión.
  4. En `PanelReportes.vue`, apuntar a los endpoints estandarizados `/plantas/listar`, `/equipos/tipo/listar` y `/equipos/listar` utilizando `Promise.allSettled` para aislamiento de fallos.
- **Alternativas descartadas**:
  - Polling HTTP recurrente desde el frontend (descartado por alto consumo de red y latencia).
  - Emisión de sockets exclusivamente a nivel broadcast sin salas de rol (descartado por fuga de privacidad entre roles).
- **Trade-offs**: La unión a múltiples salas en Socket.io añade una mínima sobrecarga en memoria del servidor por socket conectado, pero optimiza sustancialmente el ancho de banda y la pertinencia de las alertas.

### ADR-009: Resolución Jerárquica de Supervisores Destinatarios de Notificaciones
- **Contexto**: Al registrar una inspección o rutina de lubricación, el sistema insertaba una notificación en base de datos por cada usuario con rol `esSupervisor: true` en la tabla `UsuarioRol`. En entornos con múltiples supervisores, esto generaba N registros idénticos visibles en el *Historial de Actividades* global.
- **Decisión**: Implementar `notificationService.obtenerSupervisoresDestinatarios(tecnicoId, plantaId?, tx?)` con resolución en cascada:
  1. **Supervisor directo** (`usuario.supervisorId`): Si el técnico tiene un supervisor asignado y activo, se notifica únicamente a él.
  2. **Supervisores de la misma planta**: Si el técnico no tiene supervisor directo, se notifica a los supervisores activos vinculados a su misma `plantaId`.
  3. **Fallback global**: Si ninguna de las condiciones anteriores produce resultados, se notifica a todos los supervisores activos del sistema.
- **Alternativas descartadas**:
  - Notificación broadcast a todos los supervisores (descartada por generar registros duplicados en BD y ruido en el panel de auditoría).
  - Notificación `usuarioId: null` de sistema (descartada porque no permite routing individual por socket).
- **Trade-offs**: La resolución jerárquica asume que los técnicos tengan correctamente asignado su `supervisorId` o su `plantaId`. Si ambos son `null`, el fallback global actúa como red de seguridad.

---

## 3. Matriz de Notificaciones por Rol

| Evento de Negocio | Tipo (`NotificationType`) | Categoría (`CategoriaNotificacion`) | Destinatarios | Mensaje / Acción |
| :--- | :--- | :--- | :--- | :--- |
| **Nueva Inspección Creada** | `WARNING` / `ALERT` | `INSPECCION_PENDIENTE` / `AUDITORIA_SISTEMA` | Supervisor de la planta y Administrador | Alerta al supervisor para evaluación técnica; registro en bitácora del admin. |
| **Inspección Aprobada** | `SUCCESS` | `INSPECCION_APROBADA` | Técnico evaluado y Administrador | Notificación de conformidad al técnico; registro de supervisión al admin. |
| **Inspección Rechazada** | `ERROR` | `INSPECCION_RECHAZADA` | Técnico evaluado y Administrador | Notificación de no conformidad al técnico con observación para corrección. |
| **Acción General del Sistema** | `ALERT` | `AUDITORIA_SISTEMA` | Administrador del Sistema | Auditoría de creación, edición o eliminación de usuarios, roles, plantas o variables. |
| **Cambio de Estado de Maquinaria** | `WARNING` | `AUDITORIA_SISTEMA` | Supervisor y Administrador | Alerta de maquinaria marcada como Inoperativa o En Mantenimiento. |

---

## 4. Endpoints de la API

- `GET /api/notificaciones`: Lista las notificaciones personales del usuario autenticado o avisos broadcast.
- `GET /api/notificaciones/globales`: Solo Administrador. Historial completo de auditoría y actividades del sistema.
- `PATCH /api/notificaciones/:id/leer`: Marca una notificación específica como leída.
- `PATCH /api/notificaciones/marcar-todas-leidas`: Marca todas las notificaciones pendientes como leídas.
- `DELETE /api/notificaciones/:id`: Elimina una notificación del historial.
