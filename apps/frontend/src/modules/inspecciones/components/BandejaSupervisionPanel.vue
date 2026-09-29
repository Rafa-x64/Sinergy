<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useInspeccionesStore, type InspeccionMaestra } from '../inspecciones.store'
import DetalleInspeccionModal from './DetalleInspeccionModal.vue'
import ModalImpresionInspeccion from './ModalImpresionInspeccion.vue'

const store = useInspeccionesStore()
const refDetalleModal = ref<InstanceType<typeof DetalleInspeccionModal> | null>(null)
const refModalImpresion = ref<InstanceType<typeof ModalImpresionInspeccion> | null>(null)
const cargandoImpresionId = ref<string | null>(null)

onMounted(async () => {
  await store.cargarPendientes()
})

const abrirDetalle = async (inspeccion: InspeccionMaestra) => {
  await store.cargarDetalleInspeccion(inspeccion.id)
  refDetalleModal.value?.abrir()
}

const imprimirInspeccion = async (inspeccion: InspeccionMaestra) => {
  cargandoImpresionId.value = inspeccion.id
  try {
    const res = await store.cargarDetalleInspeccion(inspeccion.id)
    if (res.status === 'ok' && store.inspeccionActiva) {
      refModalImpresion.value?.abrir(store.inspeccionActiva)
    }
  } finally {
    cargandoImpresionId.value = null
  }
}

