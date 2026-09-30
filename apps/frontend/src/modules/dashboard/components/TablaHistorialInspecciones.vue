<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useDashboardStore } from "../dashboard.store"

const store = useDashboardStore()

const filtroTipo = ref("")
const filtroEstado = ref("")
const fechaInicio = ref("")
const fechaFin = ref("")

const opcionesTiposInspeccion = [
  { title: "Todas las rutinas", value: "" },
  { title: "Variables Críticas de Planta", value: "VARIABLES_CRITICAS" },
  { title: "Chillers — Rutina Diaria", value: "CHILLER_DIARIO" },
  { title: "Chillers — Rutina Semanal", value: "CHILLER_SEMANAL" },
  { title: "Chillers (Legado)", value: "CHILLER" },
  { title: "Rutina Compresores", value: "COMPRESOR" },
  { title: "Rutina Generadores", value: "GENERADOR" },
  { title: "Rutina Montacargas", value: "MONTACARGAS" }
]

const headers = [
  { title: "Código", key: "codigoInspeccion", sortable: false },
  { title: "Fecha", key: "fechaRegistro", sortable: false },
  { title: "Rutina", key: "tipoInspeccion", sortable: false },
  { title: "Planta", key: "planta", sortable: false },
  { title: "Equipo", key: "equipo", sortable: false },
  { title: "Técnico", key: "elaboradoPor", sortable: false },
  { title: "Estado", key: "estadoInspeccion", sortable: false },
  { title: "Variables", key: "detalles", sortable: false }
]

async function cargar() {
  await store.cargarInspeccionesDelPeriodo({
    tipoInspeccion: filtroTipo.value || undefined,
    estado: filtroEstado.value || undefined,
    fechaInicio: fechaInicio.value || undefined,
    fechaFin: fechaFin.value || undefined
  })
}

function etiquetaRutina(tipo?: string) {
  switch (tipo) {
    case 'CHILLER': return 'Chillers (Legado)'
    case 'CHILLER_DIARIO': return 'Chillers Diaria'
    case 'CHILLER_SEMANAL': return 'Chillers Semanal'
    case 'COMPRESOR': return 'Compresores'
    case 'GENERADOR': return 'Generadores'
    case 'MONTACARGAS': return 'Montacargas'
    case 'VARIABLES_CRITICAS': return 'Var. Críticas'
    default: return tipo || 'General'
  }
}

function colorRutina(tipo?: string) {
  switch (tipo) {
    case 'CHILLER':
    case 'CHILLER_DIARIO':
    case 'CHILLER_SEMANAL': return 'cyan'
    case 'COMPRESOR': return 'indigo'
    case 'GENERADOR': return 'amber'
    case 'MONTACARGAS': return 'deep-orange'
    case 'VARIABLES_CRITICAS': return 'teal'
    default: return 'secondary'
  }
}

