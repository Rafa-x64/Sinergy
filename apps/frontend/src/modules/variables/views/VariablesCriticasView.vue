<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import HeaderViews from '@/components/HeaderViews.vue'
import AppTabs from '@/components/AppTabs.vue'
import type { TabItem } from '@/core/types/tabs'
import JerarquiaTreeView from '../components/JerarquiaTreeView.vue'
import DetalleVariablesPanel from '../components/DetalleVariablesPanel.vue'
import DialogosJerarquia from '../components/DialogosJerarquia.vue'
import PlantillasVariablesPanel from '../components/PlantillasVariablesPanel.vue'
import {
  useVariablesCriticasStore,
  type ContextoComponenteSeleccionado,
  type PlantaNodo,
  type UbicacionTecnicaNodo,
  type LineaNodo,
  type EquipoNodo,
  type ComponenteNodo,
  type VariableInstancia
} from '../variables.store'

const toast = useToast()
const variablesStore = useVariablesCriticasStore()
const refDialogos = ref<InstanceType<typeof DialogosJerarquia> | null>(null)

const pestañaActiva = ref<string | number>('navegacion')

const pestañas = computed<TabItem[]>(() => [
  { id: 'navegacion', name: 'Estructura y Variables por Componente', color: 'primary' },
  { id: 'plantillas', name: 'Plantillas por Tipo de Equipo', color: 'indigo' }
])

const {
  arbolJerarquico,
  cargandoJerarquia,
  cargandoVariables,
  componenteSeleccionado,
  variablesComponente
} = storeToRefs(variablesStore)

const inicializarJerarquia = async () => {
  const [resArbol, _resTipos] = await Promise.all([
    variablesStore.cargarArbolJerarquico(),
    variablesStore.cargarTiposEquipo()
  ])

  if (resArbol.status === 'error') {
    toast.error(resArbol.message ?? 'Error al cargar la jerarquía de plantas')
  }
}

const manejarSeleccionComponente = async (contexto: ContextoComponenteSeleccionado) => {
  await variablesStore.seleccionarComponente(contexto)
}

// ─── MANEJADORES DE ACCIONES CONTEXTUALES DEL ÁRBOL ───────────────────────────

const manejarCrearUbicacion = (planta: PlantaNodo) => {
  refDialogos.value?.abrirCrearUbicacion(planta)
}

const manejarCrearLinea = (ubicacion: UbicacionTecnicaNodo) => {
  refDialogos.value?.abrirCrearLinea(ubicacion)
}

const manejarCrearEquipo = (linea: LineaNodo) => {
  refDialogos.value?.abrirCrearEquipo(linea)
}

const manejarEditarEquipo = (equipo: EquipoNodo) => {
  refDialogos.value?.abrirEditarEquipo(equipo)
}

const manejarEliminarEquipo = (equipo: EquipoNodo) => {
  refDialogos.value?.abrirEliminarEquipo(equipo)
}

const manejarCrearComponente = (equipo: EquipoNodo) => {
  refDialogos.value?.abrirCrearComponente(equipo)
}

const manejarEditarComponente = (componente: ComponenteNodo) => {
  refDialogos.value?.abrirEditarComponente(componente)
}

const manejarEliminarComponente = (componente: ComponenteNodo) => {
  refDialogos.value?.abrirEliminarComponente(componente)
}

const manejarCrearVariableArbol = (componente: ComponenteNodo) => {
  refDialogos.value?.abrirCrearVariable(componente)
}

const manejarSincronizarPlantilla = async (componente: ComponenteNodo, equipo?: EquipoNodo) => {
  toast.info(`Iniciando sincronización con plantilla para "${componente.nombre}"...`)
  const res = await variablesStore.sincronizarComponente(componente.id)
  if (res.status === 'ok') {
    toast.success(res.message ?? `Componente "${componente.nombre}" sincronizado exitosamente`)
  } else {
    toast.error(res.message ?? 'Error al sincronizar con la plantilla')
  }
}

// ─── MANEJADORES DE ACCIONES DEL PANEL DERECHO DE VARIABLES ───────────────────

