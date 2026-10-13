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
const tipoFrecuencia = ref<'HORAS' | 'SEMANAS'>('HORAS')
const limiteHorasCambio = ref<number>(250)
const limiteSemanasCambio = ref<number>(4)
const capacidadRecomendada = ref<number | null>(null)
const guardando = ref(false)
const errorMensaje = ref('')

// Presets de frecuencia por horas y por semanas
const frecuenciasRapidasHoras = [100, 250, 500, 1000, 2000, 4000]
const frecuenciasRapidasSemanas = [1, 2, 4, 8, 12, 24]

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

function abrirCrear(idTipoEquipo: number) {
  modo.value = 'crear'
  idEditando.value = null
  tipoEquipoId.value = idTipoEquipo
  nombreComponente.value = ''
  nombrePunto.value = ''
  tipoFrecuencia.value = 'HORAS'
  limiteHorasCambio.value = 250
  limiteSemanasCambio.value = 4
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
  const hrs = Number(item.limiteHorasCambio)
  if (hrs >= 168 && hrs % 168 === 0) {
    tipoFrecuencia.value = 'SEMANAS'
    limiteSemanasCambio.value = hrs / 168
    limiteHorasCambio.value = hrs
  } else {
    tipoFrecuencia.value = 'HORAS'
    limiteHorasCambio.value = hrs
    limiteSemanasCambio.value = Math.max(1, Math.round(hrs / 168))
  }
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
    const horasFinal = tipoFrecuencia.value === 'SEMANAS'
      ? Number(limiteSemanasCambio.value) * 168
      : Number(limiteHorasCambio.value)

    if (modo.value === 'crear') {
      const payload: CrearPlantillaPuntoInput = {
        tipoEquipoId: tipoEquipoId.value,
        nombreComponente: nombreComponente.value.trim() || null,
        nombrePunto: nombrePunto.value.trim(),
        lubricanteId: lubricanteId.value,
        limiteHorasCambio: horasFinal,
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
        limiteHorasCambio: horasFinal,
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

          <!-- Frecuencia Límite: Horas vs Semanas -->
          <v-col cols="12" sm="6" class="mt-1">
            <div class="d-flex align-center gap-2 mb-2">
              <span class="text-caption font-weight-bold">Control de Ciclo:</span>
              <v-btn-toggle
                v-model="tipoFrecuencia"
                mandatory
                density="compact"
                color="primary"
                variant="outlined"
              >
                <v-btn value="HORAS" size="x-small" class="text-none font-weight-medium">
                  <v-icon start size="14">mdi-clock-outline</v-icon>
                  Horómetro (hrs)
                </v-btn>
                <v-btn value="SEMANAS" size="x-small" class="text-none font-weight-medium">
                  <v-icon start size="14">mdi-calendar-week</v-icon>
                  Semanal (sem)
                </v-btn>
              </v-btn-toggle>
            </div>

            <!-- Entrada en Horas -->
            <div v-if="tipoFrecuencia === 'HORAS'">
              <v-text-field
                v-model.number="limiteHorasCambio"
                type="number"
                min="1"
                label="Frecuencia Límite (Horas) *"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-clock-outline"
                suffix="hrs"
                :hint="`Equivale a aprox. ${(limiteHorasCambio / 168).toFixed(1)} semanas a 24h/día.`"
                persistent-hint
                @keydown="(e: KeyboardEvent) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault() }"
                @update:model-value="(val) => { if (val !== null && val !== undefined && Number(val) < 1) limiteHorasCambio = 1 }"
              />

              <!-- Atajos rápidos Horas -->
              <div class="d-flex align-center gap-1 flex-wrap mt-2">
                <span class="text-caption text-medium-emphasis me-1">Atajos:</span>
                <v-chip
                  v-for="freq in frecuenciasRapidasHoras"
                  :key="freq"
                  size="x-small"
                  :variant="limiteHorasCambio === freq ? 'flat' : 'outlined'"
                  :color="limiteHorasCambio === freq ? 'primary' : undefined"
                  class="cursor-pointer"
                  @click="limiteHorasCambio = freq"
                >
                  {{ freq }}h
                </v-chip>
              </div>
            </div>

            <!-- Entrada en Semanas -->
            <div v-else>
              <v-text-field
                v-model.number="limiteSemanasCambio"
                type="number"
                min="1"
                label="Frecuencia Límite (Semanas) *"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-calendar-week"
                suffix="sem"
                :hint="`${limiteSemanasCambio || 0} semanas = ${(limiteSemanasCambio || 0) * 168} hrs de operación continua.`"
                persistent-hint
                @keydown="(e: KeyboardEvent) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault() }"
                @update:model-value="(val) => { if (val !== null && val !== undefined && Number(val) < 1) limiteSemanasCambio = 1 }"
              />

              <!-- Atajos rápidos Semanas -->
              <div class="d-flex align-center gap-1 flex-wrap mt-2">
                <span class="text-caption text-medium-emphasis me-1">Atajos:</span>
                <v-chip
                  v-for="sem in frecuenciasRapidasSemanas"
                  :key="sem"
                  size="x-small"
                  :variant="limiteSemanasCambio === sem ? 'flat' : 'outlined'"
                  :color="limiteSemanasCambio === sem ? 'primary' : undefined"
                  class="cursor-pointer"
                  @click="limiteSemanasCambio = sem"
                >
                  {{ sem }} sem
                </v-chip>
              </div>
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
