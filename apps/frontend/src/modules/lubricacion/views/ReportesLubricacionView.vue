<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLubricacionStore } from '../store/lubricacion.store'
import { usePlantasStore } from '@/modules/plantas/plantas.store'
import type { HistorialRutinaItem } from '../types/lubricacion.types'

const lubricacionStore = useLubricacionStore()
const plantasStore = usePlantasStore()

const pestanaActiva = ref('fugas')
const plantaSeleccionada = ref<number | null>(null)
const fechaDesde = ref<string>('')
const fechaHasta = ref<string>('')

// Rutina seleccionada para detalle modal
const rutinaSeleccionada = ref<HistorialRutinaItem | null>(null)
const modalDetalleRutina = ref(false)

onMounted(async () => {
  await Promise.all([
    plantasStore.listarPlantas(),
    cargarDatos()
  ])
})

async function cargarDatos() {
  await Promise.all([
    lubricacionStore.cargarReporteFugas({ plantaId: plantaSeleccionada.value || undefined }),
    lubricacionStore.cargarReporteConsumo({
      plantaId: plantaSeleccionada.value || undefined,
      fechaDesde: fechaDesde.value || undefined,
      fechaHasta: fechaHasta.value || undefined
    }),
    lubricacionStore.cargarHistorialRutinas()
  ])
}

