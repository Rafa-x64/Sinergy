# Plan de Implementación y Diseño Arquitectónico: Módulo de Lubricación y Horómetros

![Status](https://img.shields.io/badge/Status-Planificaci%C3%B3n_T%C3%A9cnica-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20Prisma%20%7C%20PostgreSQL-green)
![Frontend](https://img.shields.io/badge/Frontend-Vue%203%20%7C%20Pinia%20%7C%20Bootstrap%205-4fc08d)
![Architecture](https://img.shields.io/badge/Architecture-Modular%20Features-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20(Sin%20any)-3178c6)

---

## 1. Contexto y Objetivos del Módulo

El **Módulo de Lubricación y Horómetros** digitaliza y sistematiza el control de mantenimiento preventivo basado en uso (*Usage-Based Maintenance*) y el monitoreo del estado de aceites y grasas industriales en las plantas operativas.

Sustituye el control manual en planillas de papel y hojas de cálculo independientes, integrándose al ecosistema Sinergy con trazabilidad directa hacia los equipos, líneas y plantas.

### Objetivos Principales:
1. **Control Confiable de Horómetros:** Registrar y auditar las horas acumuladas de operación por equipo, bloqueando retrocesos accidentales y calculando en tiempo real las horas de uso desde el último cambio de aceite ($\Delta \text{Horas}$).
2. **Gestión de Puntos de Lubricación:** Asociar a cada maquinaria sus componentes o partes específicas que requieren lubricación (chumaceras, reductores, rodamientos, guías, transmisiones) con el tipo exacto de aceite o grasa reglamentario.
3. **Matriz Interactiva de Captura Rápida (Data-Grid tipo Excel):** Proveer a los técnicos e inspectores de una interfaz ágil para ingresar o revisar de forma continua el estado de lubricación por planta, ubicación técnica o línea completa.
4. **Detección Inmediata de Fugas y Reposiciones:** Monitorear el consumo de insumos (Litros o Kilogramos) y alertar anomalías críticas como fugas activas de lubricante.
5. **Sistema Proactivo de Alertas Multinivel:** Notificar en tiempo real (vía WebSockets y campana) cuando un equipo se encuentre cercano al límite de horas de vida útil de su aceite, y cuando haya superado el umbral establecido.
6. **Reportabilidad Especializada:** Generar tableros de control con equipos con fugas sin subsanar, intervenciones del día y porcentaje de cumplimiento de rutinas planificadas.

---

## 2. Registro de Decisiones Arquitectónicas (ADR)

### ADR-01: Módulo Autónomo `lubricacion` vs. Extensión de `inspecciones`
- **Decisión:** Implementar un módulo autocontenido (`apps/backend/src/modules/lubricacion/` y `apps/frontend/src/modules/lubricacion/`), reutilizando los modelos maestros existentes (`Planta`, `UbicacionTecnica`, `Equipo`, `Componente`).
- **Por qué:** 
  - El principio de responsabilidad única (SRP) exige separar la toma de mediciones operacionales continuas (presión, amperaje, temperatura) de la gestión de horómetros acumulados y consumibles de lubricación.
  - La lubricación tiene un ciclo de vida propio: cuenta con intervalos de cambio que reinician contadores específicos, consumo cuantitativo de insumos (litros/kilos) y analíticas de desgaste.
- **Alternativas Descartadas:**
  - *Incluirlo como tipos de variable en `inspecciones`:* Descartada porque saturaría las tablas de alto volumen transaccional (`inspeccion_detalles`) con lógica condicional compleja de horómetros y cálculos de consumo.
- **Compromiso (Trade-off):** Se definen nuevas tablas normalizadas en PostgreSQL, pero se obtiene desacoplamiento, alto rendimiento en reportes y consultas directas.

---

### ADR-02: Algoritmo de Semáforo de Vida Útil de Lubricante
- **Decisión:** El estado del lubricante se calcula dinámicamente según la relación entre horas de uso transcurridas y el límite configurado:
  $$\text{Horas Transcurridas} = \text{Horómetro Actual} - \text{Horómetro Último Cambio}$$
  $$\% \text{ Vida Útil} = \left( \frac{\text{Horas Transcurridas}}{\text{Horas Límite de Cambio}} \right) \times 100$$
- **Umbrales del Semáforo:**
  - **Verde (Normal):** $< 80\%$ del límite de horas.
  - **Amarillo (Alerta Preventiva):** $\ge 80\%$ y $< 100\%$ del límite. Dispara notificación preventiva para planificar el cambio.
  - **Rojo (Crítico / Vencido):** $\ge 100\%$ del límite. Dispara alerta crítica en dashboard y WebSocket para supervisores y técnicos.
- **Trade-off:** La precisión del semáforo depende de la frecuencia con la que los operadores registren las lecturas de horómetros en planta.

---

### ADR-03: Trazabilidad y Protección contra Retroceso de Horómetros
- **Decisión:** En el backend, toda nueva lectura de horómetro debe ser estrictamente mayor o igual a la última lectura registrada para ese equipo (`nuevoHorometro >= ultimoHorometro`). Si se requiere registrar un valor menor debido a un reemplazo físico del reloj odómetro, debe enviarse una bandera explícita `reemplazoHorometro: true` con justificación obligatoria.
- **Por qué:** Evita errores humanos de digitación que corrompan el cálculo automático de horas de trabajo y alertas de vencimiento.

---

## 3. Modelo de Datos Propuesto (Prisma Schema)

```prisma
// =============================================================================
// MÓDULO DE LUBRICACIÓN Y HORÓMETROS
// =============================================================================

enum TipoLubricante {
  ACEITE
  GRASA
  OTRO
}

enum NivelLubricante {
  OK
  BAJO
  CRITICO
  SOBRELLENADO
  NO_APLICA
}

enum UnidadMedidaLubricante {
  LITROS
  KILOGRAMOS
  GALONES
}

enum OrigenLecturaHorometro {
  RUTINA_LUBRICACION
  INSPECCION_OPERATIVA
  LECTURA_MANUAL
  CAMBIO_ACEITE
}

// Catálogo maestro de tipos y marcas de lubricantes
model CatalogoLubricante {
  id           Int                    @id @default(autoincrement())
  codigo       String                 @unique @db.VarChar(50)
  nombre       String                 @db.VarChar(150)
  marca        String?                @db.VarChar(100)
  tipo         TipoLubricante
  viscosidad   String?                @db.VarChar(50)
  unidadMedida UnidadMedidaLubricante @default(LITROS) @map("unidad_medida")
  activo       Boolean                @default(true)
  creadoEn     DateTime               @default(now()) @map("creado_en")

  puntosLubricacion PuntoLubricacion[]

  @@map("catalogo_lubricantes")
}

// Definición de puntos a lubricar por maquinaria o componente
model PuntoLubricacion {
  id                     Int                @id @default(autoincrement())
  equipoId               Int                @map("equipo_id")
  equipo                 Equipo             @relation(fields: [equipoId], references: [id], onDelete: Cascade)
  componenteId           Int?               @map("componente_id")
  componente             Componente?        @relation(fields: [componenteId], references: [id], onDelete: SetNull)
  lubricanteId           Int                @map("lubricante_id")
  lubricante             CatalogoLubricante @relation(fields: [lubricanteId], references: [id], onDelete: Restrict)
  
  nombrePunto            String             @map("nombre_punto") @db.VarChar(150)
  limiteHorasCambio      Decimal            @map("limite_horas_cambio") @db.Decimal(10, 2)
  horometroUltimoCambio  Decimal            @default(0) @map("horometro_ultimo_cambio") @db.Decimal(10, 2)
  fechaUltimoCambio      DateTime?          @map("fecha_ultimo_cambio")
  capacidadRecomendada   Decimal?           @map("capacidad_recomendada") @db.Decimal(8, 2)
  activo                 Boolean            @default(true)
  creadoEn               DateTime           @default(now()) @map("creado_en")
  actualizadoEn          DateTime           @updatedAt @map("actualizado_en")

  detallesRutina RutinaLubricacionDetalle[]

  @@index([equipoId])
  @@index([componenteId])
  @@index([lubricanteId])
  @@map("puntos_lubricacion")
}

// Bitácora histórica de lecturas de horómetros por equipo
model HistorialHorometro {
  id                   BigInt                 @id @default(autoincrement())
  equipoId             Int                    @map("equipo_id")
  equipo               Equipo                 @relation(fields: [equipoId], references: [id], onDelete: Cascade)
  valorHorometro       Decimal                @map("valor_horometro") @db.Decimal(10, 2)
  fechaLectura         DateTime               @default(now()) @map("fecha_lectura")
  origen               OrigenLecturaHorometro @default(RUTINA_LUBRICACION)
  registradoPorId      Int                    @map("registrado_por_id")
  registradoPor        Usuario                @relation(fields: [registradoPorId], references: [id], onDelete: Restrict)
  esReemplazoReloj     Boolean                @default(false) @map("es_reemplazo_reloj")
  justificacion        String?                @db.Text

  @@index([equipoId, fechaLectura])
  @@map("historial_horometros")
}

// Cabecera de la rutina de inspección de lubricación
model RutinaLubricacion {
  id                 BigInt            @id @default(autoincrement())
  codigoRutina       String            @unique @map("codigo_rutina") @db.VarChar(100)
  plantaId           Int               @map("planta_id")
  planta             Planta            @relation(fields: [plantaId], references: [id], onDelete: Restrict)
  ubicacionTecnicaId Int               @map("ubicacion_tecnica_id")
  ubicacionTecnica   UbicacionTecnica  @relation(fields: [ubicacionTecnicaId], references: [id], onDelete: Restrict)
  equipoId           Int               @map("equipo_id")
  equipo             Equipo            @relation(fields: [equipoId], references: [id], onDelete: Restrict)
  
  elaboradoPorId     Int               @map("elaborado_por_id")
  elaboradoPor       Usuario           @relation(fields: [elaboradoPorId], references: [id], onDelete: Restrict)
  fechaEjecucion     DateTime          @default(now()) @map("fecha_ejecucion")
  horometroRegistrado Decimal          @map("horometro_registrado") @db.Decimal(10, 2)
  observaciones      String?           @db.Text
  creadoEn           DateTime          @default(now()) @map("creado_en")

  detalles RutinaLubricacionDetalle[]

  @@index([plantaId])
  @@index([ubicacionTecnicaId])
  @@index([equipoId])
  @@index([fechaEjecucion])
  @@map("rutinas_lubricacion")
}

// Detalle por punto de lubricación evaluado
model RutinaLubricacionDetalle {
  id                   BigInt            @id @default(autoincrement())
  rutinaId             BigInt            @map("rutina_id")
  rutina               RutinaLubricacion @relation(fields: [rutinaId], references: [id], onDelete: Cascade)
  puntoLubricacionId   Int               @map("punto_lubricacion_id")
  puntoLubricacion     PuntoLubricacion  @relation(fields: [puntoLubricacionId], references: [id], onDelete: Restrict)
  
  nivelLubricante      NivelLubricante   @default(OK) @map("nivel_lubricante")
  seRealizoReposicion  Boolean           @default(false) @map("se_realizo_reposicion")
  cantidadRepuesta     Decimal?          @map("cantidad_repuesta") @db.Decimal(8, 2)
  seRealizoCambioTotal Boolean           @default(false) @map("se_realizo_cambio_total")
  presentaFuga         Boolean           @default(false) @map("presenta_fuga")
  observaciones        String?           @db.Text

  @@index([rutinaId])
  @@index([puntoLubricacionId])
  @@index([presentaFuga])
  @@map("rutina_lubricacion_detalles")
}
```

---

## 4. Arquitectura de Backend (`apps/backend/src/modules/lubricacion/`)

La estructura respeta la arquitectura modular por capas del proyecto:

```
apps/backend/src/modules/lubricacion/
├── lubricacion.routes.ts       # Definición de rutas protegidas y autorización RBAC
├── lubricacion.controller.ts   # Validación de entradas, parseos y responses estandarizadas
├── lubricacion.service.ts      # Reglas de negocio, cálculos de horómetros y consultas Prisma
└── lubricacion.schemas.ts      # DTOs e interfaces estrictas en TypeScript
```

### Endpoints Planificados:

| Método | Endpoint | Middleware | Propósito |
|---|---|---|---|
| `GET` | `/api/lubricacion/matriz` | `validarJWT` | Matriz consolidada de equipos y puntos filtrada por Planta y Ubicación, con cálculos de delta de horas y semáforo. |
| `POST` | `/api/lubricacion/rutina` | `validarJWT` | Registra la rutina de lubricación, actualiza historial de horómetros y reinicia puntos con cambio total. |
| `GET` | `/api/lubricacion/puntos/:equipoId` | `validarJWT` | Lista los puntos de lubricación configurados para un equipo particular. |
| `POST` | `/api/lubricacion/puntos` | `validarJWT`, `autorizarRol('ADMINISTRADOR')` | Alta/configuración de nuevos puntos de lubricación por equipo o componente. |
| `GET` | `/api/lubricacion/catalogos` | `validarJWT` | Catálogo maestro de lubricantes (marcas, viscosidades, tipos). |
| `POST` | `/api/lubricacion/catalogos` | `validarJWT`, `autorizarRol('ADMINISTRADOR')` | Creación de nuevos tipos de lubricantes en catálogo maestro. |
| `GET` | `/api/lubricacion/reportes/fugas` | `validarJWT` | Consulta de puntos que reportaron fugas activas no resueltas. |
| `GET` | `/api/lubricacion/reportes/consumo` | `validarJWT` | Consumo acumulado de lubricantes (Litros/Kg) por planta, rango de fechas y equipo. |
| `GET` | `/api/lubricacion/reportes/cumplimiento` | `validarJWT` | Comparativa de rutinas planificadas vs. ejecutadas por día o mes. |

---

## 5. Arquitectura de Frontend (`apps/frontend/src/modules/lubricacion/`)

Estructura modular en el cliente Vue 3:

```
apps/frontend/src/modules/lubricacion/
├── views/
│   ├── MatrizLubricacionView.vue    # Grilla editable tipo hoja de cálculo
│   └── ReportesLubricacionView.vue  # Tableros de fugas, consumos y cumplimiento
├── components/
│   ├── FiltrosCabeceraLubricacion.vue # Selectores dependientes Planta ➔ Ubicación ➔ Línea
│   ├── HorometroBadge.vue            # Semáforo visual de estado (<80%, 80-99%, >=100%)
│   ├── FilaMatrizLubricacion.vue     # Fila interactiva para captura rápida de datos
│   └── ModalRegistroPunto.vue        # Modal administrativo para configurar puntos
├── store/
│   └── lubricacion.store.ts          # Estado reactivo, cálculos en cliente y peticiones API
└── types/
    └── lubricacion.types.ts          # Tipado estricto compartido
```

### Experiencia de Usuario (UI/UX):
- **Barra de Selección Superior:**
  - Selector de Planta $\to$ Ubicación Técnica $\to$ Tipo de Inspección (Línea completa o Equipo específico).
- **Matriz de Captura Rápida (Estilo Excel):**
  - Columnas: `Ubicación` | `Código Equipo` | `Componente / Punto` | `Lubricante` | `Último Cambio` | `Horómetro Anterior` | `Horómetro Actual [Input]` | `Horas de Uso [Calc]` | `Estado [Badge]` | `Nivel [Select]` | `Reposición [Lts]` | `¿Fuga? [Switch]` | `Observación`.
  - Los campos de cálculo (`Horas de Uso`, `% Vida Útil`, `Badge`) se recalculan automáticamente en el cliente al escribir el nuevo valor de horómetro.

---

## 6. Sistema de Notificaciones en Tiempo Real

Se integrará de forma nativa con la infraestructura de Socket.io y `eventBus` existente:

1. **Alerta Preventiva de Horómetro:**
   - Disparador: Cuando $\Delta \text{Horas} \ge 80\%$ del límite del punto de lubricación.
   - Destinatarios: Sala de Planta y Supervisores.
   - Nivel: `WARNING`.
2. **Alerta de Vencimiento de Cambio de Aceite:**
   - Disparador: Cuando $\Delta \text{Horas} \ge 100\%$ del límite.
   - Destinatarios: Sala de Planta, Supervisores y Técnicos.
   - Nivel: `ALERT` / `ERROR`.
3. **Reporte de Fuga Detectada:**
   - Disparador: Al guardar una rutina con `presentaFuga: true`.
   - Destinatarios: Todos los roles asignados a la planta afectada.
   - Nivel: `WARNING` con acción directa para revisar el equipo.

---

## 7. Plan de Ejecución Progresiva (Estado: 100% Completado)

### Fase 1: Base de Datos y Persistencia
- [x] Incorporación de modelos y enums al archivo `schema.prisma` (`catalogo_lubricantes`, `puntos_lubricacion`, `historial_horometros`, `rutinas_lubricacion`, `rutina_lubricacion_detalles`).
- [x] Sincronización en base de datos PostgreSQL remota mediante `prisma db push` y generación del cliente Prisma.
- [x] Creación del seed inicial automático con catálogo estándar de lubricantes industriales (ISO VG, Grasas de Litio, Sintéticos).

### Fase 2: Backend Core y Lógica de Negocio
- [x] Creación de `lubricacion.schemas.ts` (DTOs estrictos y tipado sin `any`).
- [x] Implementación de `lubricacion.service.ts` con lógica de cálculo de deltas, vida útil con semáforos dinámicos, registro transaccional de rutinas y validación anti-retroceso de horómetros.
- [x] Implementación de `lubricacion.controller.ts` con PBAC por planta y respuestas estructuradas `ResponseDTO`.
- [x] Definición de rutas protegidas en `lubricacion.routes.ts` y montaje en `server.ts` bajo `/api/lubricacion`.

### Fase 3: Integración de Eventos y Notificaciones
- [x] Registro de eventos `LUBRICACION_HOROMETRO_LIMITE` y `LUBRICACION_FUGA_DETECTADA` en `eventBus.ts`.
- [x] Conexión con los sockets de WebSocket (`notification.events.ts`, `notification.socket.ts`) para emisión segmentada por rol y sala de planta.

### Fase 4: Frontend — Vistas y Componentes Reactivos
- [x] Creación del store de Pinia `lubricacion.store.ts` con tipado estricto `lubricacion.types.ts`.
- [x] Construcción de `MatrizLubricacionView.vue` y componentes auxiliares (`SemaforoBadge.vue`, `ModalReemplazoHorometro.vue`, `ModalNuevoPunto.vue`).
- [x] Integración en el menú lateral (`Menu.vue`) con control de permisos RBAC para Administrador, Supervisor y Técnico.

### Fase 5: Reportes, Pruebas y Documentación
- [x] Implementación de `ReportesLubricacionView.vue` con pestañas para Fugas detectadas, Consumo acumulado de lubricantes e Historial auditable de rutinas.
- [x] Pruebas E2E automáticas de integración en base de datos real superadas con código 0.
- [x] Compilación limpia de TypeScript tanto en backend (`tsc`) como en frontend (`vue-tsc -b && vite build`).
- [x] Actualización síncrona de `docs/changelog.md` y mapa de módulos.
