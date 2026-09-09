<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLubricacionStore } from '../store/lubricacion.store'
import { useComponenteStore, type Componente } from '@/modules/componentes/componente.store'
import type { CatalogoLubricante, PuntoMatriz, FilaMatrizLubricacion } from '../types/lubricacion.types'

const props = defineProps<{
  modelValue: boolean
  modo: 'crear' | 'editar'
  equipoId: number
  equipoNombre: string
  horometroActual: number
  parteEditar?: PuntoMatriz | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardado'): void
}>()

const lubricacionStore = useLubricacionStore()
const componenteStore = useComponenteStore()

// Estado del formulario
const equipoIdLocal = ref<number | null>(null)
const componenteIdLocal = ref<number | null>(null)
const mostrarCrearComponente = ref(false)
const nuevoComponenteNombre = ref('')
const creandoComponente = ref(false)
const nombrePunto = ref('')
const lubricanteId = ref<number | null>(null)
const limiteHorasCambio = ref<number>(250)
const capacidadRecomendada = ref<number | null>(null)
const guardando = ref(false)
const errorMensaje = ref('')
const cargandoComponentes = ref(false)

// Presets comunes de frecuencia para operadores de planta
const frecuenciasRapidas = [100, 250, 500, 1000, 2000, 4000]

// Lista de equipos de la matriz
const listaEquipos = computed(() => {
  return lubricacionStore.matriz.map((m: FilaMatrizLubricacion) => ({
    title: `${m.equipoCodigo} - ${m.equipoNombre}`,
    value: m.equipoId,
    horometro: m.horometroActual,
    nombre: m.equipoNombre,
    codigo: m.equipoCodigo
  }))
})

// Equipo seleccionado actual
const equipoSeleccionado = computed(() => {
  return listaEquipos.value.find(e => e.value === equipoIdLocal.value) || null
})

// Horómetro base actual
const horometroBaseActual = computed(() => {
  return equipoSeleccionado.value?.horometro ?? (props.horometroActual || 0)
})

// Componentes del equipo seleccionado (cargados vía API filtrada por equipoId)
const opcionesComponentes = computed(() => {
  return componenteStore.componentes.map((comp: Componente) => ({
    title: comp.nombre,
    value: comp.id
  }))
})

// Catálogo de lubricantes
const opcionesLubricantes = computed(() => {
  return lubricacionStore.catalogos.map((c: CatalogoLubricante) => ({
    title: `${c.codigo} - ${c.nombre} (${c.tipo}${c.viscosidad ? ` / ${c.viscosidad}` : ''})`,
    value: c.id,
    raw: c
  }))
})

// Lubricante seleccionado con detalle
const lubricanteSeleccionado = computed<CatalogoLubricante | null>(() => {
  if (!lubricanteId.value) return null
  return lubricacionStore.catalogos.find((c: CatalogoLubricante) => c.id === lubricanteId.value) || null
})

// Cargar componentes cuando cambia el equipo
async function cargarComponentesEquipo(id: number | null) {
  if (!id) return
  cargandoComponentes.value = true
  try {
    await componenteStore.listarComponentes({ equipoId: id })
  } finally {
    cargandoComponentes.value = false
  }
}

async function alCambiarEquipo(nuevoId: number | null) {
  componenteIdLocal.value = null
  mostrarCrearComponente.value = false
  nuevoComponenteNombre.value = ''
  if (nuevoId) {
    await cargarComponentesEquipo(nuevoId)
  }
}

function aplicarPresetFrecuencia(horas: number) {
  limiteHorasCambio.value = horas
}

