<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import type { VuetifyForm } from '@/core/types/vuetifyForm'
import {
  useVariablesStore,
  type PlantillaVariableItem,
  type TipoEvaluacion
} from '../variables.store'
import {
  UNIDADES_MEDIDA_PREDETERMINADAS,
  OPCIONES_SELECCION_ESTANDAR
} from '../constants/unidades'
import { variableRules } from '../validations/variables'

const toast = useToast()
const store = useVariablesStore()

const formRef = ref<VuetifyForm | null>(null)
const mostrarDialogo = ref(false)
const esEdicion = ref(false)
const cargando = computed(() => store.ejecutandoAccion)

const form = ref({
  id: 0,
  tipoEquipoId: 0,
  nombreComponente: '',
  nombre: '',
  tipoEvaluacion: 'NUMERICO_DECIMAL' as TipoEvaluacion,
  unidad: '',
  valorMinimo: null as number | null,
  valorMaximo: null as number | null,
  ordenPosicion: 0,
  opcionesTexto: ''
})

const tiposEvaluacion = [
  { title: 'Numérico Decimal', value: 'NUMERICO_DECIMAL' },
  { title: 'Numérico Entero', value: 'NUMERICO_ENTERO' },
  { title: 'Temperatura (°C)', value: 'TEMPERATURA' },
  { title: 'Selección / Estado', value: 'SELECCION' }
]

const tipoEquipoNombre = computed(() => {
  const tipo = store.tiposEquipo.find((t: { id: number }) => t.id === form.value.tipoEquipoId)
  return tipo?.nombre ?? 'General'
})

// Sugerencias de componentes existentes en equipos de este tipo
const sugerenciasComponentes = computed(() => {
  const nombres = new Set<string>()
  for (const planta of store.arbolJerarquico) {
    for (const ut of planta.ubicacionesTecnicas) {
      for (const eq of ut.equipos) {
        if (eq.tipoEquipoId === form.value.tipoEquipoId) {
          for (const comp of eq.componentes) {
            if (comp.nombre?.trim()) {
              nombres.add(comp.nombre.trim().toUpperCase())
            }
          }
        }
      }
    }
  }
  return Array.from(nombres).sort()
})

// Opciones previsualizadas en chips
const opcionesParseadas = computed(() => {
  if (!form.value.opcionesTexto.trim()) return []
  return form.value.opcionesTexto
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => {
      const partes = l.split(':')
      const clave = (partes[0] || '').trim().toUpperCase()
      const etiqueta = (partes.slice(1).join(':') || partes[0] || '').trim()
      return { clave, etiqueta }
    })
})

const reglasMinimo = [
  (v: unknown) => {
    if (v === null || v === undefined || v === '') return true
    const max = form.value.valorMaximo
    if (max === null || max === undefined || (max as unknown) === '') return true
    return Number(v) <= Number(max) || 'El valor mínimo no puede superar el máximo.'
  }
]

const reglasMaximo = [
  (v: unknown) => {
    if (v === null || v === undefined || v === '') return true
    const min = form.value.valorMinimo
    if (min === null || min === undefined || (min as unknown) === '') return true
    return Number(v) >= Number(min) || 'El valor máximo no puede ser menor al mínimo.'
  }
]

const cargarOpcionesEstandar = () => {
  form.value.opcionesTexto = OPCIONES_SELECCION_ESTANDAR
}

const cargarOpcionesBinarias = () => {
  form.value.opcionesTexto = 'OK: Correcto\nNOK: Defectuoso\nN/A: No Aplica'
}

const limpiarOpciones = () => {
  form.value.opcionesTexto = ''
}

// Al cambiar el tipo a SELECCION, si está vacío, autocompletar con las opciones estándar
watch(
  () => form.value.tipoEvaluacion,
  (nuevoTipo) => {
    if (nuevoTipo === 'SELECCION' && !form.value.opcionesTexto.trim()) {
      cargarOpcionesEstandar()
    }
  }
)

const abrirCrear = (tipoEquipoId: number) => {
  esEdicion.value = false
  form.value = {
    id: 0,
    tipoEquipoId,
    nombreComponente: '',
    nombre: '',
    tipoEvaluacion: 'NUMERICO_DECIMAL',
    unidad: '',
    valorMinimo: null,
    valorMaximo: null,
    ordenPosicion: store.plantillasPorTipo.length + 1,
    opcionesTexto: OPCIONES_SELECCION_ESTANDAR
  }
  formRef.value?.resetValidation()
  mostrarDialogo.value = true
}

