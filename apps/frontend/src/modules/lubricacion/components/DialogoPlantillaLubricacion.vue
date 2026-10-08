<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useLubricacionStore } from '../store/lubricacion.store'
import type {
  PlantillaPuntoLubricacion,
  CrearPlantillaPuntoInput,
  EditarPlantillaPuntoInput,
  CatalogoLubricante
} from '../types/lubricacion.types'

const toast = useToast()
const store = useLubricacionStore()

const visible = ref(false)
const modo = ref<'crear' | 'editar'>('crear')
const idEditando = ref<number | null>(null)
const tipoEquipoId = ref<number>(0)
const nombreComponente = ref('')
const nombrePunto = ref('')
const lubricanteId = ref<number | null>(null)
const limiteHorasCambio = ref<number>(250)
const capacidadRecomendada = ref<number | null>(null)
const guardando = ref(false)
const errorMensaje = ref('')

const frecuenciasRapidas = [100, 250, 500, 1000, 2000, 4000]

const opcionesLubricantes = computed(() => {
  return store.catalogos.map((c: CatalogoLubricante) => ({
    title: `${c.codigo} - ${c.nombre} (${c.tipo}${c.viscosidad ? ` / ${c.viscosidad}` : ''})`,
    value: c.id,
    raw: c
  }))
})

const lubricanteSeleccionado = computed<CatalogoLubricante | null>(() => {
  if (!lubricanteId.value) return null
  return store.catalogos.find((c: CatalogoLubricante) => c.id === lubricanteId.value) || null
})

function aplicarPresetFrecuencia(horas: number) {
  limiteHorasCambio.value = horas
}

function abrirCrear(idTipoEquipo: number) {
  modo.value = 'crear'
  idEditando.value = null
  tipoEquipoId.value = idTipoEquipo
  nombreComponente.value = ''
  nombrePunto.value = ''
  limiteHorasCambio.value = 250
  capacidadRecomendada.value = null
  lubricanteId.value = store.catalogos.length > 0 ? store.catalogos[0].id : null
  errorMensaje.value = ''
  visible.value = true
}

function abrirEditar(item: PlantillaPuntoLubricacion) {
  modo.value = 'editar'
  idEditando.value = item.id
  tipoEquipoId.value = item.tipoEquipoId
  nombreComponente.value = item.nombreComponente || ''
  nombrePunto.value = item.nombrePunto
  limiteHorasCambio.value = Number(item.limiteHorasCambio)
  capacidadRecomendada.value = item.capacidadRecomendada ? Number(item.capacidadRecomendada) : null
  lubricanteId.value = item.lubricanteId
  errorMensaje.value = ''
  visible.value = true
}

function cerrar() {
  visible.value = false
}

async function guardar() {
  errorMensaje.value = ''

  if (!nombrePunto.value.trim()) {
    errorMensaje.value = 'El nombre del punto o parte a lubricar es obligatorio (ej. Rodamientos, Chumacera).'
    return
  }

  if (!lubricanteId.value) {
    errorMensaje.value = 'Debe seleccionar un lubricante asignado.'
    return
  }

  if (!limiteHorasCambio.value || Number(limiteHorasCambio.value) <= 0) {
    errorMensaje.value = 'La frecuencia límite de horas debe ser mayor a cero.'
    return
  }

  if (capacidadRecomendada.value !== null && capacidadRecomendada.value !== undefined && Number(capacidadRecomendada.value) < 0) {
    errorMensaje.value = 'La capacidad recomendada no puede ser negativa.'
    return
  }

  guardando.value = true
  try {
    if (modo.value === 'crear') {
      const payload: CrearPlantillaPuntoInput = {
        tipoEquipoId: tipoEquipoId.value,
        nombreComponente: nombreComponente.value.trim() || null,
        nombrePunto: nombrePunto.value.trim(),
        lubricanteId: lubricanteId.value,
        limiteHorasCambio: Number(limiteHorasCambio.value),
        capacidadRecomendada: capacidadRecomendada.value ? Number(capacidadRecomendada.value) : null
      }
      const res = await store.crearPlantillaPunto(payload)
      if (res.status === 'ok') {
        toast.success('Variable de lubricación agregada a la plantilla y propagada a los equipos')
        cerrar()
      } else {
        errorMensaje.value = res.message
      }
    } else if (idEditando.value) {
      const payload: EditarPlantillaPuntoInput = {
        nombreComponente: nombreComponente.value.trim() || null,
        nombrePunto: nombrePunto.value.trim(),
        lubricanteId: lubricanteId.value,
        limiteHorasCambio: Number(limiteHorasCambio.value),
        capacidadRecomendada: capacidadRecomendada.value ? Number(capacidadRecomendada.value) : null
      }
      const res = await store.editarPlantillaPunto(idEditando.value, payload)
      if (res.status === 'ok') {
        toast.success('Plantilla de lubricación actualizada correctamente')
        cerrar()
      } else {
        errorMensaje.value = res.message
      }
    }
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al guardar plantilla'
  } finally {
    guardando.value = false
  }
}

defineExpose({ abrirCrear, abrirEditar, cerrar })
</script>