const formatearFecha = (f?: string) => {
  if (!f) return '—'
  return new Date(f).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
function formatearTipoInspeccion(tipo?: string) {
  switch (tipo) {
    case 'CHILLER':
      return 'Rutina Chillers'
    case 'COMPRESOR':
      return 'Rutina Compresores'
    case 'GENERADOR':
      return 'Rutina Generadores'
    case 'MONTACARGAS':
      return 'Rutina Montacargas'
    case 'VARIABLES_CRITICAS':
    default:
      return 'Variables Críticas'
  }
}

function colorTipoInspeccion(tipo?: string) {
  switch (tipo) {
    case 'CHILLER':
      return 'cyan'
    case 'COMPRESOR':
      return 'teal'
    case 'GENERADOR':
      return 'amber'
    case 'MONTACARGAS':
      return 'indigo'
    case 'VARIABLES_CRITICAS':
    default:
      return 'primary'
  }
}
</script>

<template>
  <div class="bandeja-supervision-panel">
    <v-card class="elevation-2 rounded-lg pa-4 bg-surface border mb-3">
      <div class="d-flex align-center justify-space-between flex-wrap gap-2">
        <div class="d-flex align-center">
          <v-avatar color="#5cb85c" variant="tonal" size="40" class="mr-3">
            <v-icon size="24" color="#5cb85c">mdi-clipboard-clock-outline</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">
              Bandeja de Inspecciones Pendientes por Aprobar
            </h3>
            <span class="text-caption text-medium-emphasis">
              Revisa las mediciones reportadas por el personal técnico y valida las anomalías fuera de rango operativo.
            </span>
          </div>
        </div>

        <v-btn
          variant="outlined"
          color="#5cb85c"
          size="small"
          prepend-icon="mdi-refresh"
          :loading="store.cargandoAccion"
          @click="store.cargarPendientes()"
        >
          Refrescar Bandeja
        </v-btn>
      </div>
    </v-card>

    <!-- Indicador de Carga -->
    <div v-if="store.cargandoAccion && store.inspeccionesPendientes.length === 0" class="d-flex flex-column align-center justify-center py-10">
      <v-progress-circular indeterminate color="#5cb85c" size="36" class="mb-3" />
      <span class="text-caption text-medium-emphasis">Cargando inspecciones pendientes...</span>
    </div>

    <!-- Empty State -->
    <v-card
      v-else-if="store.inspeccionesPendientes.length === 0"
      class="text-center py-12 px-4 rounded-lg border-dashed text-medium-emphasis bg-surface"
    >
      <v-icon size="54" color="#5cb85c" class="mb-2">mdi-check-all</v-icon>
      <h4 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-1">
        ¡Todo al día! No hay inspecciones pendientes de revisión.
      </h4>
      <p class="text-body-2 mb-0">
        Todas las inspecciones registradas han sido procesadas o aprobadas.
      </p>
    </v-card>

    <!-- Tabla de Inspecciones Pendientes -->
    <v-card v-else class="elevation-2 rounded-lg pa-4 bg-surface border">
      <div class="table-responsive">
        <v-table density="comfortable" hover class="rounded border">
          <thead>
            <tr class="table-header-row">
              <th class="text-left font-weight-bold">Código Inspección</th>
              <th class="text-left font-weight-bold">Rutina</th>
              <th class="text-left font-weight-bold">Técnico Elaborador</th>
              <th class="text-center font-weight-bold">Planta / Cobertura</th>
              <th class="text-center font-weight-bold">Fecha Registro</th>
              <th class="text-center font-weight-bold">Variables Evaluadas</th>
              <th class="text-center font-weight-bold">Estado</th>
              <th class="text-center font-weight-bold">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in store.inspeccionesPendientes" :key="item.id">
              <td class="font-weight-bold text-primary">
                {{ item.codigoInspeccion }}
              </td>

              <td>
                <v-chip size="x-small" :color="colorTipoInspeccion(item.tipoInspeccion)" variant="tonal" class="font-weight-bold">
                  {{ formatearTipoInspeccion(item.tipoInspeccion) }}
                </v-chip>
              </td>

              <td class="font-weight-medium text-high-emphasis">
                {{ item.elaboradoPor?.nombre }} {{ item.elaboradoPor?.apellido }}
              </td>

              <td class="text-center">
                <v-chip size="x-small" variant="tonal" color="#5cb85c" class="font-weight-medium">
                  {{ item.planta?.nombre ?? 'General' }}
                </v-chip>
              </td>

              <td class="text-center text-body-2 text-medium-emphasis">
                {{ formatearFecha(item.fechaRegistro) }}
              </td>

              <td class="text-center">
                <v-chip
                  v-if="item.codigoInspeccion.startsWith('INSP-LUB') || (item._count?.detalles ?? 0) === 0"
                  size="x-small"
                  variant="flat"
                  color="teal"
                  class="font-weight-medium"
                >
                  <v-icon start size="13">mdi-oil</v-icon>
                  Rutina Lubricación
                </v-chip>
                <v-chip v-else size="x-small" variant="flat" color="info">
                  {{ item._count?.detalles ?? 0 }} variables
                </v-chip>
              </td>

              <td class="text-center">
                <v-chip size="x-small" color="warning" variant="tonal" class="font-weight-bold">
                  PENDIENTE
                </v-chip>
              </td>

              <td class="text-center">
                <div class="d-flex align-center justify-center gap-1">
                  <v-btn
                    color="#5cb85c"
                    size="x-small"
                    variant="flat"
                    prepend-icon="mdi-eye-outline"
                    @click="abrirDetalle(item)"
                  >
                    Revisar
                  </v-btn>
                  <v-btn
                    size="x-small"
                    variant="tonal"
                    color="primary"
                    icon="mdi-printer"
                    title="Imprimir"
                    :loading="cargandoImpresionId === item.id"
                    @click="imprimirInspeccion(item)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>

    <!-- Modal de Detalle y Evaluación -->
    <DetalleInspeccionModal ref="refDetalleModal" />

    <!-- Modal de Impresión Oficial -->
    <ModalImpresionInspeccion ref="refModalImpresion" />
  </div>
</template>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.table-header-row th {
  background-color: rgba(var(--v-theme-on-surface), 0.04) !important;
  font-size: 0.8125rem !important;
}

.border-dashed {
  border: 1px dashed rgba(var(--v-theme-border), 0.9);
}
</style>
