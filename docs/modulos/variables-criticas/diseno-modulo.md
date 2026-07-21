# Diseño del Módulo — Variables Críticas (Tubrica)

**Versión:** 1.0
**Fecha:** 2026-07-21
**Estado:** Aprobado para implementación

---

## 1. Problema que Resuelve

Tubrica registra la inspección de variables críticas de planta de forma manual en Excel. Esto genera:

- Pérdida de trazabilidad (sin auditoría de quién, cuándo y qué cambió).
- Imposibilidad de calcular tendencias o alertas automáticas.
- Dificultad para onboarding de nuevos técnicos.
- Duplicación de trabajo al existir múltiples versiones del Excel circulando.

**Solución:** Digitalizar el proceso con una interfaz web adaptativa generada dinámicamente desde la base de datos.

---

## 2. Error Arquitectónico Descartado: Vistas por Línea

**Propuesta descartada:** Crear una vista HTML individual para cada línea, máquina o componente de la planta.

**Por qué se rechaza:** Este enfoque crea acoplamiento directo entre el código fuente y la realidad física de la planta. Cualquier cambio operacional (nueva máquina, variable renombrada, nueva línea de producción) requeriría:

1. Modificar el código fuente.
2. Compilar y generar un nuevo bundle.
3. Hacer un despliegue al servidor.

Con 3 plantas, 6-17 líneas por planta y múltiples equipos, el número de vistas alcanzaría cientos de archivos. El mantenimiento sería inviable.

---

## 3. Solución Correcta: Data-Driven UI

> El frontend no sabe qué es un "motor AD" ni cuántas líneas tiene la planta de extrusión.
> El frontend solo sabe dibujar estructuras de árbol.
> La base de datos es la única fuente de verdad.

### Principio de Funcionamiento

```
Base de Datos (estructura de planta)
        │
        ▼ (API REST)
  MachineInspectionView.vue  ← Vista única genérica
        │
        ▼ (v-for sobre componentes)
  ComponenteCard.vue
        │
        ▼ (v-for sobre variables)
  VariableInput.vue  ← Renderiza el control correcto según tipo_evaluacion
```

Un solo bloque de código Vue sirve para absolutamente toda la planta de Tubrica. Si mañana se añade una nueva línea de producción, el equipo de mantenimiento configura los datos en el CRUD administrativo y la interfaz de inspección la muestra automáticamente. Sin tocar una línea de código fuente.

---

## 4. Jerarquía de Datos

```
Ubicación Técnica (nullable)
    └── Planta
            └── Línea (6-17 por planta)
                    └── Equipo / Máquina
                            └── Componente
                                    └── Variable  ← tipo_evaluacion aquí
```

Todas las relaciones son 1:N estrictas. La tabla `variables` es el punto de control que define qué tipo de input se renderizará en el formulario.

---

## 5. Tipos de Evaluación de Variables

| Código | Descripción | Control de UI | Campos en DB |
|---|---|---|---|
| `numerico_entero` | Valor entero (RPM, horómetro, PSI) | `<input type="number" step="1">` | `valor_numerico` |
| `numerico_decimal` | Valor decimal (amperaje, voltaje) | `<input type="number" step="0.01">` | `valor_numerico` |
| `temperatura` | Grados C o F | `<input type="number">` + badge unidad | `valor_numerico` + `unidad` |
| `seleccion` | Conjunto predefinido de opciones | `<select>` dinámico | `valor_seleccion` |

### Leyenda Oficial del Sistema (tipo `seleccion`)

| Clave | Significado |
|---|---|
| `N` | Normal |
| `E` | Existe |
| `A` | Anormal |
| `B` | Bajo |
| `NE` | No Existe |
| `N/A` | No Aplica |

> Las opciones de selección se almacenan en la tabla `opciones_seleccion` de la base de datos. No están hardcodeadas en el frontend. Nuevas opciones se añaden sin tocar código.

---

