<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInspeccionesStore, type InspeccionMaestra } from '../inspecciones.store'
import { usePlantasStore } from '@/modules/plantas/plantas.store'
import DetalleInspeccionModal from './DetalleInspeccionModal.vue'

const store = useInspeccionesStore()
const plantasStore = usePlantasStore()
const refDetalleModal = ref<InstanceType<typeof DetalleInspeccionModal> | null>(null)

const filtroPlantaId = ref<number | undefined>(undefined)
const filtroEstado = ref<string>('')
const fechaInicio = ref<string>('')
const fechaFin = ref<string>('')

async function cargarHistorial() {
  await store.cargarHistorial({
    plantaId: filtroPlantaId.value,
    estado: filtroEstado.value || undefined,
    fechaInicio: fechaInicio.value || undefined,
    fechaFin: fechaFin.value || undefined
  })
}

const abrirDetalle = async (inspeccion: InspeccionMaestra) => {
  await store.cargarDetalleInspeccion(inspeccion.id)
  refDetalleModal.value?.abrir()
}

function formatearFecha(f?: string) {
  if (!f) return '—'
  return new Date(f).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function colorEstado(estado: string) {
  if (estado === 'APROBADO') return 'success'
  if (estado === 'RECHAZADO') return 'error'
  if (estado === 'PENDIENTE') return 'warning'
  return 'secondary'
}

onMounted(async () => {
  if (plantasStore.plantas.length === 0) {
    await plantasStore.listarPlantas()
  }
  await cargarHistorial()
})
</script>

<template>
  <div class="panel-historial-inspecciones">
    <!-- Barra Superior y Filtros -->
    <v-card class="elevation-2 rounded-lg pa-4 bg-surface border mb-3">
      <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3">
        <div class="d-flex align-center">
          <v-avatar color="#5cb85c" variant="tonal" size="40" class="mr-3">
            <v-icon size="24" color="#5cb85c">mdi-history</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">
              Historial General de Inspecciones Técnicas
            </h3>
            <span class="text-caption text-medium-emphasis">
              Registro histórico completo de rondas técnicas ejecutadas, aprobadas y rechazadas
            </span>
          </div>
        </div>

        <v-btn
          variant="tonal"
          color="#5cb85c"
          size="small"
          prepend-icon="mdi-refresh"
          :loading="store.cargandoAccion"
          @click="cargarHistorial"
        >
          Actualizar
        </v-btn>
      </div>

      <!-- Filtros de Búsqueda -->
      <v-row dense>
        <v-col cols="12" sm="3">
          <v-select
            v-model="filtroPlantaId"
            :items="[{ id: undefined, nombre: 'Todas las Plantas' }, ...plantasStore.plantas.filter(p => p.activa)]"
            item-title="nombre"
            item-value="id"
            label="Planta Industrial"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="cargarHistorial"
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
            label="Estado"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="cargarHistorial"
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
            @update:model-value="cargarHistorial"
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
            @update:model-value="cargarHistorial"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Indicador de Carga -->
    <div v-if="store.cargandoAccion && store.historialInspecciones.length === 0" class="d-flex flex-column align-center justify-center py-10">
      <v-progress-circular indeterminate color="#5cb85c" size="36" class="mb-3" />
      <span class="text-caption text-medium-emphasis">Cargando historial de inspecciones...</span>
    </div>

    <!-- Empty State -->
    <v-card
      v-else-if="store.historialInspecciones.length === 0"
      class="text-center py-12 px-4 rounded-lg border-dashed text-medium-emphasis bg-surface"
    >
      <v-icon size="54" color="#5cb85c" class="mb-2">mdi-clipboard-text-outline</v-icon>
      <h4 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-1">
        No se encontraron inspecciones
      </h4>
      <p class="text-body-2 mb-0">
        No hay registros que coincidan con los filtros aplicados.
      </p>
    </v-card>

    <!-- Tabla del Historial -->
    <v-card v-else class="elevation-2 rounded-lg pa-4 bg-surface border">
      <div class="table-responsive">
        <v-table density="comfortable" hover class="rounded border">
          <thead>
            <tr class="bg-slate-50">
              <th class="text-left font-weight-bold">Código Inspección</th>
              <th class="text-left font-weight-bold">Fecha de Registro</th>
              <th class="text-left font-weight-bold">Planta</th>
              <th class="text-left font-weight-bold">Equipo / Línea</th>
              <th class="text-left font-weight-bold">Técnico</th>
              <th class="text-center font-weight-bold">Variables</th>
              <th class="text-center font-weight-bold">Estado</th>
              <th class="text-center font-weight-bold">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in store.historialInspecciones" :key="item.id">
              <td>
                <span class="font-weight-bold font-mono text-primary">{{ item.codigoInspeccion }}</span>
              </td>
              <td class="text-caption">{{ formatearFecha(item.fechaRegistro) }}</td>
              <td>
                <v-chip size="x-small" variant="tonal" color="primary">
                  {{ item.planta?.nombre || 'General' }}
                </v-chip>
              </td>
              <td>
                <div v-if="item.equipo">
                  <span class="font-weight-medium text-body-2">{{ item.equipo.codigo }}</span>
                  <div class="text-caption text-medium-emphasis">{{ item.equipo.nombre }}</div>
                </div>
                <span v-else class="text-caption text-medium-emphasis">General / Planta</span>
              </td>
              <td>
                <span v-if="item.elaboradoPor" class="text-body-2">
                  {{ item.elaboradoPor.nombre }} {{ item.elaboradoPor.apellido }}
                </span>
                <span v-else class="text-caption text-medium-emphasis">—</span>
              </td>
              <td class="text-center">
                <v-chip size="x-small" color="secondary" variant="flat">
                  {{ item._count?.detalles || item.detalles?.length || 0 }} vars
                </v-chip>
              </td>
              <td class="text-center">
                <v-chip size="x-small" :color="colorEstado(item.estadoInspeccion)" variant="flat" class="font-weight-bold">
                  {{ item.estadoInspeccion }}
                </v-chip>
              </td>
              <td class="text-center">
                <v-btn
                  size="small"
                  variant="outlined"
                  color="#5cb85c"
                  prepend-icon="mdi-eye-outline"
                  class="font-weight-bold"
                  @click="abrirDetalle(item)"
                >
                  Ver Detalle
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>

    <!-- Modal Detalle de Inspección -->
    <DetalleInspeccionModal ref="refDetalleModal" />
  </div>
</template>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
