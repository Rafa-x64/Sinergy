# Changelog — Sinergy v1.1.0

Todos los cambios notables del proyecto se documentan en este archivo.

El formato sigue el estándar [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

**Guía de cambios:**
- `Added` — Funcionalidades nuevas.
- `Changed` — Cambios en funcionalidades existentes.
- `Deprecated` — Funcionalidades que serán eliminadas próximamente.
- `Removed` — Funcionalidades eliminadas.
- `Fixed` — Correcciones de bugs.
- `Security` — Correcciones de vulnerabilidades.

---

## [Unreleased]

### Fixed
- **Deduplicación y Sincronización Idempotente de Variables Críticas (`fix: deduplicacion-sincronizacion-variables-criticas`)**:
  - **Deduplicación de Plantillas en Origen**: Se normalizan los nombres de variables y se da prioridad a la plantilla específica del componente sobre la genérica (`nombreComponente = null`), evitando generar múltiples variables idénticas para un mismo concepto.
  - **Saneamiento Automático de Duplicados en Base de Datos**: Al sincronizar un componente, el servicio detecta si existían duplicados previos en la BD, conserva una única instancia canónica activa y desactiva (`activa = false`) las réplicas sobrantes.
  - **Sanitización de Opciones de Selección (`skipDuplicates`)**: Se deduplican las claves de opciones de selección (`sanitizarOpcionesVariable`) antes de invocar `tx.opcionSeleccion.createMany` con `skipDuplicates: true`, previniendo errores de violación de restricción única (`uq_variable_clave`) y rollbacks en la transacción de sincronización.
  - **Sincronización Segura en Creación de Plantillas (`crearPlantilla`)**: Se verifica previamente si el componente ya posee una variable con ese nombre para actualizar su enlace (`plantillaId`) en lugar de insertar una nueva fila duplicada.

- **Responsividad Móvil Global y Optimización de Controles (`fix: responsive-mobile-controls-lubricacion`)**:
  - **Botón de Guardado y Acciones de Inspección**: Ajustado el botón *"Registrar Inspección de Lubricación"* en `MatrizLubricacionView.vue` a un diseño adaptable (`w-100` en móviles, `size="default"`, `text-wrap` sin mayúsculas rígidas), eliminando el desbordamiento horizontal en pantallas pequeñas.
  - **Compactación y Escala Móvil Global (`theme.css`)**: Implementadas reglas CSS responsivas bajo `@media (max-width: 600px)` para compactar la altura mínima de inputs, autocompletados y selectores (`min-height: 34px - 38px`), reducir paddings en tablas (`6px 8px`) y botones, y ajustar la tipografía base, beneficiando a todos los módulos del sistema de manera transversal.
  - **Densidad de Formularios y Modales**: Refactorizados los componentes `ModalParteLubricar.vue` y `ModalReemplazoHorometro.vue` con `density="compact"` y botones apilables verticalmente en móvil, evitando scroll horizontal forzado.
  - **Campo de Horómetro Dinámico**: Contenedor flexible para el valor de horómetro y chip de estado de tacómetro con soporte de `flex-wrap`.

- **Despliegue Resiliente de Migraciones y Resolución Automática de Baseline (Error P3005)** (`fix: prisma-migrate-baseline-and-deploy`):
  - **Script de Despliegue Inteligente (`apps/backend/scripts/deploy-migrations.js`)**: Automatiza el flujo de `prisma migrate deploy` capturando el error `P3005` (`The database schema is not empty`) cuando se despliega sobre una base de datos restaurada de un volcado o preexistente. Aplica automáticamente la línea base (baseline) mediante `prisma migrate resolve --applied 20260916120000_db_produccion_inicial` y reanuda el despliegue sin bloquear el pipeline.
  - **Comandos de Workspace**: Incorporados scripts `pnpm db:deploy` y `pnpm db:generate` en la raíz del monorepo, y `prisma:deploy`, `prisma:baseline` y `prisma:generate` en `apps/backend/package.json`.
  - **Normalización UTF-8 de Volcados SQL**: Transcodificado el archivo `apps/backend/prisma/Sinergy_produccion_backup.sql` y `apps/backend/migration.sql` de UTF-16 (Big/Little Endian con BOM) a UTF-8 estándar sin BOM, garantizando compatibilidad nativa con `psql` tanto en Windows como en entornos Linux (Arch/CachyOS) y reduciendo el tamaño en disco a la mitad.
  - **Documentación de Despliegue y Sincronización**: Actualizado `docs/setup.md` con instrucciones guiadas para la restauración de la base de datos vía `psql`, resolución manual y automática de baseline, y el protocolo paso a paso para forzar un reseteo limpio del entorno sincronizado con `origin/main` (`git reset --hard` + `git clean -fd`).

- **Modo Oscuro Integral y Estabilización del Sistema de Overlays de Vuetify 3** (`fix: dark-mode-overlay-and-contrast`):
  - **Eliminación de colisión con Scrims y Portales**: Se removieron overrides CSS invasivos (`display: none` en pseudo-elementos `::before`, reseteos globales de z-index y fondos forzados en `.v-sheet` / `.v-card`) que rompían el renderizado de portales de Vuetify (`v-overlay`). Resuelve el bug crítico donde al desplegar un menú, autocompletado o campana de notificaciones en modo oscuro, la pantalla completa quedaba vacía/oscura.
  - **Calibración de Bordes y Contornos de Campos**: Se configuró la variable nativa `--v-field-border-opacity: 0.12` en reposo y `0.7` al recibir foco (`.v-field--focused`), erradicando las líneas grises gruesas y bordes pesados sin comprometer la accesibilidad del control.
  - **Homogeneización del Menú Lateral (`v-navigation-drawer`)**: Se removieron los colores azul marino oscuro desfasados (`#0d1322`) de las secciones superior (`__prepend` / SinergyChip) e inferior (`__append` / datos de usuario); el drawer ahora utiliza el color de superficie unificado (`surface`: `#131B2E`) en todo su cuerpo.
  - **Eliminación de Rayas Grises en Pestañas (`AppTabs.vue`)**: Configurada la propiedad `elevation="0"` en las hojas base de las pestañas para eliminar las bandas superpuestas que generaba el cálculo de elevación de Vuetify en modo oscuro.

- **Variables Críticas — Reseteo Defensivo de Estado Vacío** (`fix: variables-criticas-empty-state-reset`):
  - Se corrigió el bug de persistencia en `variables.store.ts`: al alternar entre un componente con variables hacia uno sin variables, la interfaz mostraba erróneamente los datos del componente anterior.
  - Se implementó la limpieza inmediata `variablesComponente.value = []` tanto al invocar `seleccionarComponente` como al inicio de `cargarVariablesComponente` y dentro de los bloques de captura de error (`catch`).

- **Matriz de Lubricación — Catálogo Maestro de Plantas en Filtros** (`fix: lubricacion-catalogo-plantas-filtro`):
  - Se corrigió la propiedad computada `plantasDisponibles` en `MatrizLubricacionView.vue` para que consulte prioritariamente el catálogo maestro de plantas (`plantasStore.plantas`). Anteriormente derivaba la lista solo de las filas preexistentes en la matriz de lubricación, impidiendo seleccionar plantas sin rutinas previas (ej. mostraba únicamente "Planta de Inyección").

### Changed
- **Depuración de Tooltips y Limpieza Visual de Controles** (`style: clean-field-inputs-tooltips-borders`):
  - Retirada sistemática de tooltips en campos de texto plano (`v-text-field`), selectores (`v-select`) y autocompletados (`v-autocomplete`), restringiendo los tooltips exclusivamente a botones de acción tipo icono (expandir árbol, acciones CRUD).
  - Eliminación de clases de borde duro de Bootstrap (`.border`, `.border-bottom`, `.border-top`) en tarjetas y encabezados de `MatrizLubricacionView.vue` para mantener la estética minimalista y sin líneas de división disruptivas en ambos temas.

### Added
- **Integración de Rutinas de Lubricación con Bandeja de Aprobaciones (`/inspecciones`)** (`feat: lubricacion-inspeccion-bandeja`):
  - Al registrar una rutina de lubricación en `POST /api/lubricacion/rutinas`, se genera de forma atómica y transaccional una cabecera en la tabla `inspecciones` (`codigoInspeccion: INSP-LUB-...`, `tipoInspeccion: 'VARIABLES_CRITICAS'`, `estadoInspeccion: 'PENDIENTE'`).
  - Se crean notificaciones automáticas para los usuarios con rol SUPERVISOR (`INSPECCION_PENDIENTE`).
  - `BandejaSupervisionPanel.vue`: Ahora identifica las rutinas de lubricación con el chip distintivo `Rutina Lubricación` y permite evaluarlas con el botón "Revisar".
  - `DetalleInspeccionModal.vue`: Muestra el resumen consolidado multilínea (horómetro, técnico, puntos evaluados, niveles, reposiciones y fugas) y permite la aprobación o rechazo supervisado (`APROBADO` / `RECHAZADO`).

### Fixed / Security
- **Protección Integral Anti-Negativos y Blindaje de Usuario ("Anti-Fallos")** (`fix: lubricacion-anti-negativos-user-proof`):
  - **Reposición de Lubricante**:
    - Bloqueo de teclas `-`, `+`, `e`, `E` en el evento `@keydown`.
    - Auto-clamp en `@update:model-value` convirtiendo valores negativos a positivos.
    - Asignación inteligente al marcar el checkbox (preconfigura dosis recomendada o 1, y limpia a 0 al desmarcar).
    - Validación en cliente (`guardarInspeccion`) y en backend (`lubricacion.controller.ts` y `lubricacion.service.ts`) que exige $> 0$.
  - **Horómetro de Inspección**:
    - Bloqueo de caracteres no permitidos (`-`, `+`, `e`, `E`), atributos `min="0"`, `step="any"` y auto-corrección a 0 en cliente y validación estricta $\ge 0$ en backend.
  - **Límites y Capacidades en Formulario de Partes (`ModalParteLubricar.vue`)**:
    - Frecuencia límite: Bloqueo de negativos y clamping a $\ge 1$ hr.
    - Capacidad recomendada: Bloqueo de negativos y clamping a $\ge 0$.
    - Validaciones nativas en backend en `crearPuntoLubricacion` y `editarPuntoLubricacion`.
  - Solucionado el error HTTP 500 al guardar una inspección diaria. El frontend enviaba valores no reconocidos (`'LLENO'`, `'MEDIO'`, `'VACIO'`) incompatibles con el enum nativo de PostgreSQL (`OK`, `BAJO`, `CRITICO`, `SOBRELLENADO`, `NO_APLICA`).
  - Actualizado el frontend (`MatrizLubricacionView.vue` y `lubricacion.types.ts`) para usar opciones claras vinculadas a los valores correctos de la base de datos (`Normal (OK)`, `Bajo`, `Crítico`, `Sobrellenado`, `No Aplica`).
  - Incorporada función normalizadora defensiva `normalizarNivelLubricante` en `lubricacion.service.ts` para mapear cualquier sinónimo y prevenir excepciones no controladas.

- **`ModalParteLubricar` & `lubricacion.types` — Tipado estricto y resolución de errores Volar/TypeScript** (`fix: lubricacion-types-componente-id`):
  - Añadido `componenteId` a las interfaces `PuntoMatrizDTO` (backend) y `PuntoMatriz` (frontend), además de incluirlo en la consulta de Prisma de `lubricacion.service.ts`. Resuelve el error `La propiedad 'componenteId' no existe en el tipo 'PuntoMatriz'`.
  - Corregido el error de tipos de Vuetify (`El tipo 'string | number | ...' no se puede asignar al tipo 'Val<...>'`) al migrar el combobox a `v-autocomplete` estrictamente tipado con `number | null`.

### Added
- **`ModalParteLubricar` — Creación de Componente Desplegable a Ancho Completo (`cols="12"`) con Botón `+`** (`feat: lubricacion-modal-nuevo-componente-expand`):
  - Integrado botón `+` exclusivo en el campo "Componente Mecánico" (sin texto redundante debajo) que despliega una tarjeta a todo lo ancho del formulario (`cols="12"`) conservando una altura compacta.
  - Permite ingresar el nombre del nuevo componente mecánico con amplio espacio horizontal, crearlo en la base de datos vinculado al equipo actual y seleccionarlo de inmediato.
  - Guarda automáticamente el nuevo componente si el usuario lo escribió en el panel desplegable sin presionar el botón individual antes de guardar la parte.

### Fixed
- **`ModalParteLubricar` — Filtro de componentes incorrecto** (`fix: lubricacion-componentes-filter`):
  - Eliminado el filtro `esComponenteMecanicoReal` que excluía componentes válidos (bombas, motores, reductores) cuyo nombre contiene palabras como "PRESIÓN" o "NIVEL". El filtro era redundante porque la API ya filtra por `equipoId`.
  - El selector de componentes ahora muestra **todos** los componentes mecánicos del equipo seleccionado sin exclusiones.

### Added
- **`MatrizLubricacionView` — Selector de Alcance Independiente para Inspección** (`feat: lubricacion-inspeccion-alcance`):
  - El tab de Inspección ahora tiene su propio selector de alcance, completamente independiente del filtro global de la pestaña "Partes a Lubricar".
  - Permite filtrar por: **Por Planta**, **Por Línea / Ubicación**, o **Por Maquinaria Específica**.
  - El dropdown de equipo muestra horómetro actual y cantidad de puntos a lubricar configurados para cada máquina.
  - Nuevo computed `filaEquipoInspeccion` separado de `filaEquipoActual` (tab Partes), eliminando la dependencia entre pestañas.
  - Al guardar la inspección el selector se limpia automáticamente para facilitar el registro de la siguiente máquina.

### Fixed
- **Configuración por Variables de Entorno** (`feat: env-config`):
  - `apps/frontend/.env`: Ahora define `VITE_API_URL=http://localhost:3000/api` eliminando el fallback implícito `/api` que rompía la app en máquinas sin el proxy de Vite.
  - `apps/frontend/.env.example`: Plantilla documentada para que cualquier desarrollador sepa qué configurar al clonar el repositorio.
  - `apps/frontend/vite.config.ts`: Refactorizado a la forma funcional `defineConfig(({ mode }) => ...)` con `loadEnv` para que el proxy del servidor de desarrollo también lea `VITE_API_URL` del `.env`, sin valores hardcodeados.
  - `apps/backend/.env`: Añadida variable `ALLOWED_ORIGINS` para controlar la política CORS sin tocar código.
  - `apps/backend/.env.example`: Creado como plantilla de referencia para el backend.

- **Módulo de Lubricación y Horómetros (Backend y Frontend 100% Completados)**:
  - **Modelado en PostgreSQL**: Nuevas tablas `catalogo_lubricantes`, `puntos_lubricacion`, `historial_horometros`, `rutinas_lubricacion` y `rutina_lubricacion_detalles` con enums `TipoLubricante`, `NivelLubricante`, `UnidadMedidaLubricante` y `OrigenLecturaHorometro`.
  - **Catálogo Maestro de Lubricantes**: Endpoints para gestión de marcas, viscosidades y tipos (aceites y grasas) con precarga automática de referencias industriales estándar.
  - **Puntos de Lubricación por Maquinaria**: Configuración de puntos a intervenir por equipo/componente con límites de horas de cambio y capacidad recomendada.
  - **Control de Horómetros con Regla Anti-Retroceso**: Registro auditable de horas acumuladas con rechazo estricto a valores menores al último registrado, salvo declaración explícita de sustitución de reloj odómetro con justificación técnica (`esReemplazoReloj: true`).
  - **Matriz de Cálculo de Vida Útil de Lubricante**: Endpoint `/api/lubricacion/matriz` con cálculo dinámico en tiempo real de $\Delta \text{Horas}$ acumuladas desde el último cambio de aceite y semáforo porcentual de estado (`NORMAL`, `PREVENTIVO`, `CRITICO`).
  - **Rutinas Transaccionales y Notificaciones en Tiempo Real**: Endpoint `POST /api/lubricacion/rutinas` para ejecución atómica de inspecciones, actualización automática del horómetro base en caso de cambio total de aceite, y emisión inmediata de eventos `LUBRICACION_FUGA_DETECTADA` y `LUBRICACION_HOROMETRO_LIMITE` a través de WebSockets y EventBus.
  - **Reportes Analíticos de Lubricación**: Endpoints para consulta de fugas activas no resueltas, consolidado de consumo por lubricante (volumen y peso) e historial de ejecuciones.
  - **Frontend — Vistas y Componentes Reactivos (Enfoque en Partes a Lubricar y Excel Interactivo)**:
    - **`MatrizLubricacionView.vue`**: Rediseñado en dos pestañas modulares:
      1. **Pestaña 'Partes a Lubricar'**: Grid interactivo estilo Excel con selectores predictivos autocompletables (`v-autocomplete` para búsqueda por código, nombre o planta), CRUD completo (creación, edición de frecuencias/capacidades/componentes y eliminación con diálogo de confirmación y soft delete).
      2. **Pestaña '(Inspección) de Lubricación'**: Captura operativa diaria de horómetros con validación anti-retroceso, cálculo dinámico de semáforos en el cliente, registro de niveles de aceite, reposición en lts/gal/kg, alerta inmediata de fugas y cambio total de lubricante.
    - **Integración de Reportes en el Dashboard (`PanelReportes.vue`)**:
      - Incorporado reporte normativo **R7: Lubricación**, integrando pestañas para Fugas Detectadas activas y Consumo acumulado de aceites y grasas con filtros de planta y rango de fechas, más descarga en Excel.
    - **Componentes Auxiliares**:
      - `ModalParteLubricar.vue`: Rediseñado con selector reactivo `v-combobox` que permite seleccionar componentes existentes o escribir nuevos directamente. Incorporado filtro inteligente para descartar variables de inspección que hubieran sido importadas erróneamente como componentes (ej: `(psi)`, `(°C)`, `(Amp)`). Incluye selección rápida de frecuencias industriales (`100h`, `250h`, `500h`, etc.), tarjeta de resumen del lubricante y validaciones nativas.
      - `MatrizLubricacionView.vue`: Estandarizado con el componente transversal `HeaderViews.vue`, fondo `bg-surface-variant` en cabeceras de tarjeta para evitar aspecto descolorido, y reglas CSS con `:deep(thead th)` adaptables: fondo `#f1f5f9` con texto oscuro `#1e293b` en tema claro, y fondo `#1e2635` con texto blanco `#f8fafc` en tema oscuro.
      - `Menu.vue`: Restaurados los colores vivos en los iconos de cada módulo tanto en la barra móvil como en el drawer de escritorio usando `<template #prepend><v-icon :color="modulo.color">`.
      - `SemaforoBadge.vue` y `ModalReemplazoHorometro.vue`: Totalmente compatibles con tema claro y oscuro.
    - **Store Pinia y Tipado Estricto**: `lubricacion.store.ts` y `lubricacion.types.ts` completamente tipados sin `any`.
    - **Menú y Navegación**: Menú lateral unificado con acceso directo a `/lubricacion` para Administradores, Supervisores y Técnicos.

- **Conectividad y Autenticación de PostgreSQL con Prisma (`prisma.ts`, `prisma.config.ts`, `.env`)**:
  - **Sanitización y Codificación de Credenciales**: Implementación de `encodeURIComponent` sobre `process.env.DB_PASSWORD` en `prisma.ts` y `prisma.config.ts` para tolerar caracteres especiales (`#`, `@`, `:`, `/`, etc.) al construir cadenas de conexión URI a PostgreSQL.
  - **Prevención de Truncamiento en `dotenv`**: Configuración de comillas dobles en las variables de entorno de base de datos (`DB_PASSWORD="..."`), evitando que el analizador de `.env` interprete el carácter `#` como inicio de comentario y trunque la contraseña.
  - **Inyección Explícita de `DATABASE_URL`**: Asegurada la propagación de `process.env.DATABASE_URL` en tiempo de ejecución hacia el schema de Prisma y el pool de conexiones de `@prisma/adapter-pg`.

- **Notificaciones en Tiempo Real y Segmentación por Roles (`notification.socket.ts`, `notification.events.ts`, `notificaciones.controller.ts`)**:
  - **Salas de WebSocket por Rol y Planta**: Configuración en `notification.socket.ts` para que cada conexión activa se asocie a su sala de usuario (`user_${userId}`), salas por rol (`rol_admin`, `rol_supervisor`, `rol_tecnico`) y sala de planta (`planta_${plantaId}`). Implementadas funciones de emisión dirigida (`emitirNotificacionAUsuario`, `emitirNotificacionARol` y `emitirNotificacionGlobal`).
  - **Corrección de Identificador de Usuario en Backend**: Corrección en `notificaciones.controller.ts` para leer la clave primaria desde `req.usuario.sub` en lugar de `(req as any).usuario.id`, resolviendo fallos HTTP 401 Unauthorized en el acceso a la bandeja de notificaciones.
  - **Eventos Personalizados por Rol**:
    - **Técnicos**: Notificaciones de inspecciones aprobadas (`SUCCESS`) o rechazadas (`ERROR`) con observaciones técnicas.
    - **Supervisores**: Alertas de rondas pendientes de revisión (`WARNING`) y avisos inmediatos de equipos inoperativos o desvíos normativos.
    - **Administradores**: Bitácora integral en tiempo real de actividades del sistema (`AUDITORIA_SISTEMA`) y evaluaciones globales.
  - **Reactividad Inmediata al Autenticarse (`Menu.vue`)**: Reemplazo de llamada estática en `onMounted` por un `watch` reactivo con `immediate: true` sobre `authStore.accessToken`. El estado del WebSocket pasa a "En vivo" inmediatamente tras iniciar sesión desde cualquier vista.
  - **Feedback Visual con Toastification (`notificaciones.store.ts`)**: Generación de alertas flotantes automáticas al recibir eventos por WebSocket mientras el usuario navega por el sistema.
  - **Navegación Contextual desde la Campana (`NotificationBell.vue`)**: Redirección directa a la vista de inspecciones, equipos, usuarios o plantas al interactuar con una notificación.

- **Catálogos y Reportes de Flota Industrial (`PanelReportes.vue`, `planta.routes.ts`, `equipo.routes.ts`)**:
  - **Corrección de Endpoints en Reporte de Flota (R1)**: Actualización de `cargarCatalogos()` para consultar las rutas canónicas `/plantas/listar`, `/equipos/tipo/listar` y `/equipos/listar` mediante `Promise.allSettled`, asegurando la carga independiente de las plantas y los tipos de maquinaria.
  - **Alias de Rutas RESTful en Backend**: Incorporación de rutas raíz y alias (`['/', '/listar', '/listar/']` y `['/tipos', '/tipo/listar', '/tipo/listar/']`) en los routers de plantas y equipos para tolerancia a fallos.

- **Sistema de Autorización Granular Multi-Planta y Roles (RBAC + PBAC)**:
  - **Middlewares Backend (`autorizarRol.ts`, `autorizarRoles.ts`, `autorizarPlanta.ts`)**: Protección estricta de rutas mediante validación de roles (`ADMINISTRADOR`, `SUPERVISOR`, `TECNICO`, etc.) e inyección automática del alcance de planta (`req.usuario.plantaId`). Para usuarios no administradores, el backend restringe las consultas e inserciones estrictamente a su planta asignada; los administradores mantienen alcance global sin filtro restrictivo.
  - **Seguridad en Rutas Críticas**: Integración de middlewares de autorización en los endpoints de `equipo.routes.ts`, `ubicacion.routes.ts`, `planta.routes.ts`, `inspeccion.routes.ts`, `variable-critica.routes.ts` y `auth.routes.ts`.
  - **Gestión de Usuarios y Asignación de Plantas (`UsuariosView.vue`, `FormularioUsuario.vue`, `usuarios.store.ts`)**: Módulo administrativo para creación, edición, asignación de roles y vinculación de plantas por usuario con reactividad inmediata y validación de permisos en tiempo real.
  - **Control de Visibilidad y Permisos en UI**: Ocultamiento condicional de botones de creación, edición y eliminación en `EquipoView.vue`, `PlantasView.vue`, `UbicacionesView.vue`, `ComponentesView.vue`, `VariablesCriticasView.vue` e `InspeccionesView.vue` basado en `authStore.tieneRol` y `authStore.esAdmin`.

- **WebSockets y CORS Dinámico Multi-Entorno (`cors.ts`, `server.ts`, `notification.socket.ts`)**:
  - Unificación de la lógica de orígenes permitidos compartida entre Express y Socket.io mediante `esOrigenPermitido`.
  - Detección y autorización automática de redes locales (LAN: `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) en entornos de desarrollo sin requerir configuración manual de IP fija.

- **Herramientas de Migración y Auto-Instanciación (`pg-excel-migrator`)**:
  - **Auto-Instanciación Inteligente de Plantillas (`importer.service.ts`)**: Generación y sincronización automática de variables e inserción de opciones de selección hacia todos los componentes correspondientes por tipo de equipo en PostgreSQL.
  - **Sincronizador de Secuencias PostgreSQL (`sync_sequences.js`)**: Script automatizado para reparar y resetear todas las secuencias `serial`/`bigserial` de PostgreSQL al valor `COALESCE(MAX(id), 1)`.

- **Módulo Completo de Inspecciones por Planta (`src/modules/inspecciones/`)**:
  - **Filtro de Equipos Operativos**: Consulta estricta en backend que expone en el Wizard únicamente maquinarias con `estadoOperativo === 'OPERATIVO'`.
  - **Form Wizard Interactivo de Captura (`FormWizardInspeccion.vue`, `WizardSeleccionAlcance.vue`)**: Flujo por pasos para técnicos navegando por Planta, Tipo de Maquinaria, Maquinaria Específica (con autocompletado inteligente por código alfanumérico y denominación) o Línea Completa.
  - **Evaluación Diferenciada de Variables**: Alertas automáticas de desvío para variables **con rango operativo** e ingreso directo sin restricción para variables **sin rango** (`valorMinimo` y `valorMaximo` en `null`).
  - **Borrador Local Resiliente**: Autoguardado en `localStorage` (`sinergy_draft_inspeccion`) para proteger capturas ante pérdidas de red.
  - **Bandeja y Evaluación de Supervisión (`BandejaSupervisionPanel.vue`, `DetalleInspeccionModal.vue`)**: Panel de supervisores con vista tipo reporte, resaltado de anomalías y flujo de Aprobación / Rechazo con motivo obligatorio.
  - **Identidad Cromática Coherente**: Unificación de la paleta en toda la vista de inspecciones con el verde representativo del módulo (`#5cb85c`).
- **Selector Autocompletable de Tipos de Equipo en Plantillas (`PlantillasVariablesPanel.vue`)**: Reemplazo del selector horizontal por un `v-autocomplete` interactivo con búsqueda en tiempo real e íconos, facilitando la selección inmediata entre más de 50 tipos de equipo.
- **Scroll Horizontal en Árbol Jerárquico de Variables (`JerarquiaTreeView.vue`)**: Configuración de scroll bidireccional (`overflow: auto`) y expansión natural de filas (`white-space: nowrap`, `min-width: max-content`) para evitar el truncamiento de nombres y códigos en niveles profundos de la jerarquía de planta.

### Security
- **Autenticación Híbrida y Auto-Migración a Bcrypt (`comparePassword.ts`, `auth.service.ts`)**: Implementación de detección de hash bcrypt con fallback a texto plano para usuarios insertados manualmente en base de datos. Tras un login exitoso en texto plano, la contraseña se re-encripta automáticamente con bcrypt en la base de datos.
- **Control de Acceso por Roles (RBAC) y Menú Dinámico**: Implementación de filtrado de menú en `Menu.vue` usando `authStore.tieneRol` y decodificación de payload JWT en `auth.store.ts`. Restricción de navegación mediante `meta.roles` y guard `router.beforeEach` en `router.ts`. (`apps/frontend/src/modules/auth/auth.store.ts`, `apps/frontend/src/core/router.ts`, `apps/frontend/src/components/Menu.vue`)
- **Estandarización de `apiFetch` en `auth.store.ts`**: Implementación de la función `apiFetch` para consumo centralizado de la API REST, inyectando automáticamente `Authorization: Bearer <accessToken>`, `credentials: 'include'` y prefijo `API_URL`. (`apps/frontend/src/modules/auth/auth.store.ts`)
- **Vistas y Componentes de Interfaz (`LoginView.vue`, `DashboardView.vue`, `Menu.vue`, `SinergyChip.vue`)**: Implementación del formulario de inicio de sesión con Vuetify 3, vista inicial de Dashboard con pestañas, menú responsivo adaptativo (drawer permanente en desktop y app-bar en móvil) y componente visual `SinergyChip`. (`apps/frontend/src/modules/auth/views/LoginView.vue`, `apps/frontend/src/modules/dashboard/views/DashboardView.vue`, `apps/frontend/src/components/Menu.vue`, `apps/frontend/src/components/SinergyChip.vue`)
- **Restauración Automática de Sesión en Navigation Guard**: Configuración de `router.beforeEach` en `src/core/router.ts` llamando a `authStore.refrescarToken()` para persistencia transparente de la sesión mediante cookies HttpOnly en recargas de página.

### Fixed
- **Reactividad y Propagación en Cascada de Plantillas e Instancias de Variables (`variables.store.ts`, `variable-critica.service.ts`)**:
  - **Backend**: Implementada propagación automática en cascada en `crearPlantilla` (crea instancias `Variable` en todos los componentes existentes del tipo de equipo), `editarPlantilla` (actualiza campos y opciones en todas las instancias activas) y `eliminarPlantilla` (desactiva instancias vinculadas).
  - **Frontend Store**: Estandarizada la reactividad bidireccional en `variables.store.ts` para que todas las mutaciones (`crearPlantilla`, `editarPlantilla`, `eliminarPlantilla`, `sincronizarTipoEquipo`, `sincronizarComponente`, `crearVariable`, `eliminarVariable`) refresquen concurrentemente tanto el árbol jerárquico (`cargarArbolJerarquico`), como la lista de plantillas (`cargarPlantillasPorTipo`) y las variables del componente activo (`cargarVariablesComponente`), manteniendo actualizados los badges de instancias en tiempo real.

### Changed
- **Guía del Desarrollador y Arquitectura (`docs/guia-desarrollador.md`, `docs/architecture.md`)**: Actualización de los estándares del frontend, eliminación de dependencias de `localStorage` para tokens JWT en favor de Access Token en memoria, y formalización de `apiFetch` como función estándar de consumo de servicios.
- **Integración de Vuetify 3 y Material Design Icons (`@mdi/font`)**: Configuración e integración del plugin `vuetify` en `apps/frontend/src/plugins/vuetify.ts` y registro global en `main.ts`, habilitando componentes UI avanzados y librería de íconos MDI.
- **Tutorial Completo de Vuetify 3 (`docs/extensions/extensions.md`)**: Guía detallada paso a paso para la instalación, registro, tematización y uso de componentes Vuetify con `<script setup lang="ts">` en Vue 3.
- **Contratos de API Backend Estandarizados (`docs/api/contratos.md`)**: Documentación integral de los endpoints HTTP, parámetros DTO, códigos de error y respuestas bajo el formato `ResponseDTO` para los módulos de Plantas, Ubicaciones Técnicas, Líneas Operativas, Equipos y Componentes.
- **Autenticación Segura mediante Doble Token JWT (Access Token + Refresh Cookie)**: Implementación de Access Token de vida corta (15 min) retornado en JSON y Refresh Token de vida larga (7 días) cifrado en HttpOnly Cookie con `SameSite: strict`. (`apps/backend/src/infrastructure/security/jwt.ts`, `apps/backend/src/core/middlewares/autenticar.ts`, `apps/backend/src/core/middlewares/refreshToken.ts`)
- **Validación de Payloads con Zod**: Middleware factory `validarSchema` que ejecuta validación estricta de esquemas Zod en tiempo de ejecución (`loginSchema`, `crearUsuarioSchema`, `actualizarUsuarioSchema`). (`apps/backend/src/core/middlewares/validarSchema.ts`, `apps/backend/src/modules/auth/auth.schemas.ts`)
- **Contratos de API Actualizados (`docs/api/contratos.md`)**: Documentación detallada de contratos HTTP, headers, cookies, esquemas Zod y códigos de respuesta para todos los endpoints de autenticación y gestión de usuarios.

### Changed
- **Consolidación de Arquitectura Modular basada en Módulos (`routes`, `controller`, `service`, `schemas`)**: Eliminación completa de carpetas DDD-Lite (`src/domain/`, `src/application/`, `src/interfaces/`) en favor de módulos aislados y autocontenidos en `src/modules/auth/`.
- Endpoints de diagnóstico y estado en el backend (`apps/backend/src/index.ts`):
  - `GET /`: Información base de la API (`name`, `version`, `status`, `healthCheck`).
  - `GET /api/version`: Consulta directa de versión activa.
- Manejador de evento `error` en el listener HTTP de Express para capturar fallos de bind por puerto en uso (`EADDRINUSE`) entregando comandos de diagnóstico en PowerShell (`Get-NetTCPConnection` / `taskkill`). (`apps/backend/src/index.ts`)
- Esquema completo de PostgreSQL en `apps/backend/prisma/sinergy_schema.sql` (v2.0 Enterprise):
  - 7 tipos ENUM de dominio (`rol_enum`, `tipo_equipo_enum`, `tipo_evaluacion_enum`, etc.) que reemplazan los `VARCHAR` sin control en el esquema anterior.
  - 11 tablas en 3FN: 7 Maestras (jerarquía Data-Driven UI) + 4 Transaccionales (inspecciones + auditoría ISO).
  - Extensión 1:1 `montacargas_detalles` para almacenar la nomenclatura específica de Tubrica (Denominación, UT, Identificación abreviada).
  - Soporte de `valor_minimo` / `valor_maximo` en `variables` para alertas automáticas por rango operativo.
  - Trazabilidad tripartita en `inspecciones`: `elaborado_por` (NOT NULL/JWT), `revisado_por`, `aprobado_por` (NULLABLE).
  - Soporte de captura offline: `fecha_sincronizacion` + `origen_datos_enum` (`ONLINE` / `OFFLINE_SYNC`).
  - 23 índices B-Tree de alto rendimiento para Lazy Loading del Dashboard (< 100ms).
  - Función PL/pgSQL `fn_set_actualizado_en()` + 8 triggers para auto-actualización de timestamps.
  - Comentarios `COMMENT ON TABLE/COLUMN` en todas las tablas y columnas críticas.
- Esquema Prisma `apps/backend/prisma/schema.prisma` (v2.0): espejo tipado del DDL SQL con modelos en PascalCase, mappings de columna en snake_case y relaciones explícitas.
- Documento `docs/schemas/modelo-entidad-relacion.md` (v3.0): ERM completo con diagrama Mermaid, catálogo de tablas y columnas, 23 índices y matriz de integridad.

### Changed
- **Migración Arquitectónica a Feature-Based Architecture (ADR-002)**: Reemplazo de la estructura DDD-Lite (4 capas: domain, application, infrastructure, interfaces) por una arquitectura modular basada en funcionalidades aisladas (`src/modules/auth`, `src/modules/equipment`, `src/modules/maintenance`).
- **Directorio Compartido Monorepo (`apps/shared`)**: Creación de `apps/shared/types` y `apps/shared/constants` para compartir interfaces y tipos de TypeScript de forma centralizada entre el frontend (Vue 3) y el backend (Express/Prisma).
- Configuración de fuente de datos Prisma (`apps/backend/prisma.config.ts`): parametrización dinámica mediante variables de entorno individuales de PostgreSQL (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- Middleware global de errores (`apps/backend/src/core/middlewares/errorHandler.ts`): filtrado de propiedad `stack` en respuestas HTTP restringiéndolo a entorno de desarrollo y únicamente para errores de servidor con estado HTTP >= 500.
- Configuración CORS en backend (`apps/backend/src/core/server.ts`): restricción explícita de orígenes permitidos a `http://localhost:3000` y `http://localhost:5173`.
- `inspecciones.id`, `inspeccion_detalles.id`, `inspeccion_adjuntos.id` y `auditoria_logs.id`: cambiados de `SERIAL` (32-bit) a `BIGSERIAL` (64-bit) para escalar sin riesgo de desbordamiento de ID en sistemas industriales con inspecciones diarias. (D-03)
- `auditoria_logs.registro_id`: cambiado de `INTEGER` a `BIGINT` para cubrir IDs de cualquier tabla, incluidas las `BIGSERIAL`. (D-03)
- Interfaces TypeScript en `architecture.md`: actualizadas para reflejar los valores de ENUM en mayúsculas, los campos `valor_minimo`/`valor_maximo`, `estado_componente` y `origen_datos`. El esquema conceptual de BD fue corregido para incluir ENUMs, `BIGSERIAL`, `TIMESTAMPTZ` y políticas `ON DELETE` explícitas.

### Fixed
- D-04: Índice `idx_inspeccion_adjuntos_detalle` agregado en `inspeccion_adjuntos(detalle_id)`. Las queries de adjuntos por variable específica evitaban índice causando *full scan*.
- D-05: Índice `idx_componentes_activo` declarado en `schema.prisma` (`@@index([activo])`). El SQL ya lo tenía; Prisma no.
- D-06: Índice `idx_variables_tipo_evaluacion` declarado en `schema.prisma` (`@@index([tipoEvaluacion])`). Mismo caso que D-05.
- D-07: Índice `idx_inspecciones_origen` declarado en `schema.prisma` (`@@index([origenDatos])`). Necesario para el Dashboard de sincronización offline.


### Added (Setup Inicial del Monorepo)
- Estructura inicial del monorepo con `pnpm workspaces`.
- Workspace `@sinergy/frontend`: SPA con Vue 3, TypeScript, Bootstrap 5, Pinia y Vue Router.
- Workspace `@sinergy/backend`: API REST con Express, TypeScript y arquitectura DDD-Lite.
- Integración de Prisma ORM en el backend con esquema inicial (Planta, Equipo, Usuario, Inspeccion, Rol).
- Singleton de `PrismaClient` en `apps/backend/src/infrastructure/prisma/prismaClient.ts`.
- Estructura de carpetas DDD-Lite: `domain/`, `application/`, `infrastructure/`, `interfaces/`.
- Script global `pnpm dev` con `concurrently` para arrancar frontend y backend en paralelo.
- Scripts separados: `pnpm dev:frontend` y `pnpm dev:backend`.
- Health check del backend en `GET /api/health`.
- Configuración de `vite.config.ts` con chunking manual para librerías de gráficos y documentos.
- Alias `@/` configurado en Vite para rutas absolutas desde `src/`.
- Carpeta de documentación completa en `docs/` con subcarpetas por dominio.
- Documento `docs/architecture.md` con estructura del monorepo, diagramas de capas y ADRs.
- Documento `docs/extensions/extensions.md` con guía completa de las 18 librerías instaladas.
- Documento `docs/guia-desarrollador.md` con flujo cronológico de desarrollo (backend y frontend).
- Documento `docs/setup.md` con instrucciones de instalación paso a paso.
- Documento `docs/changelog.md` (este archivo).
- Documento `docs/todo.md` con el roadmap de desarrollo.
- Notas de levantamiento de requisitos en `docs/notas.md`.

### Changed
- `tsconfig.node.json` del frontend: cambiado `"module": "nodenext"` a `"ESNext"` con `"moduleResolution": "bundler"` para compatibilidad con la versión de TypeScript instalada.
- Eliminada la opción `"erasableSyntaxOnly"` del `tsconfig.node.json` (no disponible en TS 5.4.x).
- `package.json` de la raíz separado del `package.json` del frontend. El raíz ahora es el coordinador del monorepo.
- Nombre del paquete frontend cambiado de `"sinergy"` a `"@sinergy/frontend"`.
- Parámetros `to` y `from` de `scrollBehavior` en el router renombrados a `_to` y `_from` para satisfacer `noUnusedParameters` de TypeScript.

### Fixed
- Error `ERR_PNPM_IGNORED_BUILDS` resuelto agregando `@prisma/engines`, `prisma`, `esbuild`, `vue-demi`, `vue-echarts` y otros al campo `pnpm.ignoredBuiltDependencies` del `package.json` raíz.
- Error `Module '...' has no exported member 'defineConfig'` resuelto corrigiendo `moduleResolution` en `tsconfig.node.json`.

---

## Cómo registrar un cambio

Cuando hagas un commit que resuelva un bug, agregue una funcionalidad o cambie el comportamiento del sistema, agrega una entrada en la sección `[Unreleased]` con el formato:

```markdown
- Descripción concisa del cambio. (`nombre/del/archivo.ts`)
```

Al hacer un release, la sección `[Unreleased]` se convierte en `[X.Y.Z] — YYYY-MM-DD`.
