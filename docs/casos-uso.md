# Casos de Uso — Sinergy

Este documento describe los escenarios principales de interacción de los usuarios con el sistema Sinergy.

## Actores del Sistema
1. **Técnico (`TECNICO`)**: Personal de mantenimiento encargado de realizar las inspecciones físicas en planta. Necesita rapidez y soporte offline.
2. **Supervisor (`SUPERVISOR`)**: Personal administrativo/jefe de área que visualiza los reportes, analiza KPIs y gestiona usuarios/equipos.

---

## Casos de Uso: Técnico

### CU-T01: Inicio de Sesión
- **Precondición**: El técnico tiene credenciales activas.
- **Flujo Principal**:
  1. El técnico ingresa su email y contraseña.
  2. El sistema valida contra el backend.
  3. Se descarga la información maestra básica (equipos de su planta, parámetros) para soporte offline.
  4. El técnico es redirigido al menú principal.
- **Flujo Alternativo (Sin Internet)**:
  1. Si el técnico ya había iniciado sesión y el token aún es válido en almacenamiento local, se permite el acceso al modo offline.

### CU-T02: Registrar Inspección de Equipo (Ej. Montacargas)
- **Precondición**: El técnico está logueado.
- **Flujo Principal**:
  1. El técnico selecciona el módulo "Montacargas".
  2. Selecciona el código del equipo (filtrado por su planta).
  3. El sistema muestra el formulario con los campos (horómetro, niveles de aceite, etc.) pre-llenados en "Normal".
  4. El técnico modifica solo lo que presenta desviación.
  5. Ingresa una observación general y presiona "Guardar".
  6. El sistema envía la data a la API, recibe éxito y muestra una notificación.
- **Flujo Alternativo (Offline)**:
  1. Si no hay red, la inspección se guarda en `Dexie.js` (IndexedDB).
  2. El sistema marca visualmente que hay "Inspecciones pendientes de sincronizar".

### CU-T03: Sincronización Automática (Modo Offline)
- **Precondición**: Existen inspecciones guardadas localmente y el dispositivo recupera conexión a internet.
- **Flujo Principal**:
  1. El sistema detecta conexión (`navigator.onLine` / listener).
  2. En segundo plano, se ejecuta el `useSync.ts`.
  3. Se envían las inspecciones al endpoint `/api/inspecciones/batch`.
  4. Si es exitoso, se eliminan los registros locales y se notifica al usuario.

---

## Casos de Uso: Supervisor

### CU-S01: Visualizar Dashboard de Indicadores
- **Flujo Principal**:
  1. El supervisor accede al sistema.
  2. El sistema carga los KPIs (ej. cantidad de inspecciones de hoy, equipos con alertas críticas).
  3. El dashboard muestra gráficos actualizados.

### CU-S02: Exportar Reporte de Inspecciones
- **Flujo Principal**:
  1. El supervisor navega a "Reportes".
  2. Filtra por rango de fechas y tipo de equipo (Ej. Compresores de la Planta 1).
  3. Presiona el botón "Exportar a Excel" (o PDF/Word).
  4. El sistema genera el archivo y lo descarga al dispositivo del supervisor.

### CU-S03: Gestionar Técnicos y Equipos
- **Flujo Principal**:
  1. El supervisor accede a configuración.
  2. Puede dar de alta un nuevo técnico, asignarle una planta y generar su contraseña inicial.
  3. Puede agregar nuevos equipos al catálogo para que aparezcan en los formularios de los técnicos.
