<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import type { VuetifyForm } from '@/core/types/vuetifyForm'
import {
  useVariablesStore,
  type PlantaNodo,
  type UbicacionTecnicaNodo,
  type EquipoNodo,
  type ComponenteNodo,
  type VariableInstancia,
  type TipoEvaluacion
} from '../variables.store'
import {
  UNIDADES_MEDIDA_PREDETERMINADAS,
  OPCIONES_SELECCION_ESTANDAR
} from '../constants/unidades'
import { variableRules, jerarquiaRules } from '../validations/variables'

const toast = useToast()
const store = useVariablesStore()

// ─── REFS DE FORMULARIOS VUETIFY ──────────────────────────────────────────────
const formUbicacionRef = ref<VuetifyForm | null>(null)
const formEquipoRef = ref<VuetifyForm | null>(null)
const formComponenteRef = ref<VuetifyForm | null>(null)
const formVariableRef = ref<VuetifyForm | null>(null)

// ─── CONTROL DE VISIBILIDAD DE DIÁLOGOS ───────────────────────────────────────
const mostrarDialogoUbicacion = ref(false)
const mostrarDialogoEquipo = ref(false)
const mostrarDialogoComponente = ref(false)
const mostrarDialogoVariable = ref(false)
const mostrarDialogoEliminar = ref(false)

const esEdicion = ref(false)
const cargando = computed(() => store.ejecutandoAccion)

// ─── CONTEXTO TEMPORAL DEL NODO ───────────────────────────────────────────────
const nodoPlantaPadre = ref<PlantaNodo | null>(null)
const nodoUbicacionPadre = ref<UbicacionTecnicaNodo | null>(null)
const nodoEquipoActivo = ref<EquipoNodo | null>(null)
const nodoComponenteActivo = ref<ComponenteNodo | null>(null)
const variableActiva = ref<VariableInstancia | null>(null)

// ─── TIPO Y MENSAJE DE ELIMINACIÓN ────────────────────────────────────────────
const tipoEliminacion = ref<'EQUIPO' | 'COMPONENTE' | 'VARIABLE'>('EQUIPO')
const idAEliminar = ref<number | null>(null)
const nombreAEliminar = ref<string>('')

// ─── MODELOS DE FORMULARIO ───────────────────────────────────────────────────
const formUbicacion = ref({
  codigo: '',
  nombre: '',
  descripcion: ''
})

const formEquipo = ref({
  id: 0,
  codigo: '',
  nombre: '',
  tipoEquipoId: null as number | null,
  serial: '',
  marca: '',
  modelo: '',
  observacion: ''
})

const formComponente = ref({
  id: 0,
  nombre: '',
  descripcion: '',
  ordenPosicion: 0
})