// Sincronizar formulario al abrir el modal
watch(
  () => props.modelValue,
  async (abierto) => {
    if (abierto) {
      errorMensaje.value = ''
      mostrarCrearComponente.value = false
      nuevoComponenteNombre.value = ''
      equipoIdLocal.value = props.equipoId || (listaEquipos.value.length > 0 ? listaEquipos.value[0].value : null)

      if (equipoIdLocal.value) {
        await cargarComponentesEquipo(equipoIdLocal.value)
      }

      if (props.modo === 'editar' && props.parteEditar) {
        nombrePunto.value = props.parteEditar.nombrePunto
        lubricanteId.value = props.parteEditar.lubricante.id
        limiteHorasCambio.value = props.parteEditar.limiteHorasCambio
        capacidadRecomendada.value = props.parteEditar.capacidadRecomendada ?? null

        if (props.parteEditar.componenteId) {
          componenteIdLocal.value = props.parteEditar.componenteId
        } else if (props.parteEditar.componenteNombre) {
          const comp = componenteStore.componentes.find(c => c.nombre === props.parteEditar?.componenteNombre)
          componenteIdLocal.value = comp ? comp.id : null
        } else {
          componenteIdLocal.value = null
        }
      } else {
        // Modo Crear: valores limpios por defecto
        nombrePunto.value = ''
        componenteIdLocal.value = null
        limiteHorasCambio.value = 250
        capacidadRecomendada.value = null
        lubricanteId.value = lubricacionStore.catalogos.length > 0 ? lubricacionStore.catalogos[0].id : null
      }
    }
  }
)

async function registrarNuevoComponente() {
  const nombreLimpio = nuevoComponenteNombre.value.trim()
  if (!nombreLimpio) {
    errorMensaje.value = 'Por favor escriba el nombre del componente a registrar.'
    return
  }
  if (!equipoIdLocal.value) {
    errorMensaje.value = 'Debe seleccionar un equipo antes de crear un nuevo componente.'
    return
  }

  creandoComponente.value = true
  errorMensaje.value = ''
  try {
    const res = await componenteStore.crearComponente({
      equipoId: equipoIdLocal.value,
      nombre: nombreLimpio,
      descripcion: 'Creado desde módulo de lubricación',
      activo: true,
      ordenPosicion: 0
    })

    if (res.status === 'ok' && res.data) {
      await cargarComponentesEquipo(equipoIdLocal.value)
      componenteIdLocal.value = res.data.id
      nuevoComponenteNombre.value = ''
      mostrarCrearComponente.value = false
    } else {
      errorMensaje.value = res.message || 'No se pudo crear el componente'
    }
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al registrar el componente'
  } finally {
    creandoComponente.value = false
  }
}

async function guardar() {
  errorMensaje.value = ''

  if (!equipoIdLocal.value) {
    errorMensaje.value = 'Debe seleccionar un equipo de la lista.'
    return
  }

  if (!nombrePunto.value.trim()) {
    errorMensaje.value = 'El nombre de la parte o punto a lubricar es obligatorio (ej: Rodamientos, Chumacera, Cárter).'
    return
  }

  if (!lubricanteId.value) {
    errorMensaje.value = 'Debe seleccionar un lubricante asignado del catálogo.'
    return
  }

  if (!limiteHorasCambio.value || Number(limiteHorasCambio.value) <= 0) {
    errorMensaje.value = 'La frecuencia límite de horas debe ser un número entero mayor a cero.'
    return
  }

  if (capacidadRecomendada.value !== null && capacidadRecomendada.value !== undefined && Number(capacidadRecomendada.value) < 0) {
    errorMensaje.value = 'La capacidad recomendada no puede ser un número negativo.'
    return
  }

  guardando.value = true
  try {
    let componenteIdFinal: number | null = componenteIdLocal.value

    // Si el usuario escribió un nuevo componente en el panel desplegable y no pulsó el botón 'Agregar', registrarlo automáticamente
    if (!componenteIdFinal && nuevoComponenteNombre.value.trim()) {
      const res = await componenteStore.crearComponente({
        equipoId: equipoIdLocal.value,
        nombre: nuevoComponenteNombre.value.trim(),
        descripcion: 'Creado desde módulo de lubricación',
        activo: true,
        ordenPosicion: 0
      })
      if (res.status === 'ok' && res.data) {
        componenteIdFinal = res.data.id
      }
    }

    if (props.modo === 'editar' && props.parteEditar) {
      await lubricacionStore.editarPuntoLubricacion(props.parteEditar.id, {
        componenteId: componenteIdFinal,
        lubricanteId: lubricanteId.value,
        nombrePunto: nombrePunto.value.trim(),
        limiteHorasCambio: Number(limiteHorasCambio.value),
        capacidadRecomendada: capacidadRecomendada.value ? Number(capacidadRecomendada.value) : null
      })
    } else {
      await lubricacionStore.crearPuntoLubricacion({
        equipoId: equipoIdLocal.value,
        componenteId: componenteIdFinal,
        nombrePunto: nombrePunto.value.trim(),
        lubricanteId: lubricanteId.value,
        limiteHorasCambio: Number(limiteHorasCambio.value),
        capacidadRecomendada: capacidadRecomendada.value ? Number(capacidadRecomendada.value) : undefined,
        horometroUltimoCambio: horometroBaseActual.value
      })
    }

    emit('guardado')
    emit('update:modelValue', false)
  } catch (err: unknown) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al guardar la parte a lubricar'
  } finally {
    guardando.value = false
  }
}