## 6. Estrategia de Carga: Lazy Loading (Peticiones en Cascada)

El árbol completo de la planta **nunca se carga** en la hidratación inicial. Las peticiones son modulares y se disparan solo cuando el usuario selecciona el nivel correspondiente.

```
[1] Página carga → GET /api/plantas          (solo IDs y nombres)
[2] Usuario elige Planta → GET /api/plantas/:id/lineas
[3] Usuario elige Línea  → GET /api/lineas/:id/equipos
[4] Usuario elige Equipo → GET /api/equipos/:id/componentes-variables
                           ↑ Este endpoint retorna el árbol completo de:
                             componentes → variables → opciones_seleccion
[5] Vue itera el JSON y VariableInput.vue renderiza cada control
```

**Beneficio:** Con 17 líneas y 10 equipos por línea, sin lazy loading el primer fetch cargaría potencialmente 170 equipos con todos sus componentes y variables. Con lazy loading, se cargan únicamente los datos del equipo seleccionado.

---

## 7. Componentes Vue del Módulo

### `MachineInspectionView.vue` (Vista)
- Orquesta el proceso completo de selección de jerarquía e inspección.
- Contiene los selectores de Planta, Línea y Equipo.
- Llama a `useVariablesCriticas.ts` para los fetches lazy.
- Renderiza `ComponenteCard.vue` por cada componente del equipo.

### `ComponenteCard.vue` (Componente)
- Recibe un prop `componente: ComponenteInspeccion`.
- Muestra el nombre del componente e itera sus variables.
- Renderiza `VariableInput.vue` por cada variable.

### `VariableInput.vue` (Componente Polimórfico — Core del módulo)
- Recibe un prop `variable: VariableEvaluacion`.
- Usa `v-if` / `v-else-if` para renderizar el control apropiado:

```vue
<template>
  <div class="variable-input-wrapper">
    <label>{{ variable.nombre }}</label>

    <template v-if="variable.tipo_evaluacion === 'seleccion'">
      <select v-model="variable.valor_seleccion">
        <option v-for="op in variable.opciones" :key="op.clave" :value="op.clave">
          {{ op.clave }} — {{ op.etiqueta }}
        </option>
      </select>
    </template>

    <template v-else-if="variable.tipo_evaluacion === 'temperatura'">
      <div class="input-with-badge">
        <input type="number" v-model="variable.valor_numerico" />
        <span class="badge">{{ variable.unidad }}</span>
      </div>
    </template>

    <template v-else-if="variable.tipo_evaluacion === 'numerico_decimal'">
      <input type="number" step="0.01" v-model="variable.valor_numerico" />
    </template>

    <template v-else>
      <input type="number" step="1" v-model="variable.valor_numerico" />
    </template>

    <textarea v-model="variable.observaciones" placeholder="Observaciones..." />
    <label>
      <input type="checkbox" v-model="variable.componente_activo" />
      Componente Activo
    </label>
  </div>
</template>
```

### `InspeccionHeader.vue` (Componente)
- Campos: Elaborado por, Revisado por, Aprobado por, Fecha de registro.
- "Elaborado por" se pre-llena desde el JWT del usuario autenticado (solo lectura).
- "Revisado por" y "Aprobado por" son selectores de usuarios del sistema.

### `PlantAdminView.vue` (Vista — CRUD Administrativo)
- Vista exclusiva del Supervisor.
- Permite gestionar la jerarquía completa (Ubicaciones → Plantas → Líneas → Equipos → Componentes → Variables).
- Los cambios aquí se reflejan inmediatamente en los formularios de inspección.

---

## 8. Composable: `useVariablesCriticas.ts`

Incluye prevención de fugas de memoria mediante `AbortController` y limpieza en `onUnmounted`:

```typescript
import { ref, onUnmounted } from 'vue';
import http from '@/utils/http';
import type { ComponenteInspeccion, PayloadRegistroInspeccion } from '@/types/VariablesCriticas';

export function useVariablesCriticas() {
  const equipos = ref<{ id: number; nombre: string }[]>([]);
  const componentes = ref<ComponenteInspeccion[]>([]);
  const cargando = ref(false);
  let abortController: AbortController | null = null;

  const cargarEquiposPorLinea = async (lineaId: number) => {
    abortController?.abort();
    abortController = new AbortController();
    cargando.value = true;
    try {
      const { data } = await http.get(`/lineas/${lineaId}/equipos`, {
        signal: abortController.signal,
      });
      equipos.value = data;
    } finally {
      cargando.value = false;
    }
  };

  const cargarComponentesPorEquipo = async (equipoId: number) => {
    abortController?.abort();
    abortController = new AbortController();
    cargando.value = true;
    try {
      const { data } = await http.get(`/equipos/${equipoId}/componentes-variables`, {
        signal: abortController.signal,
      });
      componentes.value = data;
    } finally {
      cargando.value = false;
    }
  };

  const guardarInspeccion = async (payload: PayloadRegistroInspeccion) => {
    await http.post('/inspecciones', payload);
  };

  // Prevención de fugas de memoria: cancela peticiones pendientes al desmontar
  onUnmounted(() => {
    abortController?.abort();
  });

  return {
    equipos,
    componentes,
    cargando,
    cargarEquiposPorLinea,
    cargarComponentesPorEquipo,
    guardarInspeccion,
  };
}
```

---

## 9. Cabecera de la Inspección (Metadatos Obligatorios)

| Campo | Tipo | Regla |
|---|---|---|
| `elaborado_por` | `number` (ID) | Auto-asignado desde JWT. No editable por el técnico. |
| `revisado_por` | `number \| null` | Selector de usuarios. Opcional. |
| `aprobado_por` | `number \| null` | Selector de usuarios. Opcional. |
| `fecha_registro` | `string` (ISO 8601) | Auto-asignada por el backend. |
| `equipo_id` | `number` | Requerido. Resultado de la selección lazy. |

---

## 10. Endpoints de la API (Contrato Backend)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/plantas` | Lista todas las plantas |
| `GET` | `/api/plantas/:id/lineas` | Líneas de una planta |
| `GET` | `/api/lineas/:id/equipos` | Equipos de una línea |
| `GET` | `/api/equipos/:id/componentes-variables` | Árbol completo del equipo para inspección |
| `POST` | `/api/inspecciones` | Registra una inspección completa |
| `GET` | `/api/inspecciones` | Historial (con filtros: equipo, fecha, planta) |
| `GET` | `/api/inspecciones/:id` | Detalle de una inspección |

---

## 11. Comparativa de Enfoques

| Criterio | Vistas Estáticas | Data-Driven UI |
|---|---|---|
| Nuevo equipo en planta | Requiere nuevo archivo `.vue` + despliegue | Administrador lo crea en el CRUD |
| Variable renombrada | Requiere editar código + despliegue | Administrador edita en el CRUD |
| Escalar a 5 plantas | Multiplicación de vistas | Sin cambio de código |
| Mantenimiento futuro | Cientos de archivos | Un solo componente polimórfico |
| Auditoría y trazabilidad | Manual / imposible | Nativa en la DB transaccional |

---

## 12. Próximos Pasos (Orden de Implementación)

- [ ] Crear el esquema Prisma con las tablas maestras y transaccionales.
- [ ] Implementar los endpoints del backend (empezando por `GET /equipos/:id/componentes-variables`).
- [ ] Implementar `VariableInput.vue` con los 4 tipos de evaluación.
- [ ] Implementar `MachineInspectionView.vue` con los selectores lazy.
- [ ] Implementar `PlantAdminView.vue` (CRUD administrativo).
- [ ] Conectar el módulo al sistema de autenticación JWT para extraer `elaborado_por`.
- [ ] Añadir la vista al router con guard de rol.
- [ ] Escribir pruebas unitarias para `useVariablesCriticas.ts` y `VariableInput.vue`.