const formVariable = ref({
  id: 0,
  componenteId: 0,
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

// Opciones previsualizadas en chips para variable de instancia
const opcionesParseadasVariable = computed(() => {
  if (!formVariable.value.opcionesTexto.trim()) return []
  return formVariable.value.opcionesTexto
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => {
      const partes = l.split(':')
      const clave = (partes[0] || '').trim().toUpperCase()
      const etiqueta = (partes.slice(1).join(':') || partes[0] || '').trim()
      return { clave, etiqueta }
    })
})

const reglasMinimoVariable = [
  (v: unknown) => {
    if (v === null || v === undefined || v === '') return true
    const max = formVariable.value.valorMaximo
    if (max === null || max === undefined || (max as unknown) === '') return true
    return Number(v) <= Number(max) || 'El valor mínimo no puede superar el máximo.'
  }
]

const reglasMaximoVariable = [
  (v: unknown) => {
    if (v === null || v === undefined || v === '') return true
    const min = formVariable.value.valorMinimo
    if (min === null || min === undefined || (min as unknown) === '') return true
    return Number(v) >= Number(min) || 'El valor máximo no puede ser menor al mínimo.'
  }
]

const cargarOpcionesEstandarVariable = () => {
  formVariable.value.opcionesTexto = OPCIONES_SELECCION_ESTANDAR
}

const cargarOpcionesBinariasVariable = () => {
  formVariable.value.opcionesTexto = 'OK: Correcto\nNOK: Defectuoso\nN/A: No Aplica'
}

const limpiarOpcionesVariable = () => {
  formVariable.value.opcionesTexto = ''
}

// ─── MÉTODOS DE APERTURA DE DIÁLOGOS ──────────────────────────────────────────

const abrirCrearUbicacion = (planta: PlantaNodo) => {
  nodoPlantaPadre.value = planta
  formUbicacion.value = { codigo: '', nombre: '', descripcion: '' }
  formUbicacionRef.value?.resetValidation()
  mostrarDialogoUbicacion.value = true
}

const abrirCrearEquipo = (ubicacion: UbicacionTecnicaNodo) => {
  nodoUbicacionPadre.value = ubicacion
  esEdicion.value = false
  formEquipo.value = {
    id: 0,
    codigo: '',
    nombre: '',
    tipoEquipoId: store.tiposEquipo.length > 0 ? (store.tiposEquipo[0]?.id ?? null) : null,
    serial: '',
    marca: '',
    modelo: '',
    observacion: ''
  }
  formEquipoRef.value?.resetValidation()
  mostrarDialogoEquipo.value = true
}

const abrirEditarEquipo = (equipo: EquipoNodo) => {
  nodoEquipoActivo.value = equipo
  esEdicion.value = true
  formEquipo.value = {
    id: equipo.id,
    codigo: equipo.codigo,
    nombre: equipo.nombre,
    tipoEquipoId: equipo.tipoEquipoId,
    serial: '',
    marca: '',
    modelo: '',
    observacion: ''
  }
  formEquipoRef.value?.resetValidation()
  mostrarDialogoEquipo.value = true
}

const abrirCrearComponente = (equipo: EquipoNodo) => {
  nodoEquipoActivo.value = equipo
  esEdicion.value = false
  formComponente.value = {
    id: 0,
    nombre: '',
    descripcion: '',
    ordenPosicion: equipo.componentes.length + 1
  }
  formComponenteRef.value?.resetValidation()
  mostrarDialogoComponente.value = true
}

const abrirEditarComponente = (componente: ComponenteNodo) => {
  nodoComponenteActivo.value = componente
  esEdicion.value = true
  formComponente.value = {
    id: componente.id,
    nombre: componente.nombre,
    descripcion: componente.descripcion ?? '',
    ordenPosicion: componente.ordenPosicion ?? 0
  }
  formComponenteRef.value?.resetValidation()
  mostrarDialogoComponente.value = true
}

const abrirCrearVariable = (componente?: ComponenteNodo) => {
  const comp = componente || store.componenteSeleccionado?.componente
  if (!comp) {
    toast.warning('Debe seleccionar un componente primero')
    return
  }
  nodoComponenteActivo.value = comp
  esEdicion.value = false
  formVariable.value = {
    id: 0,
    componenteId: comp.id,
    nombre: '',
    tipoEvaluacion: 'NUMERICO_DECIMAL',
    unidad: '',
    valorMinimo: null,
    valorMaximo: null,
    ordenPosicion: 0,
    opcionesTexto: OPCIONES_SELECCION_ESTANDAR
  }
  formVariableRef.value?.resetValidation()
  mostrarDialogoVariable.value = true
}

const abrirEditarVariable = (variable: VariableInstancia) => {
  variableActiva.value = variable
  esEdicion.value = true
  const opcionesTexto =
    variable.opcionesSeleccion && variable.opcionesSeleccion.length > 0
      ? variable.opcionesSeleccion.map((o) => `${o.clave}: ${o.etiqueta}`).join('\n')
      : variable.tipoEvaluacion === 'SELECCION'
        ? OPCIONES_SELECCION_ESTANDAR
        : ''

  formVariable.value = {
    id: variable.id,
    componenteId: variable.componenteId,
    nombre: variable.nombre,
    tipoEvaluacion: variable.tipoEvaluacion,
    unidad: variable.unidad ?? '',
    valorMinimo: variable.valorMinimo !== null ? Number(variable.valorMinimo) : null,
    valorMaximo: variable.valorMaximo !== null ? Number(variable.valorMaximo) : null,
    ordenPosicion: variable.ordenPosicion ?? 0,
    opcionesTexto
  }
  formVariableRef.value?.resetValidation()
  mostrarDialogoVariable.value = true
}

const abrirEliminarEquipo = (equipo: EquipoNodo) => {
  tipoEliminacion.value = 'EQUIPO'
  idAEliminar.value = equipo.id
  nombreAEliminar.value = equipo.nombre
  mostrarDialogoEliminar.value = true
}

const abrirEliminarComponente = (componente: ComponenteNodo) => {
  tipoEliminacion.value = 'COMPONENTE'
  idAEliminar.value = componente.id
  nombreAEliminar.value = componente.nombre
  mostrarDialogoEliminar.value = true
}

const abrirEliminarVariable = (variable: VariableInstancia) => {
  tipoEliminacion.value = 'VARIABLE'
  idAEliminar.value = variable.id
  nombreAEliminar.value = variable.nombre
  mostrarDialogoEliminar.value = true
}

// ─── ACCIONES DE GUARDADO CON VALIDACIÓN ──────────────────────────────────────

const guardarUbicacion = async () => {
  if (!formUbicacionRef.value) return
  const { valid } = await formUbicacionRef.value.validate()
  if (!valid) {
    toast.warning('Por favor, completa los campos requeridos')
    return
  }
  if (!nodoPlantaPadre.value) return

  const res = await store.crearUbicacion({
    plantaId: nodoPlantaPadre.value.id,
    codigo: formUbicacion.value.codigo.trim(),
    nombre: formUbicacion.value.nombre.trim(),
    descripcion: formUbicacion.value.descripcion.trim() || undefined
  })

  if (res.status === 'ok') {
    toast.success('Ubicación técnica creada correctamente')
    mostrarDialogoUbicacion.value = false
  } else {
    toast.error(res.message ?? 'Error al crear la ubicación técnica')
  }
}

const guardarEquipo = async () => {
  if (!formEquipoRef.value) return
  const { valid } = await formEquipoRef.value.validate()
  if (!valid) {
    toast.warning('Por favor, completa los campos requeridos')
    return
  }

  if (esEdicion.value) {
    const res = await store.editarEquipo(formEquipo.value.id, {
      codigo: formEquipo.value.codigo.trim(),
      nombre: formEquipo.value.nombre.trim(),
      tipoEquipoId: formEquipo.value.tipoEquipoId as number,
      serial: formEquipo.value.serial?.trim() || null,
      marca: formEquipo.value.marca?.trim() || null,
      modelo: formEquipo.value.modelo?.trim() || null,
      observacion: formEquipo.value.observacion?.trim() || null
    })

    if (res.status === 'ok') {
      toast.success('Equipo actualizado correctamente')
      mostrarDialogoEquipo.value = false
    } else {
      toast.error(res.message ?? 'Error al editar el equipo')
    }
  } else {
    if (!nodoUbicacionPadre.value) return
    const res = await store.crearEquipo({
      ubicacionTecnicaId: nodoUbicacionPadre.value.id,
      codigo: formEquipo.value.codigo.trim(),
      nombre: formEquipo.value.nombre.trim(),
      tipoEquipoId: formEquipo.value.tipoEquipoId as number,
      serial: formEquipo.value.serial?.trim() || null,
      marca: formEquipo.value.marca?.trim() || null,
      modelo: formEquipo.value.modelo?.trim() || null,
      observacion: formEquipo.value.observacion?.trim() || null
    })

    if (res.status === 'ok') {
      toast.success('Equipo registrado correctamente')
      mostrarDialogoEquipo.value = false
    } else {
      toast.error(res.message ?? 'Error al crear el equipo')
    }
  }
}

const guardarComponente = async () => {
  if (!formComponenteRef.value) return
  const { valid } = await formComponenteRef.value.validate()
  if (!valid) {
    toast.warning('Por favor, completa los campos requeridos')
    return
  }

  if (esEdicion.value) {
    const res = await store.editarComponente(formComponente.value.id, {
      nombre: formComponente.value.nombre.trim(),
      descripcion: formComponente.value.descripcion?.trim() || null,
      ordenPosicion: Number(formComponente.value.ordenPosicion) || 0
    })

    if (res.status === 'ok') {
      toast.success('Componente actualizado correctamente')
      mostrarDialogoComponente.value = false
    } else {
      toast.error(res.message ?? 'Error al editar el componente')
    }
  } else {
    if (!nodoEquipoActivo.value) return
    const res = await store.crearComponente({
      equipoId: nodoEquipoActivo.value.id,
      nombre: formComponente.value.nombre.trim(),
      descripcion: formComponente.value.descripcion?.trim() || null,
      ordenPosicion: Number(formComponente.value.ordenPosicion) || 0
    })

    if (res.status === 'ok') {
      toast.success('Componente creado correctamente')
      mostrarDialogoComponente.value = false
    } else {
      toast.error(res.message ?? 'Error al crear el componente')
    }
  }
}

const guardarVariable = async () => {
  if (!formVariableRef.value) return
  const { valid } = await formVariableRef.value.validate()
  if (!valid) {
    toast.warning('Por favor, completa los campos requeridos de la variable')
    return
  }

  let opciones: { clave: string; etiqueta: string; ordenPosicion?: number }[] | undefined

  if (formVariable.value.tipoEvaluacion === 'SELECCION') {
    const lineas = formVariable.value.opcionesTexto.split('\n').filter((l) => l.trim().length > 0)
    opciones = lineas.map((l, index) => {
      const partes = l.split(':')
      const clave = (partes[0] || `OPC${index + 1}`).trim().toUpperCase()
      const etiqueta = (partes.slice(1).join(':') || partes[0] || '').trim()
      return { clave, etiqueta, ordenPosicion: index + 1 }
    })
  }

  if (esEdicion.value) {
    const res = await store.editarVariable(formVariable.value.id, {
      nombre: formVariable.value.nombre.trim(),
      tipoEvaluacion: formVariable.value.tipoEvaluacion,
      unidad: formVariable.value.unidad?.trim() || null,
      valorMinimo: formVariable.value.valorMinimo !== null ? Number(formVariable.value.valorMinimo) : null,
      valorMaximo: formVariable.value.valorMaximo !== null ? Number(formVariable.value.valorMaximo) : null,
      ordenPosicion: Number(formVariable.value.ordenPosicion) || 0,
      opciones
    })

    if (res.status === 'ok') {
      toast.success('Variable crítica actualizada correctamente')
      mostrarDialogoVariable.value = false
    } else {
      toast.error(res.message ?? 'Error al actualizar la variable')
    }
  } else {
    const componenteId = formVariable.value.componenteId || nodoComponenteActivo.value?.id
    if (!componenteId) {
      toast.warning('No hay un componente seleccionado')
      return
    }

    const res = await store.crearVariable({
      componenteId,
      nombre: formVariable.value.nombre.trim(),
      tipoEvaluacion: formVariable.value.tipoEvaluacion,
      unidad: formVariable.value.unidad?.trim() || null,
      valorMinimo: formVariable.value.valorMinimo !== null ? Number(formVariable.value.valorMinimo) : null,
      valorMaximo: formVariable.value.valorMaximo !== null ? Number(formVariable.value.valorMaximo) : null,
      ordenPosicion: Number(formVariable.value.ordenPosicion) || 0,
      opciones
    })

    if (res.status === 'ok') {
      toast.success('Variable crítica agregada al componente')
      mostrarDialogoVariable.value = false
    } else {
      toast.error(res.message ?? 'Error al crear la variable')
    }
  }
}

const confirmarEliminar = async () => {
  if (!idAEliminar.value) return

  let res
  if (tipoEliminacion.value === 'EQUIPO') {
    res = await store.eliminarEquipo(idAEliminar.value)
  } else if (tipoEliminacion.value === 'COMPONENTE') {
    res = await store.eliminarComponente(idAEliminar.value)
  } else {
    res = await store.eliminarVariable(idAEliminar.value)
  }

  if (res.status === 'ok') {
    toast.success('Elemento eliminado correctamente')
    mostrarDialogoEliminar.value = false
  } else {
    toast.error(res.message ?? 'Error al eliminar')
  }
}

defineExpose({
  abrirCrearUbicacion,
  abrirCrearEquipo,
  abrirEditarEquipo,
  abrirCrearComponente,
  abrirEditarComponente,
  abrirCrearVariable,
  abrirEditarVariable,
  abrirEliminarEquipo,
  abrirEliminarComponente,
  abrirEliminarVariable
})
</script>

<template>
  <div>
    <!-- 1. DIÁLOGO UBICACIÓN TÉCNICA -->
    <v-dialog v-model="mostrarDialogoUbicacion" max-width="500px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-primary text-white py-3 px-4 d-flex align-center">
          <v-icon start>mdi-map-marker-plus</v-icon>
          <span>Nueva Ubicación Técnica</span>
        </v-card-title>

        <v-form ref="formUbicacionRef" @submit.prevent="guardarUbicacion">
          <v-card-text class="pa-4 pt-5">
            <div class="text-caption text-secondary mb-3">
              Planta: <strong>{{ nodoPlantaPadre?.nombre }}</strong>
            </div>
            <v-text-field
              v-model="formUbicacion.codigo"
              :rules="jerarquiaRules.codigo"
              label="Código *"
              placeholder="Ej: 1000-EXT-EQ01 o 1000-EXT-EX01-LI02"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            />
            <v-text-field
              v-model="formUbicacion.nombre"
              :rules="jerarquiaRules.nombre"
              label="Nombre *"
              placeholder="Ej: Equipos en Reserva / Línea # 02"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            />
            <v-textarea
              v-model="formUbicacion.descripcion"
              label="Descripción"
              placeholder="Detalles sobre el área o ubicación técnica"
              variant="outlined"
              density="comfortable"
              rows="2"
            />
          </v-card-text>
          <v-card-actions class="pa-4 pt-0 justify-end">
            <v-btn variant="text" :disabled="cargando" @click="mostrarDialogoUbicacion = false">
              Cancelar
            </v-btn>
            <v-btn color="primary" variant="flat" :loading="cargando" type="submit">
              Guardar Ubicación
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- 2. DIÁLOGO EQUIPO (CREAR / EDITAR) -->
    <v-dialog v-model="mostrarDialogoEquipo" max-width="600px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-deep-orange text-white py-3 px-4 d-flex align-center">
          <v-icon start>{{ esEdicion ? 'mdi-cog-sync' : 'mdi-cog-plus' }}</v-icon>
          <span>{{ esEdicion ? 'Editar Equipo' : 'Nuevo Equipo' }}</span>
        </v-card-title>

        <v-form ref="formEquipoRef" @submit.prevent="guardarEquipo">
          <v-card-text class="pa-4 pt-5">
            <div v-if="!esEdicion" class="text-caption text-secondary mb-3">
              Ubicación Técnica: <strong>{{ nodoUbicacionPadre?.codigo }} - {{ nodoUbicacionPadre?.nombre }}</strong>
            </div>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formEquipo.codigo"
                  :rules="jerarquiaRules.codigo"
                  label="Código *"
                  placeholder="Ej: 1000ACA00002"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formEquipo.nombre"
                  :rules="jerarquiaRules.nombre"
                  label="Nombre *"
                  placeholder="Ej: Acampanadora SICA"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="formEquipo.tipoEquipoId"
                  :items="store.tiposEquipo"
                  item-title="nombre"
                  item-value="id"
                  :rules="jerarquiaRules.tipoEquipoId"
                  label="Tipo de Equipo *"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="formEquipo.marca"
                  label="Marca"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="formEquipo.modelo"
                  label="Modelo"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="formEquipo.serial"
                  label="Serial"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="formEquipo.observacion"
                  label="Observación"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="pa-4 pt-0 justify-end">
            <v-btn variant="text" :disabled="cargando" @click="mostrarDialogoEquipo = false">
              Cancelar
            </v-btn>
            <v-btn color="deep-orange" variant="flat" :loading="cargando" type="submit">
              {{ esEdicion ? 'Actualizar Equipo' : 'Guardar Equipo' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- 3. DIÁLOGO COMPONENTE (CREAR / EDITAR) -->
    <v-dialog v-model="mostrarDialogoComponente" max-width="500px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-indigo text-white py-3 px-4 d-flex align-center">
          <v-icon start>{{ esEdicion ? 'mdi-puzzle-edit' : 'mdi-puzzle-plus' }}</v-icon>
          <span>{{ esEdicion ? 'Editar Componente' : 'Nuevo Componente' }}</span>
        </v-card-title>

        <v-form ref="formComponenteRef" @submit.prevent="guardarComponente">
          <v-card-text class="pa-4 pt-5">
            <div v-if="!esEdicion" class="text-caption text-secondary mb-3">
              Equipo: <strong>{{ nodoEquipoActivo?.nombre }}</strong>
            </div>
            <v-text-field
              v-model="formComponente.nombre"
              :rules="jerarquiaRules.nombreComponente"
              label="Nombre del Componente *"
              placeholder="Ej: Motor Principal, Reductor, Husillo"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            />
            <v-textarea
              v-model="formComponente.descripcion"
              label="Descripción"
              placeholder="Detalles sobre el componente"
              variant="outlined"
              density="comfortable"
              rows="2"
              class="mb-2"
            />
            <v-text-field
              v-model.number="formComponente.ordenPosicion"
              label="Orden de Posición"
              type="number"
              variant="outlined"
              density="comfortable"
            />
          </v-card-text>
          <v-card-actions class="pa-4 pt-0 justify-end">
            <v-btn variant="text" :disabled="cargando" @click="mostrarDialogoComponente = false">
              Cancelar
            </v-btn>
            <v-btn color="indigo" variant="flat" :loading="cargando" type="submit">
              {{ esEdicion ? 'Actualizar Componente' : 'Guardar Componente' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- 4. DIÁLOGO VARIABLE (CREAR / EDITAR) -->
    <v-dialog v-model="mostrarDialogoVariable" max-width="560px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-primary text-white py-3 px-4 d-flex align-center">
          <v-icon start>{{ esEdicion ? 'mdi-pencil-box' : 'mdi-variable-box' }}</v-icon>
          <span>{{ esEdicion ? 'Editar Variable Crítica' : 'Nueva Variable Crítica (Instancia)' }}</span>
        </v-card-title>

        <v-form ref="formVariableRef" @submit.prevent="guardarVariable">
          <v-card-text class="pa-4 pt-5">
            <div v-if="!esEdicion && nodoComponenteActivo" class="text-caption text-secondary mb-3">
              Componente: <strong>{{ nodoComponenteActivo.nombre }}</strong>
            </div>

            <v-row dense class="mb-1">
              <v-col cols="12" sm="9">
                <v-text-field
                  v-model="formVariable.nombre"
                  :rules="variableRules.nombre"
                  label="Nombre de la Variable *"
                  placeholder="Ej: Temperatura Zona 1, Presión de Aceite, Nivel de Aceite"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field
                  v-model.number="formVariable.ordenPosicion"
                  label="Orden #"
                  type="number"
                  min="0"
                  variant="outlined"
                  density="comfortable"
                  hint="Posición"
                  persistent-hint
                />
              </v-col>
            </v-row>

            <v-row dense>
              <v-col cols="12" sm="7">
                <v-select
                  v-model="formVariable.tipoEvaluacion"
                  :items="tiposEvaluacion"
                  :rules="variableRules.tipoEvaluacion"
                  label="Tipo de Evaluación *"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="5">
                <v-combobox
                  v-model="formVariable.unidad"
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

            <!-- Rango Min/Max para numéricos o temperatura -->
            <v-row v-if="formVariable.tipoEvaluacion !== 'SELECCION'" dense class="mt-1">
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="formVariable.valorMinimo"
                  :rules="reglasMinimoVariable"
                  label="Valor Mínimo"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="formVariable.valorMaximo"
                  :rules="reglasMaximoVariable"
                  label="Valor Máximo"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <!-- Opciones para tipo SELECCION -->
            <div v-if="formVariable.tipoEvaluacion === 'SELECCION'" class="mt-3 pa-3 rounded border bg-surface-variant">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold text-principal">
                  <v-icon size="16" color="primary" class="mr-1">mdi-format-list-checks</v-icon>
                  Opciones de Selección / Estados *
                </span>

                <div class="d-flex gap-1">
                  <v-btn size="x-small" variant="tonal" color="primary" @click="cargarOpcionesEstandarVariable">
                    Estándar (N, E, A, B, NE, N/A)
                  </v-btn>
                  <v-btn size="x-small" variant="text" color="secondary" @click="cargarOpcionesBinariasVariable">
                    Binario (OK / NOK)
                  </v-btn>
                  <v-btn size="x-small" variant="text" color="error" @click="limpiarOpcionesVariable">
                    Limpiar
                  </v-btn>
                </div>
              </div>

              <v-textarea
                v-model="formVariable.opcionesTexto"
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
              <div v-if="opcionesParseadasVariable.length > 0" class="mt-2 d-flex flex-wrap gap-1">
                <v-chip
                  v-for="(opc, idx) in opcionesParseadasVariable"
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
            <v-btn variant="text" :disabled="cargando" @click="mostrarDialogoVariable = false">
              Cancelar
            </v-btn>
            <v-btn color="primary" variant="flat" :loading="cargando" type="submit">
              {{ esEdicion ? 'Actualizar Variable' : 'Guardar Variable' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- 5. DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN -->
    <v-dialog v-model="mostrarDialogoEliminar" max-width="440px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-error text-white py-3 px-4 d-flex align-center">
          <v-icon start>mdi-alert-octagon</v-icon>
          <span>Confirmar Eliminación</span>
        </v-card-title>
        <v-card-text class="pa-4 pt-5">
          <p class="text-body-1 mb-2">
            ¿Está seguro de que desea eliminar
            <span v-if="tipoEliminacion === 'EQUIPO'">el equipo</span>
            <span v-else-if="tipoEliminacion === 'COMPONENTE'">el componente</span>
            <span v-else>la variable</span>
            <strong> {{ nombreAEliminar }}</strong>?
          </p>
          <p class="text-caption text-secondary mb-0">
            Esta acción desactivará el registro y no se podrá deshacer directamente.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end">
          <v-btn variant="text" :disabled="cargando" @click="mostrarDialogoEliminar = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="flat" :loading="cargando" @click="confirmarEliminar">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.gap-1 {
  gap: 4px;
}
</style>