function cerrar() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="720" persistent scrollable>
    <v-card class="rounded-lg">
      <!-- Encabezado Limpio con colores institucionales -->
      <v-card-item class="bg-primary text-white py-3 px-4">
        <template #prepend>
          <v-icon color="white" size="26" class="me-2">
            {{ modo === 'editar' ? 'mdi-pencil-box-outline' : 'mdi-oil' }}
          </v-icon>
        </template>
        <v-card-title class="text-subtitle-1 font-weight-bold">
          {{ modo === 'editar' ? 'Editar Parte a Lubricar' : 'Añadir Parte a Lubricar' }}
        </v-card-title>
        <v-card-subtitle class="text-caption text-white-50">
          Configuración de puntos de lubricación, lubricantes y frecuencias de mantenimiento
        </v-card-subtitle>
      </v-card-item>

      <v-card-text class="pt-4 px-4 px-sm-5">
        <!-- Alerta de Validación -->
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
          <!-- 1. Equipo / Máquina -->
          <v-col cols="12">
            <v-autocomplete
              v-model="equipoIdLocal"
              :items="listaEquipos"
              label="Equipo / Máquina *"
              placeholder="Seleccione o busque equipo..."
              variant="outlined"
              density="comfortable"
              item-title="title"
              item-value="value"
              auto-select-first
              :disabled="modo === 'editar'"
              prepend-inner-icon="mdi-factory"
              @update:model-value="alCambiarEquipo"
            >
              <template #append-inner>
                <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                  Horómetro: {{ horometroBaseActual }} hrs
                </v-chip>
              </template>
            </v-autocomplete>
          </v-col>

          <!-- 2. Componente Mecánico -->
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="componenteIdLocal"
              :items="opcionesComponentes"
              label="Componente Mecánico"
              placeholder="Seleccione existente..."
              variant="outlined"
              density="comfortable"
              clearable
              item-title="title"
              item-value="value"
              prepend-inner-icon="mdi-cog"
              :loading="cargandoComponentes"
              :no-data-text="cargandoComponentes ? 'Cargando componentes...' : 'Sin componentes registrados en este equipo.'"
            >
              <template #append-inner>
                <v-tooltip location="top" text="Agregar nuevo componente (+)">
                  <template #activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      icon="mdi-plus"
                      size="22"
                      variant="tonal"
                      color="primary"
                      class="ms-1 text-principal"
                      @click.stop="mostrarCrearComponente = !mostrarCrearComponente"
                    />
                  </template>
                </v-tooltip>
              </template>
            </v-autocomplete>
          </v-col>

          <!-- 3. Punto Específico a Lubricar -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="nombrePunto"
              label="Parte o Punto a Lubricar *"
              placeholder="Ej: Rodamientos, Chumacera, Cárter"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-target"
              hint="Nombre identificativo de la parte a intervenir."
              persistent-hint
            />
          </v-col>

          <!-- Panel que se despliega con el + a todo lo ancho del formulario (cols="12") manteniendo la misma altura compacta -->
          <v-col v-if="mostrarCrearComponente" cols="12" class="py-1">
            <v-expand-transition>
              <v-card variant="tonal" color="primary" class="pa-2.5 rounded-lg border">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center gap-1">
                    <v-icon size="16" color="primary">mdi-plus-box-outline</v-icon>
                    <span class="text-caption font-weight-bold text-primary">Registrar Nuevo Componente Mecánico</span>
                  </div>
                  <v-btn
                    icon="mdi-close"
                    size="20"
                    variant="text"
                    color="medium-emphasis"
                    @click="mostrarCrearComponente = false"
                  />
                </div>
                <div class="d-flex align-center gap-3">
                  <v-text-field
                    v-model="nuevoComponenteNombre"
                    label="Nombre del nuevo componente *"
                    placeholder="Ej: Reductor, Tambor, Rodillos de arrastre..."
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="flex-grow-1"
                    :disabled="creandoComponente"
                    @keyup.enter="registrarNuevoComponente"
                  />
                  <v-btn
                    color="primary"
                    variant="flat"
                    size="small"
                    density="comfortable"
                    :loading="creandoComponente"
                    :disabled="!nuevoComponenteNombre.trim()"
                    prepend-icon="mdi-check"
                    class="text-none font-weight-bold px-4 flex-shrink-0"
                    @click="registrarNuevoComponente"
                  >
                    Agregar
                  </v-btn>
                </div>
                <div class="text-caption text-medium-emphasis mt-1" style="font-size: 0.73rem !important; line-height: 1.25;">
                  Se creará en este equipo y quedará seleccionado automáticamente en el campo de Componente Mecánico.
                </div>
              </v-card>
            </v-expand-transition>
          </v-col>

          <!-- 4. Lubricante Asignado -->
          <v-col cols="12" class="mt-2">
            <v-autocomplete
              v-model="lubricanteId"
              :items="opcionesLubricantes"
              label="Lubricante Asignado *"
              placeholder="Buscar por marca, código o viscosidad..."
              variant="outlined"
              density="comfortable"
              item-title="title"
              item-value="value"
              auto-select-first
              prepend-inner-icon="mdi-barrel"
            />
          </v-col>

          <!-- Previsualización del Lubricante -->
          <v-col v-if="lubricanteSeleccionado" cols="12">
            <v-card variant="tonal" color="primary" class="pa-3 mb-2 rounded-lg">
              <div class="d-flex align-center justify-space-between flex-wrap gap-2">
                <div class="d-flex align-center gap-2">
                  <v-icon size="20">
                    {{ lubricanteSeleccionado.tipo === 'GRASA' ? 'mdi-dots-grid' : 'mdi-water' }}
                  </v-icon>
                  <span class="font-weight-bold text-body-2">{{ lubricanteSeleccionado.nombre }}</span>
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

          <!-- 5. Frecuencia Límite en Horas -->
          <v-col cols="12" sm="6" class="mt-1">
            <v-text-field
              v-model.number="limiteHorasCambio"
              type="number"
              min="1"
              label="Frecuencia Límite (Horas) *"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-clock-outline"
              suffix="hrs"
              hint="Horas de trabajo permitidas para el ciclo."
              persistent-hint
              @keydown="(e: KeyboardEvent) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault() }"
              @update:model-value="(val) => { if (val !== null && val !== undefined && Number(val) < 1) limiteHorasCambio = 1 }"
            />

            <!-- Chips de acceso rápido -->
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

          <!-- 6. Capacidad Recomendada -->
          <v-col cols="12" sm="6" class="mt-1">
            <v-text-field
              v-model.number="capacidadRecomendada"
              type="number"
              min="0"
              step="0.1"
              label="Capacidad Recomendada (Opcional)"
              placeholder="Ej: 0.5, 3.5"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-cup-water"
              :suffix="lubricanteSeleccionado ? lubricanteSeleccionado.unidadMedida.toLowerCase() : 'und'"
              hint="Dosis recomendada para reponer o rellenar."
              persistent-hint
              @keydown="(e: KeyboardEvent) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault() }"
              @update:model-value="(val) => { if (val !== null && val !== undefined && Number(val) < 0) capacidadRecomendada = 0 }"
            />
          </v-col>

          <!-- Horómetro Base -->
          <v-col cols="12" class="mt-2">
            <div class="text-caption text-medium-emphasis d-flex align-center gap-1">
              <v-icon size="16">mdi-information-outline</v-icon>
              <span>El conteo iniciará desde el horómetro actual: <strong>{{ horometroBaseActual }} hrs</strong>.</span>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider class="my-0" />

      <!-- Botones de Acción -->
      <v-card-actions class="px-4 py-3">
        <v-btn
          variant="text"
          color="grey"
          :disabled="guardando"
          @click="cerrar"
        >
          Cancelar
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          :loading="guardando"
          prepend-icon="mdi-check-circle"
          @click="guardar"
        >
          {{ modo === 'editar' ? 'Actualizar Parte' : 'Añadir Parte' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }

.cursor-pointer {
  cursor: pointer;
}
</style>
