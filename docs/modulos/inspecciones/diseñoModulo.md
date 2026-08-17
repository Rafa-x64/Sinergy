# 📋 Plan de Implementación: Módulo de Inspecciones por Línea

![Status](https://img.shields.io/badge/Status-En_Planificaci%C3%B3n-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Prisma-green)
![Frontend](https://img.shields.io/badge/Frontend-Vue%203%20%7C%20Pinia-4fc08d)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6)

## 📖 Contexto y Análisis del Estado Actual

Actualmente, el *schema* de base de datos gestiona los modelos `Inspeccion`, `InspeccionDetalle` e `InspeccionAdjunto` vinculados de forma estricta a un único `equipoId`. Este enfoque no cumple con el nuevo requerimiento de negocio: **una inspección debe realizarse por línea completa**, abarcando múltiples equipos, componentes y variables en un solo flujo.

A nivel de Frontend, el *store* actual (`inspecciones.store.ts`) presenta deuda técnica: utiliza llamadas `fetch` directas en lugar de un cliente API centralizado y carece de tipado estricto (uso extendido de `any`), violando los estándares arquitectónicos del proyecto.

---

## 🏗️ Decisiones de Arquitectura (ADR)

| ID | Título | Decisión | Motivo / Trade-off |
|:---|:---|:---|:---|
| **ADR-01** | Relación Inspección → Línea | Agregar `lineaId` al modelo `Inspeccion` como FK anulable. Mantener `equipoId`. | Permite el flujo por línea sin romper registros históricos ni inhabilitar inspecciones individuales futuras. |
| **ADR-02** | Agrupamiento de Datos | El Backend almacena detalles de forma plana. El Frontend agrupa por Equipo → Componente → Variable. | Mantiene la base de datos normalizada y el backend simple. Delega la lógica de presentación a Vue/Pinia. |
| **ADR-03** | Máquina de Estados | Flujo de estados: `BORRADOR` ➔ `PENDIENTE` ➔ `APROBADO` / `RECHAZADO`. | Protege el trabajo del técnico durante rondas largas y establece un flujo de auditoría claro para el supervisor. |

---

## 💾 Cambios en la Base de Datos

Modificación del modelo en `schema.prisma`. 

```prisma
model Inspeccion {
  // ... campos existentes ...
  
  // [NUEVO] FK a Línea
  lineaId   Int?   @map("linea_id")          
  linea     Linea? @relation(fields: [lineaId], references: [id], onDelete: SetNull)
}

model Linea {
  // ... campos existentes ...
  inspecciones Inspeccion[]
}
```

> ⚠️ **IMPORTANTE:** Se deberá ejecutar `prisma db push` (sin el flag `--skip-generate`). Dado que el nuevo campo `lineaId` es opcional (`?`), no hay riesgo de pérdida de datos en el entorno de producción.

---

## 🚀 Fases de Desarrollo

### Fase 1: Backend - Endpoints de Inspección por Línea
**Objetivo:** Preparar la capa de datos y controladores para recibir y servir datos estructurados.

*   **[MODIFY]** `schema.prisma`: Aplicar cambios estructurales.
*   **[NEW]** `inspecciones.schemas.ts`: Creación de DTOs tipados.

```typescript
interface CrearInspeccionLineaDTO {
  lineaId: number;
  tipoInspeccion: TipoInspeccion; // e.g., 'VARIABLES_CRITICAS'
  observacionesGenerales?: string;
  detalles: CrearDetalleDTO[];
}

interface CrearDetalleDTO {
  variableId: number;
  valorNumerico?: number | null;
  valorSeleccion?: string | null;
  observaciones?: string | null;
  estadoComponente: boolean;
}
```

*   **[MODIFY]** `inspeccion.service.ts`: Reescribir lógica de negocio utilizando transacciones (`$transaction`) para asegurar la integridad al guardar una inspección y sus múltiples detalles.
*   **[MODIFY]** `inspeccion.routes.ts`: Implementar los endpoints requeridos (`/lineas/:plantaId`, `/crear-linea`, `/listar`, `/:id`, `/:id/estado`). Todos protegidos con `validarJWT` y validación de roles (`TECNICO`, `SUPERVISOR`).

### Fase 2: Frontend - Store y Tipado Estricto
**Objetivo:** Eliminar el uso de `any`, estandarizar el consumo de la API y preparar el estado global.

*   **[NEW]** `src/modules/inspecciones/types/inspeccion.types.ts`: Definir interfaces completas (`LineaConEquipos`, `EquipoInspeccionable`, `BorradorDetalle`, etc.).
*   **[MODIFY]** `inspecciones.store.ts`: Reescritura total usando el patrón Composition API de Pinia.
    *   **Estado:** `plantasDisponibles`, `lineaSeleccionada`, `borradorDetalles` (`Map<number, BorradorDetalle>`), `historialInspecciones`.
    *   **Acciones:** `cargarPlantas()`, `cargarLineaParaInspeccion()`, `actualizarDetalle()`, `enviarInspeccion()`, `cargarHistorial()`.

### Fase 3: Frontend - Vista y Componentes Reactivos
**Objetivo:** Construir la interfaz de usuario dividiendo la complejidad en componentes atómicos.

**Estructura de Directorios:**

```text
src/modules/inspecciones/
├── types/
│   └── inspeccion.types.ts          [NUEVO]
├── inspecciones.store.ts            [REFACTOR]
├── components/
│   ├── SelectorLineaPanel.vue       [NUEVO]
│   ├── SeccionEquipo.vue            [NUEVO]
│   ├── FilaVariable.vue             [NUEVO]
│   └── ResumenInspeccion.vue        [NUEVO]
└── views/
    └── InspeccionesView.vue         [REFACTOR]
```

**Layout Desktop Propuesto (`InspeccionesView.vue`):**

| Panel Selector (240px) | Formulario Central (flex-grow) | Resumen y Progreso (280px) |
| :--- | :--- | :--- |
| Selección en cascada (Planta ➔ Línea) | Renderizado iterativo de `SeccionEquipo.vue` y `FilaVariable.vue` | Validación en tiempo real, campo de observaciones y botones de acción |

### Fase 4: Integración, Historial y Reglas de Negocio
**Objetivo:** Unir todas las piezas, aplicar control de accesos y pulir la experiencia de usuario.

*   **Historial:** Tabla dinámica con colores de estado (Borrador = Gris, Pendiente = Ámbar, Aprobado = Verde, Rechazado = Rojo). Panel lateral (Drawer) para lectura detallada.
*   **Control de Roles:**
    *   `TECNICO`: Puede crear borradores y enviar a revisión.
    *   `SUPERVISOR`: Puede visualizar, aprobar o rechazar.
*   **Validaciones Core:**
    *   Bloqueo del botón "Enviar" si existen variables obligatorias sin evaluar.
    *   Feedback visual inmediato (verde/rojo) para variables numéricas fuera de límite.

---

## ✅ Criterios de Aceptación y Verificación

| Fase | Tarea de Verificación | Método de Prueba |
| :---: | :--- | :--- |
| **1** | Validar tipado y endpoints de Backend | Ejecutar `tsc --noEmit`. Probar endpoints integrados con Thunder Client/Postman. |
| **2** | Auditoría de tipos en Frontend | Ejecutar `vue-tsc --noEmit`. Verificar 0 advertencias de tipo `any` en el store. |
| **3** | Flujo UI Reactivo | Prueba en navegador: Seleccionar planta ➔ línea ➔ verificar renderizado correcto de secciones. |
| **4** | End-to-End y Roles | Simular creación (Técnico) ➔ Aprobación (Supervisor) ➔ Verificación en base de datos. |

---

## ❓ Preguntas Abiertas / Blockers (Por Definir)

Antes o durante el inicio del sprint, el equipo de producto/negocio debe resolver los siguientes puntos:

- [ ] **Orden de Secciones:** ¿El orden visual de los tipos de equipo (Extrusora, Banco Calibración, etc.) debe ser fijo/alfabético, o depende de la columna `ordenPosicion` de la tabla equipos?
- [ ] **Equipos sin Variables:** Si un equipo asociado a la línea actual no tiene variables críticas registradas en sistema, ¿se debe omitir visualmente de la lista o se muestra con un *badge* informativo ("Sin configuración")?
- [ ] **Frecuencia de Inspección:** ¿El sistema debe permitir más de una inspección a la misma línea por día? Si existe una en estado `BORRADOR` hoy, ¿se bloquea una nueva creación y se fuerza a editar la existente?
- [ ] **Persistencia Local:** ¿El estado `BORRADOR` debe guardarse únicamente en memoria (`store`), en `localStorage` (para evitar pérdida de datos si el dispositivo se apaga), o sincronizarse vía API en *background* periódicamente?