const abrirEditar = (plantilla: PlantillaVariableItem) => {
  esEdicion.value = true
  const opcionesTexto =
    plantilla.opcionesSeleccion && plantilla.opcionesSeleccion.length > 0
      ? plantilla.opcionesSeleccion.map((o) => `${o.clave}: ${o.etiqueta}`).join('\n')
      : plantilla.tipoEvaluacion === 'SELECCION'
        ? OPCIONES_SELECCION_ESTANDAR
        : ''

  form.value = {
    id: plantilla.id,
    tipoEquipoId: plantilla.tipoEquipoId,
    nombreComponente: plantilla.nombreComponente ?? '',
    nombre: plantilla.nombre,
    tipoEvaluacion: plantilla.tipoEvaluacion,
    unidad: plantilla.unidad ?? '',
    valorMinimo: plantilla.valorMinimo !== null ? Number(plantilla.valorMinimo) : null,
    valorMaximo: plantilla.valorMaximo !== null ? Number(plantilla.valorMaximo) : null,
    ordenPosicion: plantilla.ordenPosicion ?? 0,
    opcionesTexto
  }
  formRef.value?.resetValidation()
  mostrarDialogo.value = true
}

const guardar = async () => {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) {
    toast.warning('Por favor, revisa los campos obligatorios del formulario')
    return
  }

  let opciones: { clave: string; etiqueta: string; ordenPosicion?: number }[] | undefined

  if (form.value.tipoEvaluacion === 'SELECCION') {
    const lineas = form.value.opcionesTexto.split('\n').filter((l) => l.trim().length > 0)
    opciones = lineas.map((l, index) => {
      const partes = l.split(':')
      const clave = (partes[0] || `OPC${index + 1}`).trim().toUpperCase()
      const etiqueta = (partes.slice(1).join(':') || partes[0] || '').trim()
      return { clave, etiqueta, ordenPosicion: index + 1 }
    })
  }

  if (esEdicion.value) {
    const res = await store.editarPlantilla(form.value.id, {
      nombreComponente: form.value.nombreComponente?.trim().toUpperCase() || null,
      nombre: form.value.nombre.trim(),
      tipoEvaluacion: form.value.tipoEvaluacion,
      unidad: form.value.unidad.trim() || null,
      valorMinimo: form.value.valorMinimo !== null ? Number(form.value.valorMinimo) : null,
      valorMaximo: form.value.valorMaximo !== null ? Number(form.value.valorMaximo) : null,
      ordenPosicion: Number(form.value.ordenPosicion) || 0,
      opciones
    })

    if (res.status === 'ok') {
      toast.success('Variable de plantilla actualizada exitosamente')
      mostrarDialogo.value = false
    } else {
      toast.error(res.message ?? 'Error al actualizar la plantilla')
    }
  } else {
    const res = await store.crearPlantilla({
      tipoEquipoId: form.value.tipoEquipoId,
      nombreComponente: form.value.nombreComponente?.trim().toUpperCase() || null,
      nombre: form.value.nombre.trim(),
      tipoEvaluacion: form.value.tipoEvaluacion,
      unidad: form.value.unidad.trim() || null,
      valorMinimo: form.value.valorMinimo !== null ? Number(form.value.valorMinimo) : null,
      valorMaximo: form.value.valorMaximo !== null ? Number(form.value.valorMaximo) : null,
      ordenPosicion: Number(form.value.ordenPosicion) || 0,
      opciones
    })

    if (res.status === 'ok') {
      toast.success('Variable agregada a la plantilla del tipo de equipo')
      mostrarDialogo.value = false
    } else {
      toast.error(res.message ?? 'Error al crear la plantilla')
    }
  }
}

defineExpose({
  abrirCrear,
  abrirEditar
})
</script>