<template>
  <v-dialog v-model="visible" max-width="680" persistent scrollable>
    <v-card class="rounded-lg">
      <v-card-item class="bg-primary text-white py-3 px-4">
        <template #prepend>
          <v-icon color="white" size="24" class="me-2">
            {{ modo === 'editar' ? 'mdi-pencil-box-outline' : 'mdi-plus-box-outline' }}
          </v-icon>
        </template>
        <v-card-title class="text-subtitle-1 font-weight-bold">
          {{ modo === 'editar' ? 'Editar Variable de Lubricación en Plantilla' : 'Nueva Variable de Lubricación en Plantilla' }}
        </v-card-title>
        <v-card-subtitle class="text-caption text-white-50">
          Los puntos configurados en esta plantilla se propagan a todos los equipos del tipo seleccionado
        </v-card-subtitle>
      </v-card-item>

      <v-card-text class="pt-4 px-4 px-sm-5">
        <v-alert
          v-if="errorMensaje"
          type="error"
          density="compact"
          variant="tonal"
          closable
          class="mb-3"
          @click:close="errorMensaje = ''"
        >
          {{ errorMensaje }}
        </v-alert>

        <v-row dense>
          <!-- Componente Destino (Opcional) -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="nombreComponente"
              label="Componente Destino (Opcional)"
              placeholder="Ej: Reductor, Motor, Chumacera Central"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-cog-outline"
              hint="Si se especifica, se vinculará a componentes con este nombre."
              persistent-hint
            />
          </v-col>

          <!-- Parte o Punto a Lubricar -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="nombrePunto"
              label="Parte o Punto a Lubricar *"
              placeholder="Ej: Rodamientos, Cárter, Engranajes"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-target"
              hint="Nombre del elemento a intervenir."
              persistent-hint
            />
          </v-col>

          <!-- Lubricante Asignado -->
          <v-col cols="12" class="mt-2">
            <v-autocomplete
              v-model="lubricanteId"
              :items="opcionesLubricantes"
              label="Lubricante Asignado *"
              placeholder="Seleccione lubricante del catálogo..."
              variant="outlined"
              density="compact"
              item-title="title"
              item-value="value"
              auto-select-first
              prepend-inner-icon="mdi-barrel"
            />
          </v-col>

          <!-- Tarjeta de Lubricante Seleccionado -->
          <v-col v-if="lubricanteSeleccionado" cols="12">
            <v-card variant="tonal" color="primary" class="pa-2.5 mb-2 rounded-lg">
              <div class="d-flex align-center justify-space-between flex-wrap gap-2">
                <div class="d-flex align-center gap-2">
                  <v-icon size="18">
                    {{ lubricanteSeleccionado.tipo === 'GRASA' ? 'mdi-dots-grid' : 'mdi-water' }}
                  </v-icon>
                  <span class="font-weight-bold text-caption">{{ lubricanteSeleccionado.nombre }}</span>
                </div>
                <div class="d-flex align-center gap-1 flex-wrap">
                  <v-chip size="x-small" color="primary" variant="flat">
                    {{ lubricanteSeleccionado.tipo }}
                  </v-chip>
                  <v-chip v-if="lubricanteSeleccionado.viscosidad" size="x-small" variant="outlined">
                    {{ lubricanteSeleccionado.viscosidad }}
                  </v-chip>
                  <v-chip size="x-small" variant="outlined">
                    Unidad: {{ lubricanteSeleccionado.unidadMedida }}
                  </v-chip>
                </div>
              </div>
            </v-card>
          </v-col>

          <!-- Frecuencia Límite en Horas -->
          <v-col cols="12" sm="6" class="mt-1">
            <v-text-field
              v-model.number="limiteHorasCambio"
              type="number"
              min="1"
              label="Frecuencia Límite (Horas) *"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-clock-outline"
              suffix="hrs"
              hint="Horas de trabajo permitidas entre cambios."
              persistent-hint
            />

            <!-- Atajos rápidos -->
            <div class="d-flex align-center gap-1 flex-wrap mt-2">
              <span class="text-caption text-medium-emphasis me-1">Atajos:</span>
              <v-chip
                v-for="freq in frecuenciasRapidas"
                :key="freq"
                size="x-small"
                :variant="limiteHorasCambio === freq ? 'flat' : 'outlined'"
                :color="limiteHorasCambio === freq ? 'primary' : undefined"
                class="cursor-pointer"
                @click="aplicarPresetFrecuencia(freq)"
              >
                {{ freq }}h
              </v-chip>
            </div>
          </v-col>

          <!-- Capacidad Recomendada -->
          <v-col cols="12" sm="6" class="mt-1">
            <v-text-field
              v-model.number="capacidadRecomendada"
              type="number"
              min="0"
              step="0.1"
              label="Capacidad Recomendada (Opcional)"
              placeholder="Ej: 0.5, 2.0"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-cup-water"
              :suffix="lubricanteSeleccionado ? lubricanteSeleccionado.unidadMedida.toLowerCase() : 'und'"
              hint="Dosis estándar para este tipo de maquinaria."
              persistent-hint
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider class="my-0" />

      <v-card-actions class="px-4 py-3 justify-end gap-2">
        <v-btn variant="text" color="grey" :disabled="guardando" @click="cerrar">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="guardando"
          prepend-icon="mdi-check-circle"
          @click="guardar"
        >
          {{ modo === 'editar' ? 'Actualizar Plantilla' : 'Guardar en Plantilla' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.cursor-pointer { cursor: pointer; }
</style>
