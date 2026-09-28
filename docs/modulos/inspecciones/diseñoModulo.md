# Plan de Implementación y Diseño Arquitectónico: Módulo de Inspecciones

![Status](https://img.shields.io/badge/Status-Planificaci%C3%B3n_Aprobada-success)
![Backend](https://img.shields.io/badge/Backend-Node.js%2FExpress%2FPrisma-green)
![Frontend](https://img.shields.io/badge/Frontend-Vue%203%20%7C%20Pinia%20%7C%20Bootstrap%205-4fc08d)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20(Sin%20any)-3178c6)

---

## 1. Contexto y Objetivos del Módulo

El **Módulo de Inspecciones** sustituye los formularios impresos y planillas de cálculo (Excel) utilizados en planta para el levantamiento de variables críticas operacionales y chequeos de condición.

### Objetivos Principales:
1. **Inspección Integral por Línea de Producción:** Permitir al técnico registrar en un único flujo continuo todas las variables operativas de los equipos pertenecientes a una línea activa (Planta ➔ Ubicación Técnica ➔ Línea ➔ Equipos ➔ Componentes ➔ Variables).
2. **Soporte para Inspecciones de Equipos Individuales / Flotas:** Mantener compatibilidad con inspecciones directas a equipos móviles (Montacargas, Compresores, Generadores, Chillers).
3. **Flujo de Auditoría y Aprobación (Workflow):** Implementar la máquina de estados `BORRADOR` ➔ `PENDIENTE` ➔ `APROBADO` / `RECHAZADO` con trazabilidad completa de usuarios (`elaboradoPor`, `revisadoPor`, `aprobadoPor`).
4. **Data-Driven UI:** La interfaz debe ser dinámica y adaptarse automáticamente a las variables, unidades y opciones de selección registradas en la base de datos sin alterar código fuente.
5. **Resiliencia Operacional (Borrador Local):** Evitar la pérdida de datos ante interrupciones de conectividad en planta mediante persistencia reactiva en el cliente antes del envío final.

---

## 2. Registro de Decisiones Arquitectónicas (ADR)

### ADR-01: Relación Híbrida Línea / Equipo en el Modelo de Inspección
- **Decisión:** Modificar el modelo `Inspeccion` en Prisma para agregar `lineaId` como clave foránea opcional (`Int?`), transformando también `equipoId` en opcional (`Int?`). A nivel de validación, se exigirá que al menos uno de los dos esté presente.
- **Alternativas Descartadas:**
  - *Crear dos tablas separadas (`inspecciones_linea` e `inspecciones_equipo`):* Descartada por duplicidad innecesaria de lógica de auditoría, estados, adjuntos y detalles.
  - *Forzar que toda inspección sea por equipo:* Descartada porque obligaría al técnico a crear entre 10 y 20 registros independientes por cada ronda en una sola línea.
- **Trade-off:** La consulta de historial requiere indexación compuesta y validación en controlador para garantizar la integridad referencial.

### ADR-02: Normalización Plana en Backend vs. Árbol Jerárquico en Frontend
- **Decisión:** El backend persiste los detalles de inspección (`InspeccionDetalle`) de manera relacional plana (`inspeccionId`, `variableId`, `valorNumerico`, `valorSeleccion`, `observaciones`, `estadoComponente`). El frontend se encarga de agrupar y proyectar visualmente por `Equipo` ➔ `Componente` ➔ `Variable`.
- **Alternativas Descartadas:**
  - *Almacenar la jerarquía como JSON blob en la base de datos:* Descartada porque impide realizar consultas analíticas, reportes históricos y estadísticas agregadas vía SQL/Prisma.
- **Trade-off:** Requiere una función de mapeo eficiente en el Store de Pinia al cargar el árbol de captura.

### ADR-03: Máquina de Estados y Roles (RBAC)
- **Decisión:** Ciclo de vida estricto:
  - `BORRADOR`: Visible y editable únicamente por el técnico creador.
  - `PENDIENTE`: Bloqueado para el técnico; visible en la bandeja de entrada de supervisores.
  - `APROBADO` / `RECHAZADO`: Estado final inmutable con registro de fecha y usuario revisor.
- **Trade-off:** Los técnicos no pueden editar una inspección una vez enviada a `PENDIENTE` a menos que sea rechazada con observaciones.

### ADR-04: Guardia Anti-Duplicado y Consulta de Última Inspección
- **Decisión:** 
  1. En `crearInspeccion`, cuando se evalúa un equipo individual (`equipoId`), el backend valida si ya existe una inspección en estado `PENDIENTE` o `APROBADO` registrada en el día actual para ese equipo y tipo de rutina. Si existe, rechaza con HTTP 409 Conflict.
  2. Implementación del endpoint `GET /api/inspecciones/ultima-inspeccion?equipoId=X&tipoInspeccion=Y` para retroalimentar al técnico en tiempo real en el wizard con la última fecha, folio y estado previo.
- **Por qué:** Evita duplicidades accidentales o doble captura de rutinas interdiarias por diferentes técnicos en el mismo turno, mejorando la coherencia operativa.

### ADR-05: Simplificación de UI Basada en PBAC y Advertencia de Completitud
- **Decisión:**
  1. Si el usuario logueado no es Administrador y cuenta con una planta fija asignada en su perfil, el selector de planta se oculta de la vista para reducir fricción cognitiva, mostrando un badge informativo compacto con la planta asignada.
  2. En el diálogo resumen de envío (`ResumenInspeccionDialog`), se incorpora un cálculo en tiempo real de variables pendientes. Si existen variables sin responder, se muestra una alerta preventiva (warning) para que el técnico decida si envía parcial o completa la evaluación.

---

## 3. Modelo de Datos (Prisma Schema)

```prisma
// =============================================================================
// MODIFICACIONES EN schema.prisma
// =============================================================================

model Linea {
  id                 Int              @id @default(autoincrement())
  codigo             String           @db.VarChar(50)
  nombre             String           @db.VarChar(255)
  ubicacionTecnicaId Int              @map("ubicacion_tecnica_id")
  ubicacionTecnica   UbicacionTecnica @relation(fields: [ubicacionTecnicaId], references: [id], onDelete: Restrict)
  activa             Boolean          @default(true)
  creadoEn           DateTime         @default(now()) @map("creado_en")
  actualizadoEn      DateTime         @updatedAt @map("actualizado_en")

  equipos            Equipo[]
  inspecciones       Inspeccion[]     // [NUEVA RELACIÓN]

  @@unique([codigo, ubicacionTecnicaId], name: "uq_linea_ubicacion")
  @@index([ubicacionTecnicaId])
  @@map("lineas")
}

model Inspeccion {
  id                     BigInt           @id @default(autoincrement())
  codigoInspeccion       String           @unique @map("codigo_inspeccion") @db.VarChar(100)
  tipoInspeccion         TipoInspeccion   @map("tipo_inspeccion")

  // Soporte dual: por línea completa o por equipo específico
  lineaId                Int?             @map("linea_id")
  linea                  Linea?           @relation(fields: [lineaId], references: [id], onDelete: SetNull)
  equipoId               Int?             @map("equipo_id")
  equipo                 Equipo?          @relation(fields: [equipoId], references: [id], onDelete: SetNull)

  // Trazabilidad de usuarios
  elaboradoPorId         Int              @map("elaborado_por")
  elaboradoPor           Usuario          @relation("ElaboradoPor", fields: [elaboradoPorId], references: [id], onDelete: Restrict)
  revisadoPorId          Int?             @map("revisado_por")
  revisadoPor            Usuario?         @relation("RevisadoPor", fields: [revisadoPorId], references: [id], onDelete: SetNull)
  aprobadoPorId          Int?             @map("aprobado_por")
  aprobadoPor            Usuario?         @relation("AprobadoPor", fields: [aprobadoPorId], references: [id], onDelete: SetNull)

  fechaRegistro          DateTime         @default(now()) @map("fecha_registro")
  fechaSincronizacion    DateTime?        @map("fecha_sincronizacion")
  estadoInspeccion       EstadoInspeccion @default(PENDIENTE) @map("estado_inspeccion")
  origenDatos            OrigenDatos      @default(ONLINE) @map("origen_datos")
  observacionesGenerales String?          @map("observaciones_generales") @db.Text
  creadoEn               DateTime         @default(now()) @map("creado_en")
  actualizadoEn          DateTime         @updatedAt @map("actualizado_en")

  detalles               InspeccionDetalle[]
  adjuntos               InspeccionAdjunto[]

  @@index([lineaId])
  @@index([equipoId])
  @@index([elaboradoPorId])
  @@index([fechaRegistro])
  @@index([estadoInspeccion])
  @@index([tipoInspeccion])
  @@index([origenDatos])
  @@map("inspecciones")
}

model InspeccionDetalle {
  id               BigInt     @id @default(autoincrement())
  inspeccionId     BigInt     @map("inspeccion_id")
  inspeccion       Inspeccion @relation(fields: [inspeccionId], references: [id], onDelete: Cascade)
  variableId       Int        @map("variable_id")
  variable         Variable   @relation(fields: [variableId], references: [id], onDelete: Restrict)
  valorNumerico    Decimal?   @map("valor_numerico") @db.Decimal(12, 4)
  valorSeleccion   String?    @map("valor_seleccion") @db.VarChar(10)
  observaciones    String?    @db.Text
  estadoComponente Boolean    @default(true) @map("estado_componente")

  adjuntos         InspeccionAdjunto[]

  @@index([inspeccionId])
  @@index([variableId])
  @@map("inspeccion_detalles")
}
```

---

## 4. Contrato de la API REST (Backend)

Todos los endpoints requieren autenticación mediante encabezado `Authorization: Bearer <accessToken>` validado con el middleware `validarJWT`.

### 4.1. `GET /api/inspecciones/arbol-linea/:lineaId`
Devuelve la estructura completa de una línea con todos sus equipos operativos, componentes activos, variables y opciones de selección preconfiguradas.

- **Parámetros de Ruta:** `lineaId` (número entero).
- **Respuesta Exitosa (200 OK):**
```json
{
  "status": "ok",
  "message": "Árbol de inspección obtenido correctamente",
  "data": {
    "id": 5,
    "codigo": "LIN-EXT-01",
    "nombre": "Línea de Extrusión 01",
    "ubicacionTecnica": {
      "id": 2,
      "codigo": "1000-EXT",
      "nombre": "Área de Extrusión",
      "planta": { "id": 1, "codigo": "PL-01", "nombre": "Tubrica Planta 1" }
    },
    "equipos": [
      {
        "id": 12,
        "codigo": "1000EXT00012",
        "nombre": "Extrusora Principal Bausano",
        "tipoEquipo": { "id": 3, "nombre": "Extrusora" },
        "componentes": [
          {
            "id": 34,
            "nombre": "Zona de Calefacción",
            "ordenPosicion": 1,
            "variables": [
              {
                "id": 101,
                "nombre": "Temperatura Zona 1",
                "tipoEvaluacion": "TEMPERATURA",
                "unidad": "°C",
                "valorMinimo": "160.00",
                "valorMaximo": "190.00",
                "opcionesSeleccion": []
              },
              {
                "id": 102,
                "nombre": "Estado Resistencias",
                "tipoEvaluacion": "SELECCION",
                "unidad": null,
                "valorMinimo": null,
                "valorMaximo": null,
                "opcionesSeleccion": [
                  { "id": 1, "clave": "N", "etiqueta": "Normal", "ordenPosicion": 1 },
                  { "id": 2, "clave": "A", "etiqueta": "Anormal", "ordenPosicion": 2 },
                  { "id": 3, "clave": "N/A", "etiqueta": "No Aplica", "ordenPosicion": 3 }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 4.2. `POST /api/inspecciones/crear`
Crea una inspección completa con sus detalles en una transacción atómica.

- **Cuerpo de la Petición (`RegistrarInspeccionDTO`):**
```json
{
  "codigoInspeccion": "INSP-20260818-L01",
  "tipoInspeccion": "VARIABLES_CRITICAS",
  "lineaId": 5,
  "equipoId": null,
  "estadoInspeccion": "PENDIENTE",
  "origenDatos": "ONLINE",
  "observacionesGenerales": "Inspección rutinaria de arranque de turno",
  "detalles": [
    {
      "variableId": 101,
      "valorNumerico": 175.5,
      "valorSeleccion": null,
      "observaciones": null,
      "estadoComponente": true
    },
    {
      "variableId": 102,
      "valorNumerico": null,
      "valorSeleccion": "N",
      "observaciones": null,
      "estadoComponente": true
    }
  ]
}
```
- **Respuesta (201 Created):** Objeto `Inspeccion` creado con IDs en formato string (BigInt serializado).

### 4.3. `GET /api/inspecciones/listar`
Lista inspecciones con filtros combinados y ordenadas cronológicamente descendente.

- **Query Parameters:** `lineaId`, `equipoId`, `tipoInspeccion`, `estadoInspeccion`, `elaboradoPorId`, `fechaDesde`, `fechaHasta`.
- **Respuesta (200 OK):** Array de inspecciones con relaciones incluidas.

### 4.4. `GET /api/inspecciones/buscar/:id`
Busca una inspección por ID (BigInt recibido en string en la URL).

### 4.5. `PATCH /api/inspecciones/editar-estado/:id`
Actualiza el estado (`APROBADO` / `RECHAZADO` / `PENDIENTE`) registrando revisor y emitiendo eventos de auditoría y notificaciones.

---

## 5. Arquitectura del Frontend (Vue 3 + Pinia)

### 5.1. Estructura Modular de Carpetas

```text
apps/frontend/src/modules/inspecciones/
├── types/
│   └── inspeccion.types.ts                 // Interfaces y DTOs de TypeScript estrictos
├── inspecciones.store.ts                   // Store Pinia (Composition API)
├── components/
│   ├── SelectorJerarquia.vue               // Selector en cascada: Planta ➔ Ubicación ➔ Línea
│   ├── TarjetaEquipoInspeccion.vue         // Acordeón colapsable por equipo con sus componentes
│   ├── FilaVariableInput.vue               // Input polimórfico (entero, decimal, temperatura, select)
│   ├── ResumenProgresoInspeccion.vue       // Barra de progreso, conteo de variables y validación
│   ├── ModalDetalleInspeccion.vue          // Modal para auditoría/revisión y aprobación del supervisor
│   └── TablaHistorialInspecciones.vue      // Tabla de historial con filtros y badges de estado
└── views/
    ├── InspeccionesView.vue                // Vista principal con pestañas (Historial / Bandeja de Supervisión)
    └── CapturaInspeccionView.vue           // Vista de captura optimizada para tablet y móvil
```

### 5.2. Componente Polimórfico `FilaVariableInput.vue`

Renderiza dinámicamente el control de entrada adecuado según `variable.tipoEvaluacion`:
- `NUMERICO_ENTERO`: `<input type="number" step="1">` con validación de rango `[valorMinimo, valorMaximo]`.
- `NUMERICO_DECIMAL`: `<input type="number" step="0.01">` con formateo decimal.
- `TEMPERATURA`: Input numérico con badge visual de la unidad (°C / °F) y alerta en tiempo real si el valor ingresado sale de los límites operativos.
- `SELECCION`: `<select>` o grupo de botones radiales con las opciones provistas desde la base de datos (`N`, `E`, `A`, `B`, `NE`, `N/A`).

### 5.3. Layout y Experiencia de Usuario (UX Mobile-First)

```
+-----------------------------------------------------------------------+
| Header: Planta Seleccionada | Línea Seleccionada | Progreso: 85%      |
+-----------------------------------------------------------------------+
| [ Acordeón Equipo 1: Extrusora Principal ]                            |
|   - Componente: Calefacción                                           |
|       * Temp Zona 1: [ 175.5 ] °C   (Rango: 160 - 190) -> [OK Verde]  |
|       * Estado Resistencias: [ Normal (N) v ]                         |
|   - Componente: Motor Principal                                       |
|       * Amperaje: [ 45.2 ] A        (Rango: 30 - 50)   -> [OK Verde]  |
+-----------------------------------------------------------------------+
| [ Acordeón Equipo 2: Tina de Enfriamiento ]                           |
|   - Componente: Bomba de Vacío                                        |
|       * Presión Vacío: [ -0.6 ] Bar (Rango: -0.8 a -0.4)              |
+-----------------------------------------------------------------------+
| Observaciones Generales: [ Campo de texto multilinea... ]             |
| [ Botón: Guardar Borrador ]       [ Botón: Enviar a Supervisión ]     |
+-----------------------------------------------------------------------+
```

---

## 6. Matriz de Roles y Permisos (RBAC)

| Acción / Funcionalidad | `TECNICO` | `SUPERVISOR` | `ADMINISTRADOR` |
|:---|:---:|:---:|:---:|
| Ver árbol de captura por línea | Sí | Sí | Sí |
| Crear y guardar `BORRADOR` | Sí | Sí | Sí |
| Enviar inspección a `PENDIENTE` | Sí | Sí | Sí |
| Ver historial de inspecciones propias | Sí | Sí | Sí |
| Ver historial global de planta | No | Sí | Sí |
| Aprobar / Rechazar inspecciones | No | Sí | Sí |
| Eliminar inspección en `BORRADOR` | Sí (propia) | Sí | Sí |
| Configurar variables y maestros de planta | No | No | Sí |

---

## 7. Plan de Pruebas y Aseguramiento de Calidad (QA)

### 7.1. Pruebas Unitarias (Backend)
- `inspeccion.service.test.ts`:
  - Creación atómica de inspección con múltiples detalles.
  - Validación de clave foránea (`lineaId` existente vs inexistente).
  - Transiciones válidas e inválidas de la máquina de estados.
  - Serialización correcta de campos `BigInt` a string.

### 7.2. Pruebas de Componentes y Store (Frontend)
- `inspecciones.store.test.ts`:
  - Mapeo del árbol de línea a estructura reactiva.
  - Cálculo de porcentaje de avance y conteo de campos pendientes.
  - Detección reactiva de valores fuera de rango de tolerancia.
  - Persistencia y restauración del borrador local.

### 7.3. Criterios de Aceptación End-to-End
1. El técnico selecciona una línea y el formulario se genera dinámicamente con los equipos, componentes y variables activos.
2. Al ingresar un valor fuera del rango mínimo/máximo, el sistema muestra inmediatamente una advertencia visual amarilla/roja sin bloquear la captura.
3. El botón "Enviar a Supervisión" solo se habilita si no hay campos obligatorios pendientes.
4. El supervisor recibe la inspección en su bandeja, revisa los valores anómalos y puede aprobar o rechazar ingresando observaciones de feedback.
