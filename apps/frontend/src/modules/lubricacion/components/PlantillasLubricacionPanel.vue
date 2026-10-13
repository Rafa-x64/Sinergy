<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useLubricacionStore } from '../store/lubricacion.store'
import { useVariablesStore } from '@/modules/variables/variables.store'
import DialogoPlantillaLubricacion from './DialogoPlantillaLubricacion.vue'
import type { PlantillaPuntoLubricacion } from '../types/lubricacion.types'

const toast = useToast()
const lubricacionStore = useLubricacionStore()
const variablesStore = useVariablesStore()

const refDialogo = ref<InstanceType<typeof DialogoPlantillaLubricacion> | null>(null)
const tipoEquipoSeleccionadoId = ref<number | null>(null)
const busqueda = ref('')

const mostrarDialogoEliminar = ref(false)
const plantillaAEliminar = ref<PlantillaPuntoLubricacion | null>(null)

const mostrarDialogoSincronizar = ref(false)
const ejecutandoSincronizacion = ref(false)

onMounted(async () => {
  if (variablesStore.tiposEquipo.length === 0) {
    await variablesStore.cargarTiposEquipo()
  }
  if (variablesStore.tiposEquipo.length > 0 && !tipoEquipoSeleccionadoId.value) {
    tipoEquipoSeleccionadoId.value = variablesStore.tiposEquipo[0].id
    await lubricacionStore.cargarPlantillas(tipoEquipoSeleccionadoId.value)
  }
})

const tipoEquipoActual = computed(() => {
  return variablesStore.tiposEquipo.find(t => t.id === tipoEquipoSeleccionadoId.value) || null
})

const plantillasFiltradas = computed(() => {
  const lista = lubricacionStore.plantillas
  const termino = busqueda.value.trim().toLowerCase()
  if (!termino) return lista

  return lista.filter((p) => {
    return (
      p.nombrePunto.toLowerCase().includes(termino) ||
      (p.nombreComponente && p.nombreComponente.toLowerCase().includes(termino)) ||
      (p.lubricante && p.lubricante.nombre.toLowerCase().includes(termino)) ||
      (p.lubricante && p.lubricante.codigo.toLowerCase().includes(termino))
    )
  })
})

async function alCambiarTipoEquipo(id: number | null) {
  if (!id) return
  tipoEquipoSeleccionadoId.value = id
  busqueda.value = ''
  await lubricacionStore.cargarPlantillas(id)
}

function abrirCrear() {
  if (!tipoEquipoSeleccionadoId.value) {
    toast.warning('Seleccione un tipo de equipo primero')
    return
  }
  refDialogo.value?.abrirCrear(tipoEquipoSeleccionadoId.value)
}

function abrirEditar(item: PlantillaPuntoLubricacion) {
  refDialogo.value?.abrirEditar(item)
}

function confirmarEliminar(item: PlantillaPuntoLubricacion) {
  plantillaAEliminar.value = item
  mostrarDialogoEliminar.value = true
}

async function ejecutarEliminar() {
  if (!plantillaAEliminar.value) return
  const res = await lubricacionStore.eliminarPlantillaPunto(plantillaAEliminar.value.id)
  if (res.status === 'ok') {
    toast.success('Punto eliminado de la plantilla.')
    mostrarDialogoEliminar.value = false
    if (tipoEquipoSeleccionadoId.value) {
      await lubricacionStore.cargarPlantillas(tipoEquipoSeleccionadoId.value)
    }
  } else {
    toast.error(res.message)
  }
}

function confirmarSincronizar() {
  if (!tipoEquipoSeleccionadoId.value) return
  mostrarDialogoSincronizar.value = true
}

async function ejecutarSincronizar() {
  if (!tipoEquipoSeleccionadoId.value) return
  ejecutandoSincronizacion.value = true
  try {
    const res = await lubricacionStore.sincronizarTipoEquipo(tipoEquipoSeleccionadoId.value)
    if (res.status === 'ok') {
      toast.success(res.message || 'Sincronización masiva de lubricación completada con éxito')
      mostrarDialogoSincronizar.value = false
      await lubricacionStore.cargarPlantillas(tipoEquipoSeleccionadoId.value)
    } else {
      toast.error(res.message || 'Error al sincronizar equipos')
    }
  } finally {
    ejecutandoSincronizacion.value = false
  }
}
</script>