<template>
  <v-dialog v-model="mostrarDialogo" max-width="580px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="bg-indigo text-white py-3 px-4 d-flex align-center">
        <v-icon start>{{ esEdicion ? 'mdi-file-edit-outline' : 'mdi-file-plus-outline' }}</v-icon>
        <span>{{ esEdicion ? 'Editar Variable de Plantilla' : 'Nueva Variable de Plantilla' }}</span>
      </v-card-title>

      <v-form ref="formRef" @submit.prevent="guardar">
        <v-card-text class="pa-4 pt-5">
          <div class="text-caption text-secondary mb-3">
            Tipo de Equipo: <strong>{{ tipoEquipoNombre }}</strong>
          </div>

          <v-combobox
            v-model="form.nombreComponente"
            :items="sugerenciasComponentes"
            :rules="variableRules.nombreComponente"
            label="Componente Destino"
            placeholder="Ej: MOTOR TRASLADO, TABLERO ELÉCTRICO, BOMBA DE LUBRICACIÓN"
            variant="outlined"
            density="comfortable"
            clearable
            hide-no-data
            class="mb-3"
            hint="Componente específico al que se asociará esta variable (deja en blanco si aplica a todos)"
            persistent-hint
          >
            <template #prepend-inner>
              <v-icon color="indigo" size="20">mdi-puzzle-outline</v-icon>
            </template>
          </v-combobox>

          <v-text-field
            v-model="form.nombre"
            :rules="variableRules.nombre"
            label="Nombre de la Variable *"
            placeholder="Ej: Presión de Succión, Temperatura Aceite, Nivel de Aceite"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />

          <v-row dense>
            <v-col cols="12" sm="7">
              <v-select
                v-model="form.tipoEvaluacion"
                :items="tiposEvaluacion"
                :rules="variableRules.tipoEvaluacion"
                label="Tipo de Evaluación *"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="5">
              <v-combobox
                v-model="form.unidad"
                :items="UNIDADES_MEDIDA_PREDETERMINADAS"
                :rules="variableRules.unidad"
                label="Unidad de Medida"
                placeholder="Selecciona o escribe"
                variant="outlined"
                density="comfortable"
                clearable
                hide-no-data
              />
            </v-col>
          </v-row>

          <!-- Rangos si no es selección -->
          <v-row v-if="form.tipoEvaluacion !== 'SELECCION'" dense class="mt-1">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.valorMinimo"
                :rules="reglasMinimo"
                label="Límite Mínimo"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.valorMaximo"
                :rules="reglasMaximo"
                label="Límite Máximo"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <!-- Bloque de Opciones de Selección / Estado -->
          <div v-if="form.tipoEvaluacion === 'SELECCION'" class="mt-3 pa-3 rounded border bg-surface-variant">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption font-weight-bold text-principal">
                <v-icon size="16" color="primary" class="mr-1">mdi-format-list-checks</v-icon>
                Opciones de Selección / Estados *
              </span>

              <div class="d-flex gap-1">
                <v-btn size="x-small" variant="tonal" color="primary" @click="cargarOpcionesEstandar">
                  Estándar (N, E, A, B, NE, N/A)
                </v-btn>
                <v-btn size="x-small" variant="text" color="secondary" @click="cargarOpcionesBinarias">
                  Binario (OK / NOK)
                </v-btn>
                <v-btn size="x-small" variant="text" color="error" @click="limpiarOpciones">
                  Limpiar
                </v-btn>
              </div>
            </div>

            <v-textarea
              v-model="form.opcionesTexto"
              :rules="variableRules.opcionesTexto"
              placeholder="N: Normal&#10;E: Existe&#10;A: Anormal&#10;B: Bajo&#10;NE: No Existe&#10;N/A: No Aplica"
              variant="outlined"
              density="compact"
              rows="5"
              hint="Escribe una opción por línea en formato CLAVE: Etiqueta"
              persistent-hint
              bg-color="surface"
            />

            <!-- Previsualización de Chips de Opciones -->
            <div v-if="opcionesParseadas.length > 0" class="mt-2 d-flex flex-wrap gap-1">
              <v-chip
                v-for="(opc, idx) in opcionesParseadas"
                :key="idx"
                size="x-small"
                variant="outlined"
                color="primary"
                class="font-weight-medium"
              >
                <strong>{{ opc.clave }}:</strong>&nbsp;{{ opc.etiqueta }}
              </v-chip>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 justify-end">
          <v-btn variant="text" :disabled="cargando" @click="mostrarDialogo = false">
            Cancelar
          </v-btn>
          <v-btn color="indigo" variant="flat" :loading="cargando" type="submit">
            {{ esEdicion ? 'Actualizar Plantilla' : 'Guardar en Plantilla' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.gap-1 {
  gap: 4px;
}
</style>