const manejarCrearVariablePanel = () => {
  if (!componenteSeleccionado.value) {
    toast.warning('Selecciona primero un componente en el árbol')
    return
  }
  refDialogos.value?.abrirCrearVariable(componenteSeleccionado.value.componente)
}

const manejarEditarVariable = (variable: VariableInstancia) => {
  refDialogos.value?.abrirEditarVariable(variable)
}

const manejarEliminarVariable = (variable: VariableInstancia) => {
  refDialogos.value?.abrirEliminarVariable(variable)
}

const manejarDuplicarVariable = async (variable: VariableInstancia) => {
  const res = await variablesStore.duplicarVariable(variable)
  if (res.status === 'ok') {
    toast.success(`Variable "${variable.nombre}" duplicada correctamente`)
  } else {
    toast.error(res.message ?? 'Error al duplicar la variable')
  }
}

const manejarRestablecerVariable = async (variable: VariableInstancia) => {
  if (!variable.componenteId) return
  toast.info(`Restableciendo variables desde plantilla...`)
  const res = await variablesStore.sincronizarComponente(variable.componenteId)
  if (res.status === 'ok') {
    toast.success(`Variable restablecida a la configuración de plantilla`)
  } else {
    toast.error(res.message ?? 'Error al restablecer la variable')
  }
}

onMounted(() => {
  inicializarJerarquia()
})
</script>

<template>
  <v-container fluid class="variables-criticas-container">
    <!-- Header -->
    <HeaderViews
      titulo="Variables Críticas"
      mensaje="Gestión jerárquica de componentes y administración centralizada de plantillas por tipo de equipo"
      icono="mdi-variable-box"
      color="primary"
    />

    <!-- Pestañas del Módulo -->
    <AppTabs v-model="pestañaActiva" :tabs="pestañas" class="mt-2">
      <!-- Pestaña 1: Navegación y Árbol de Componentes -->
      <template #tab-navegacion>
        <v-row dense class="split-row">
          <!-- Panel Izquierdo: Árbol Jerárquico -->
          <v-col cols="12" md="4" lg="4" class="tree-column">
            <JerarquiaTreeView
              :plantas="arbolJerarquico"
              :cargando="cargandoJerarquia"
              :componente-seleccionado-id="componenteSeleccionado?.componente.id ?? null"
              @seleccionar-componente="manejarSeleccionComponente"
              @refrescar="inicializarJerarquia"
              @crear-ubicacion="manejarCrearUbicacion"
              @crear-linea="manejarCrearLinea"
              @crear-equipo="manejarCrearEquipo"
              @editar-equipo="manejarEditarEquipo"
              @eliminar-equipo="manejarEliminarEquipo"
              @crear-componente="manejarCrearComponente"
              @editar-componente="manejarEditarComponente"
              @eliminar-componente="manejarEliminarComponente"
              @crear-variable="manejarCrearVariableArbol"
              @sincronizar-plantilla="manejarSincronizarPlantilla"
            />
          </v-col>

          <!-- Panel Derecho: Detalle de Variables -->
          <v-col cols="12" md="8" lg="8" class="details-column">
            <DetalleVariablesPanel
              :contexto="componenteSeleccionado"
              :variables="variablesComponente"
              :cargando="cargandoVariables"
              @crear-variable="manejarCrearVariablePanel"
              @editar-variable="manejarEditarVariable"
              @eliminar-variable="manejarEliminarVariable"
              @duplicar-variable="manejarDuplicarVariable"
              @restablecer-variable="manejarRestablecerVariable"
            />
          </v-col>
        </v-row>
      </template>

      <!-- Pestaña 2: Plantillas de Variables por Tipo de Equipo -->
      <template #tab-plantillas>
        <PlantillasVariablesPanel />
      </template>
    </AppTabs>

    <!-- Diálogos Modales de Gestión Jerárquica -->
    <DialogosJerarquia ref="refDialogos" />
  </v-container>
</template>

<style scoped>
.split-row {
  margin-top: -8px;
}

.tree-column,
.details-column {
  min-height: calc(100vh - 230px);
}

@media (max-width: 959px) {
  .tree-column,
  .details-column {
    min-height: auto;
  }
}
</style>