<template>
  <div class="plantillas-lubricacion-panel">
    <!-- Selector Superior de Tipo de Equipo -->
    <v-card class="elevation-1 rounded-lg mb-3 pa-3 bg-surface border">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <div class="d-flex align-center flex-grow-1 flex-wrap gap-2" style="min-width: 320px; max-width: 520px">
          <v-autocomplete
            :model-value="tipoEquipoSeleccionadoId"
            :items="variablesStore.tiposEquipo"
            item-title="nombre"
            item-value="id"
            label="Tipo de Equipo"
            placeholder="Escribe para buscar (ej. EXTRUSORA, ACAMPANADORA...)"
            density="compact"
            variant="outlined"
            hide-details
            prepend-inner-icon="mdi-cog-box"
            clearable
            class="flex-grow-1"
            @update:model-value="alCambiarTipoEquipo"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :title="item.raw.nombre">
                <template #prepend>
                  <v-icon size="18" color="primary">mdi-cog-box</v-icon>
                </template>
                <template #append v-if="item.raw.descripcion">
                  <span class="text-caption text-medium-emphasis">{{ item.raw.descripcion }}</span>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
          <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">
            {{ variablesStore.tiposEquipo.length }} tipos
          </v-chip>
        </div>

        <div class="d-flex align-center gap-2 flex-wrap">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            size="small"
            @click="abrirCrear"
          >
            Nueva Variable de Lubricación
          </v-btn>

          <v-btn
            color="teal"
            variant="tonal"
            prepend-icon="mdi-sync"
            size="small"
            :disabled="lubricacionStore.plantillas.length === 0"
            @click="confirmarSincronizar"
          >
            Sincronizar Todos los Equipos
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- Tabla Principal de Plantillas de Lubricación -->
    <v-card class="elevation-2 rounded-lg pa-4 bg-surface border">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
        <div>
          <h3 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">
            Plantilla de Lubricación para: {{ tipoEquipoActual?.nombre ?? 'Tipo de Equipo' }}
          </h3>
          <span class="text-caption text-medium-emphasis">
            Las partes y lubricantes configurados aquí se sincronizan automáticamente a todos los equipos de este tipo.
          </span>
        </div>

        <div class="d-flex align-center gap-2 flex-wrap">
          <v-text-field
            v-model="busqueda"
            prepend-inner-icon="mdi-magnify"
            placeholder="Filtrar partes..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
            style="min-width: 200px; max-width: 280px"
          />

          <v-chip size="small" variant="flat" color="primary">
            {{ plantillasFiltradas.length }} partes en plantilla
          </v-chip>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="lubricacionStore.cargandoPlantillas" class="d-flex flex-column align-center justify-center py-10">
        <v-progress-circular indeterminate color="primary" size="36" class="mb-3" />
        <span class="text-caption text-medium-emphasis">Cargando plantillas de lubricación...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="plantillasFiltradas.length === 0"
        class="text-center py-12 px-4 rounded border-dashed text-medium-emphasis"
      >
        <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-oil-lamp</v-icon>
        <h4 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-1">
          {{ busqueda ? 'No hay partes que coincidan con la búsqueda' : 'No hay partes de lubricación en esta plantilla' }}
        </h4>
        <p class="text-body-2 mb-3">
          {{ busqueda ? 'Intente con otro término de búsqueda.' : `Configure las partes y lubricantes estándar para ${tipoEquipoActual?.nombre ?? 'este tipo de maquinaria'}.` }}
        </p>
        <v-btn v-if="!busqueda" color="primary" variant="flat" prepend-icon="mdi-plus" size="small" @click="abrirCrear">
          Añadir Primera Parte a Plantilla
        </v-btn>
      </div>

      <!-- Tabla de Plantillas -->
      <div v-else class="table-responsive">
        <v-table density="comfortable" hover class="rounded border">
          <thead>
            <tr class="table-header-row">
              <th class="text-left font-weight-bold">Componente Destino</th>
              <th class="text-left font-weight-bold">Parte a Lubricar</th>
              <th class="text-left font-weight-bold">Lubricante Asignado</th>
              <th class="text-center font-weight-bold">Frecuencia Límite</th>
              <th class="text-center font-weight-bold">Capacidad Dosis</th>
              <th class="text-center font-weight-bold">Equipos Vinculados</th>
              <th class="text-center font-weight-bold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in plantillasFiltradas" :key="item.id">
              <!-- Componente -->
              <td class="text-left">
                <v-chip
                  v-if="item.nombreComponente"
                  size="x-small"
                  variant="tonal"
                  color="indigo"
                  class="font-weight-bold"
                >
                  <v-icon start size="12">mdi-puzzle-outline</v-icon>
                  {{ item.nombreComponente }}
                </v-chip>
                <v-chip
                  v-else
                  size="x-small"
                  variant="outlined"
                  color="secondary"
                  class="font-weight-medium"
                >
                  Equipo General
                </v-chip>
              </td>

              <!-- Parte a Lubricar -->
              <td class="font-weight-medium text-high-emphasis">
                <div class="text-subtitle-2 font-weight-bold text-high-emphasis">{{ item.nombrePunto }}</div>
              </td>

              <!-- Lubricante Asignado -->
              <td>
                <div v-if="item.lubricante">
                  <span class="font-weight-bold text-body-2">{{ item.lubricante.nombre }}</span>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.lubricante.tipo }} &bull; {{ item.lubricante.viscosidad || 'N/A' }}
                  </div>
                </div>
                <span v-else class="text-medium-emphasis">—</span>
              </td>

              <!-- Frecuencia Límite -->
              <td class="text-center">
                <v-chip size="x-small" variant="tonal" color="primary" class="font-weight-bold">
                  <span v-if="Number(item.limiteHorasCambio) >= 168 && Number(item.limiteHorasCambio) % 168 === 0">
                    {{ Number(item.limiteHorasCambio) / 168 }} sem
                  </span>
                  <span v-else>
                    {{ item.limiteHorasCambio }} hrs
                  </span>
                </v-chip>
                <div v-if="Number(item.limiteHorasCambio) >= 168 && Number(item.limiteHorasCambio) % 168 === 0" class="text-caption text-medium-emphasis">
                  {{ item.limiteHorasCambio }} hrs
                </div>
              </td>

              <!-- Capacidad Recomendada -->
              <td class="text-center text-body-2">
                <span v-if="item.capacidadRecomendada" class="font-weight-medium">
                  {{ item.capacidadRecomendada }} {{ item.lubricante?.unidadMedida.toLowerCase() || 'und' }}
                </span>
                <span v-else class="text-medium-emphasis">—</span>
              </td>

              <!-- Instancias Activas -->
              <td class="text-center">
                <v-chip
                  size="x-small"
                  variant="tonal"
                  :color="(item._count?.puntosInstancia ?? 0) > 0 ? 'info' : 'grey'"
                  class="font-weight-medium"
                >
                  <v-icon start size="12">mdi-link-variant</v-icon>
                  {{ item._count?.puntosInstancia ?? 0 }} {{ (item._count?.puntosInstancia ?? 0) === 1 ? 'equipo' : 'equipos' }}
                </v-chip>
              </td>

              <!-- Acciones -->
              <td class="text-center">
                <div class="d-flex justify-center gap-1">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="primary"
                    title="Editar Parte de Plantilla"
                    @click="abrirEditar(item)"
                  >
                    <v-icon size="18">mdi-pencil-outline</v-icon>
                  </v-btn>

                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="error"
                    title="Eliminar de Plantilla"
                    @click="confirmarEliminar(item)"
                  >
                    <v-icon size="18">mdi-delete-outline</v-icon>
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>

    <!-- Modal Formulario de Plantilla de Lubricación -->
    <DialogoPlantillaLubricacion ref="refDialogo" />

    <!-- Diálogo Confirmar Eliminación -->
    <v-dialog v-model="mostrarDialogoEliminar" max-width="440px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-error text-white py-3 px-4 d-flex align-center">
          <v-icon start>mdi-alert-octagon</v-icon>
          <span>Eliminar de Plantilla</span>
        </v-card-title>
        <v-card-text class="pa-4 pt-5">
          <p class="text-body-1 mb-2 text-high-emphasis">
            ¿Está seguro de que desea eliminar la parte <strong>{{ plantillaAEliminar?.nombrePunto }}</strong> de la plantilla?
          </p>
          <p class="text-caption text-medium-emphasis mb-0">
            Al sincronizar los equipos de este tipo, esta parte dejará de estar vinculada a la plantilla.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end">
          <v-btn variant="text" @click="mostrarDialogoEliminar = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="flat" @click="ejecutarEliminar">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo Confirmar Sincronización Masiva -->
    <v-dialog v-model="mostrarDialogoSincronizar" max-width="480px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-teal text-white py-3 px-4 d-flex align-center">
          <v-icon start>mdi-sync</v-icon>
          <span>Sincronización Masiva de Lubricación</span>
        </v-card-title>
        <v-card-text class="pa-4 pt-5">
          <p class="text-body-1 mb-2 text-high-emphasis">
            ¿Desea propagar las partes y lubricantes de la plantilla a <strong>todos los equipos</strong> de tipo <strong>{{ tipoEquipoActual?.nombre }}</strong>?
          </p>
          <p class="text-caption text-medium-emphasis mb-0">
            Se crearán automáticamente las partes faltantes en cada equipo (con horómetro base actual) y se actualizarán las frecuencias y lubricantes en las partes existentes.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end">
          <v-btn variant="text" :disabled="ejecutandoSincronizacion" @click="mostrarDialogoSincronizar = false">
            Cancelar
          </v-btn>
          <v-btn color="teal" variant="flat" :loading="ejecutandoSincronizacion" @click="ejecutarSincronizar">
            Sincronizar Todos
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.plantillas-lubricacion-panel {
  width: 100%;
}
.table-responsive {
  width: 100%;
  overflow-x: auto;
}
.table-header-row th {
  background-color: rgba(var(--v-theme-on-surface), 0.04) !important;
  font-size: 0.8125rem !important;
  white-space: nowrap;
}
.border-dashed {
  border: 1px dashed rgba(var(--v-theme-border), 0.9);
}
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