function formatearFecha(fechaStr: string) {
  if (!fechaStr) return "-"
  return new Date(fechaStr).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function colorEstado(estado: string) {
  if (estado === "APROBADO") return "success"
  if (estado === "RECHAZADO") return "error"
  if (estado === "PENDIENTE") return "warning"
  return "secondary"
}

onMounted(() => {
  cargar()
})
</script>

<template>
  <v-card class="elevation-2 rounded-lg pa-4" color="surface">
    <div class="d-flex flex-wrap align-center justify-space-between gap-2 mb-4">
      <div>
        <div class="text-subtitle-1 font-weight-bold d-flex align-center gap-2">
          <v-icon color="success" size="20">mdi-clipboard-text-clock-outline</v-icon>
          Historial General de Inspecciones Técnicas
        </div>
        <div class="text-caption text-medium-emphasis">
          Registro completo de rondas ejecutadas, estado de evaluación y variables inspeccionadas
        </div>
      </div>
      <v-btn
        variant="tonal"
        color="success"
        size="small"
        prepend-icon="mdi-refresh"
        :loading="store.cargandoInspecciones"
        @click="cargar"
      >
        Actualizar
      </v-btn>
    </div>

    <!-- Filtros -->
    <v-row dense class="mb-2">
      <v-col cols="12" sm="3">
        <v-select
          v-model="filtroTipo"
          :items="opcionesTiposInspeccion"
          item-title="title"
          item-value="value"
          label="Rutina / Tipo"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="cargar"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-select
          v-model="filtroEstado"
          :items="[
            { title: 'Todos los estados', value: '' },
            { title: 'Aprobadas', value: 'APROBADO' },
            { title: 'Pendientes', value: 'PENDIENTE' },
            { title: 'Rechazadas', value: 'RECHAZADO' }
          ]"
          item-title="title"
          item-value="value"
          label="Estado de Inspección"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="cargar"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field
          v-model="fechaInicio"
          type="date"
          label="Desde"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          @update:model-value="cargar"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field
          v-model="fechaFin"
          type="date"
          label="Hasta"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          @update:model-value="cargar"
        />
      </v-col>
    </v-row>

    <!-- Resumen rápido en chips -->
    <div v-if="store.inspeccionesDelPeriodo" class="d-flex flex-wrap gap-2 my-3">
      <v-chip size="small" variant="tonal" color="primary">
        Total: <strong>{{ store.inspeccionesDelPeriodo.total }}</strong>
      </v-chip>
      <v-chip size="small" variant="tonal" color="success">
        Aprobadas: <strong>{{ store.inspeccionesDelPeriodo.aprobadas }}</strong>
      </v-chip>
      <v-chip size="small" variant="tonal" color="error">
        Rechazadas: <strong>{{ store.inspeccionesDelPeriodo.rechazadas }}</strong>
      </v-chip>
      <v-chip size="small" variant="tonal" color="info">
        Tasa Aprobación: <strong>{{ store.inspeccionesDelPeriodo.tasaAprobacion }}%</strong>
      </v-chip>
    </div>

    <!-- Tabla -->
    <v-table density="comfortable" hover class="rounded-lg mt-2">
      <thead>
        <tr>
          <th v-for="h in headers" :key="h.key" class="text-left font-weight-bold">
            {{ h.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="store.cargandoInspecciones">
          <td colspan="8" class="text-center py-6">
            <v-progress-circular indeterminate color="success" size="28" />
            <div class="text-caption mt-2">Cargando historial de inspecciones...</div>
          </td>
        </tr>
        <tr v-else-if="!store.inspeccionesDelPeriodo?.inspecciones || store.inspeccionesDelPeriodo.inspecciones.length === 0">
          <td colspan="8" class="text-center py-8 text-medium-emphasis">
            No se encontraron inspecciones en el rango seleccionado.
          </td>
        </tr>
        <tr v-for="item in store.inspeccionesDelPeriodo?.inspecciones" :key="item.id">
          <td>
            <span class="font-weight-bold font-mono text-body-2">{{ item.codigoInspeccion }}</span>
          </td>
          <td class="text-caption">{{ formatearFecha(item.fechaRegistro) }}</td>
          <td>
            <v-chip size="x-small" variant="tonal" :color="colorRutina(item.tipoInspeccion)" class="font-weight-medium">
              {{ etiquetaRutina(item.tipoInspeccion) }}
            </v-chip>
          </td>
          <td>
            <v-chip size="x-small" variant="outlined" color="primary">
              {{ item.planta?.nombre || "General" }}
            </v-chip>
          </td>
          <td>
            <div v-if="item.equipo">
              <span class="text-body-2 font-weight-medium">{{ item.equipo.codigo }}</span>
              <div class="text-caption text-medium-emphasis">{{ item.equipo.nombre }}</div>
            </div>
            <span v-else class="text-caption text-medium-emphasis">General / Línea</span>
          </td>
          <td>
            <span v-if="item.elaboradoPor" class="text-body-2">
              {{ item.elaboradoPor.nombre }} {{ item.elaboradoPor.apellido }}
            </span>
            <span v-else class="text-caption text-medium-emphasis">-</span>
          </td>
          <td>
            <v-chip size="x-small" :color="colorEstado(item.estadoInspeccion)" variant="tonal" class="font-weight-bold">
              {{ item.estadoInspeccion }}
            </v-chip>
          </td>
          <td>
            <v-chip size="x-small" color="secondary" variant="flat">
              {{ item._count?.detalles || 0 }} vars
            </v-chip>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>