function verDetalleRutina(rutina: HistorialRutinaItem) {
  rutinaSeleccionada.value = rutina
  modalDetalleRutina.value = true
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Encabezado -->
    <div class="d-flex flex-column flex-md-row justify-space-between align-start align-md-center mb-4 gap-3">
      <div>
        <div class="d-flex align-center gap-2">
          <v-avatar color="info" variant="tonal" size="44">
            <v-icon color="info" size="26">mdi-chart-box-outline</v-icon>
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-bold mb-0">Reportes y Auditoría de Lubricación</h1>
            <p class="text-caption text-muted mb-0">
              Monitoreo analítico de fugas activas, control de consumo de inventario e historial de intervenciones
            </p>
          </div>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <v-btn
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-refresh"
          :loading="lubricacionStore.cargandoReportes"
          @click="cargarDatos"
        >
          Refrescar Reportes
        </v-btn>
      </div>
    </div>

    <!-- Barra de Filtros Globales de Reportes -->
    <v-card class="mb-4 elevation-1 border">
      <v-card-text class="py-3">
        <v-row dense align="center">
          <v-col cols="12" sm="4" md="4">
            <v-select
              v-model="plantaSeleccionada"
              :items="plantasStore.plantas"
              item-title="nombre"
              item-value="id"
              label="Filtrar por Planta"
              placeholder="Todas las Plantas"
              clearable
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="cargarDatos"
            />
          </v-col>

          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="fechaDesde"
              type="date"
              label="Fecha Desde"
              variant="outlined"
              density="compact"
              hide-details
              @change="cargarDatos"
            />
          </v-col>

          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="fechaHasta"
              type="date"
              label="Fecha Hasta"
              variant="outlined"
              density="compact"
              hide-details
              @change="cargarDatos"
            />
          </v-col>

          <v-col cols="12" md="2" class="text-md-end">
            <v-btn
              color="primary"
              variant="flat"
              block
              prepend-icon="mdi-filter"
              @click="cargarDatos"
            >
              Filtrar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Pestañas de Reportes -->
    <v-tabs v-model="pestanaActiva" color="primary" class="mb-4">
      <v-tab value="fugas">
        <v-icon start>mdi-water-alert</v-icon>
        Fugas Detectadas ({{ lubricacionStore.reporteFugas.length }})
      </v-tab>
      <v-tab value="consumo">
        <v-icon start>mdi-gas-station</v-icon>
        Consumo de Lubricantes
      </v-tab>
      <v-tab value="historial">
        <v-icon start>mdi-history</v-icon>
        Historial de Rutinas Diarias
      </v-tab>
    </v-tabs>

    <v-window v-model="pestanaActiva">
      <!-- 1. PESTAÑA: FUGAS DETECTADAS -->
      <v-window-item value="fugas">
        <v-card class="elevation-1 border">
          <v-card-text class="pa-0">
            <div v-if="lubricacionStore.reporteFugas.length === 0" class="text-center py-8 text-muted">
              <v-icon size="48" color="success" class="mb-2">mdi-check-circle-outline</v-icon>
              <div class="text-subtitle-1 font-weight-bold">No hay fugas reportadas</div>
              <p class="text-caption">No se han registrado puntos con fugas en las inspecciones consultadas.</p>
            </div>

            <v-table v-else density="comfortable" hover>
              <thead class="bg-light">
                <tr>
                  <th>Fecha</th>
                  <th>Rutina</th>
                  <th>Equipo</th>
                  <th>Planta / Ubicación</th>
                  <th>Punto con Fuga</th>
                  <th>Lubricante</th>
                  <th>Observaciones / Diagnóstico</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="fuga in lubricacionStore.reporteFugas" :key="`${fuga.rutinaId}-${fuga.puntoId}`">
                  <td class="text-caption font-weight-medium">
                    {{ new Date(fuga.fechaEjecucion).toLocaleString() }}
                  </td>
                  <td>
                    <span class="badge bg-secondary-subtle text-dark">{{ fuga.codigoRutina }}</span>
                  </td>
                  <td>
                    <strong>{{ fuga.equipoCodigo }}</strong> - {{ fuga.equipoNombre }}
                  </td>
                  <td class="text-caption">
                    {{ fuga.plantaNombre }} &bull; {{ fuga.ubicacionNombre }}
                  </td>
                  <td>
                    <v-chip color="error" size="small" variant="flat" class="font-weight-bold">
                      <v-icon start size="14">mdi-water-alert</v-icon>
                      {{ fuga.puntoNombre }}
                    </v-chip>
                  </td>
                  <td>{{ fuga.lubricanteNombre }}</td>
                  <td class="text-caption text-danger font-weight-medium">
                    {{ fuga.observaciones || 'Fuga detectada sin detalle adicional' }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- 2. PESTAÑA: CONSUMO DE LUBRICANTES -->
      <v-window-item value="consumo">
        <v-card class="elevation-1 border">
          <v-card-text class="pa-0">
            <div v-if="lubricacionStore.reporteConsumo.length === 0" class="text-center py-8 text-muted">
              <v-icon size="48" color="grey" class="mb-2">mdi-oil-level</v-icon>
              <div class="text-subtitle-1">No hay reposiciones registradas en el período seleccionado</div>
            </div>

            <v-table v-else density="comfortable" hover>
              <thead class="bg-light">
                <tr>
                  <th>Código</th>
                  <th>Lubricante</th>
                  <th>Tipo</th>
                  <th>Unidad</th>
                  <th class="text-end">Total Consumido</th>
                  <th class="text-end">Intervenciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in lubricacionStore.reporteConsumo" :key="c.lubricanteId">
                  <td class="font-weight-bold">{{ c.lubricanteCodigo }}</td>
                  <td>{{ c.lubricanteNombre }}</td>
                  <td>
                    <span class="badge bg-light text-dark border">{{ c.tipo }}</span>
                  </td>
                  <td>{{ c.unidadMedida }}</td>
                  <td class="text-end font-weight-bold text-primary text-body-1">
                    {{ c.totalRepuesto.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) }}
                  </td>
                  <td class="text-end">{{ c.intervenciones }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- 3. PESTAÑA: HISTORIAL DE RUTINAS -->
      <v-window-item value="historial">
        <v-card class="elevation-1 border">
          <v-card-text class="pa-0">
            <div v-if="lubricacionStore.historialRutinas.length === 0" class="text-center py-8 text-muted">
              <v-icon size="48" color="grey" class="mb-2">mdi-clipboard-text-clock</v-icon>
              <div class="text-subtitle-1">No hay historial de rutinas registradas</div>
            </div>

            <v-table v-else density="comfortable" hover>
              <thead class="bg-light">
                <tr>
                  <th>Fecha</th>
                  <th>Código Rutina</th>
                  <th>Equipo</th>
                  <th>Odómetro Registrado</th>
                  <th>Técnico Responsable</th>
                  <th>Puntos Inspeccionados</th>
                  <th>Observaciones</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rutina in lubricacionStore.historialRutinas" :key="rutina.id">
                  <td class="text-caption font-weight-medium">
                    {{ new Date(rutina.fechaEjecucion).toLocaleString() }}
                  </td>
                  <td>
                    <span class="badge bg-primary-subtle text-primary font-weight-bold">
                      {{ rutina.codigoRutina }}
                    </span>
                  </td>
                  <td>
                    <strong>{{ rutina.equipo.codigo }}</strong> - {{ rutina.equipo.nombre }}
                  </td>
                  <td class="font-weight-bold text-info">
                    {{ rutina.horometroRegistrado.toLocaleString() }} hrs
                  </td>
                  <td class="text-caption">
                    {{ rutina.ejecutadoPor.nombre }} {{ rutina.ejecutadoPor.apellido }}
                  </td>
                  <td>
                    <v-chip size="small" variant="flat" color="grey-lighten-2">
                      {{ rutina.detalles.length }} puntos
                    </v-chip>
                  </td>
                  <td class="text-caption text-truncate" style="max-width: 200px;">
                    {{ rutina.observaciones || '-' }}
                  </td>
                  <td class="text-center">
                    <v-btn
                      size="small"
                      variant="text"
                      color="primary"
                      icon="mdi-eye"
                      @click="verDetalleRutina(rutina)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Modal Detalle de Rutina -->
    <v-dialog v-model="modalDetalleRutina" max-width="700">
      <v-card v-if="rutinaSeleccionada">
        <v-card-item class="bg-primary text-white py-3">
          <template #prepend>
            <v-icon color="white">mdi-clipboard-list</v-icon>
          </template>
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Detalle de Rutina: {{ rutinaSeleccionada.codigoRutina }}
          </v-card-title>
          <v-card-subtitle class="text-caption text-white-50">
            Equipo: {{ rutinaSeleccionada.equipo.nombre }} | Odómetro: {{ rutinaSeleccionada.horometroRegistrado }} hrs
          </v-card-subtitle>
        </v-card-item>

        <v-card-text class="pt-4">
          <div class="mb-3 text-caption text-muted">
            Ejecutado por: <strong>{{ rutinaSeleccionada.ejecutadoPor.nombre }} {{ rutinaSeleccionada.ejecutadoPor.apellido }}</strong>
            ({{ new Date(rutinaSeleccionada.fechaEjecucion).toLocaleString() }})
          </div>

          <v-table density="compact" class="border rounded">
            <thead>
              <tr class="bg-light">
                <th>Punto</th>
                <th>Lubricante</th>
                <th>Nivel</th>
                <th>Reposición</th>
                <th>Fuga</th>
                <th>Cambio Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in rutinaSeleccionada.detalles" :key="d.id">
                <td class="font-weight-medium">{{ d.puntoLubricacion.nombrePunto }}</td>
                <td class="text-caption">{{ d.puntoLubricacion.lubricante.nombre }}</td>
                <td>
                  <span class="badge bg-light text-dark">{{ d.nivelLubricante }}</span>
                </td>
                <td>
                  <span v-if="d.seRealizoReposicion" class="text-success font-weight-bold">
                    +{{ d.cantidadRepuesta }} {{ d.puntoLubricacion.lubricante.unidadMedida.toLowerCase() }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <v-chip v-if="d.presentaFuga" color="error" size="x-small" variant="flat">
                    FUGA
                  </v-chip>
                  <span v-else class="text-muted">No</span>
                </td>
                <td>
                  <span v-if="d.seRealizoCambioTotal" class="text-info font-weight-bold">Sí (0h)</span>
                  <span v-else class="text-muted">No</span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>

        <v-divider class="my-0" />

        <v-card-actions class="px-4 py-3">
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="modalDetalleRutina = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
