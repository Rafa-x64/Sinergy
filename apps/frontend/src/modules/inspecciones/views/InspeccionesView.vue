<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import HeaderViews from '@/components/HeaderViews.vue'
import AppTabs from '@/components/AppTabs.vue'
import type { TabItem } from '@/core/types/tabs'
import WizardSeleccionAlcance from '../components/WizardSeleccionAlcance.vue'
import FormWizardInspeccion from '../components/FormWizardInspeccion.vue'
import ResumenInspeccionDialog from '../components/ResumenInspeccionDialog.vue'
import BandejaSupervisionPanel from '../components/BandejaSupervisionPanel.vue'
import { useInspeccionesStore } from '../inspecciones.store'
import { useAuthStore } from '../../auth/auth.store'

const store = useInspeccionesStore()
const authStore = useAuthStore()
const refResumenDialog = ref<InstanceType<typeof ResumenInspeccionDialog> | null>(null)

const pestañaActiva = ref<string | number>('captura')
const modoWizardActivo = ref(false)

const pestañas = computed<TabItem[]>(() => {
  const items: TabItem[] = []

  if (authStore.puedeRegistrarInspecciones) {
    items.push({ id: 'captura', name: 'Nueva Inspección', color: '#5cb85c' })
  }

  if (authStore.puedeEvaluarInspecciones) {
    items.push({ id: 'supervision', name: 'Bandeja de Aprobaciones', color: '#5cb85c' })
  }

  items.push({ id: 'historial', name: 'Historial de Inspecciones', color: '#5cb85c' })

  return items
})

const iniciarWizard = () => {
  modoWizardActivo.value = true
}

const cancelarWizard = () => {
  modoWizardActivo.value = false
}

const solicitarFinalizar = () => {
  refResumenDialog.value?.abrir()
}

const manejarEnviadoExito = () => {
  modoWizardActivo.value = false
  pestañaActiva.value = authStore.puedeEvaluarInspecciones ? 'supervision' : 'historial'
}

onMounted(() => {
  if (!authStore.puedeRegistrarInspecciones && authStore.puedeEvaluarInspecciones) {
    pestañaActiva.value = 'supervision'
  } else if (!authStore.puedeRegistrarInspecciones) {
    pestañaActiva.value = 'historial'
  }

  if (authStore.puedeRegistrarInspecciones && store.cargarBorradorLocal()) {
    console.log('Borrador de inspección restaurado desde almacenamiento local')
  }
})
</script>

<template>
  <v-container fluid class="inspecciones-view-container">
    <!-- Header principal -->
    <HeaderViews
      titulo="Inspecciones Técnicas por Planta"
      mensaje="Digitalización de capturas operativas, detección de desviaciones fuera de rango y flujo de aprobación por supervisión"
      icono="mdi-clipboard-check-multiple-outline"
      color="#5cb85c"
    />

    <!-- Pestañas Principales del Módulo -->
    <AppTabs v-model="pestañaActiva" :tabs="pestañas" class="mt-2">
      <!-- Pestaña 1: Captura de Inspección (Técnico) -->
      <template #tab-captura>
        <div class="captura-section">
          <!-- Modo 1: Selección de Alcance -->
          <WizardSeleccionAlcance
            v-if="!modoWizardActivo"
            @iniciar-wizard="iniciarWizard"
          />

          <!-- Modo 2: Form Wizard Paso a Paso -->
          <FormWizardInspeccion
            v-else
            @cancelar="cancelarWizard"
            @finalizar="solicitarFinalizar"
          />
        </div>
      </template>

      <!-- Pestaña 2: Bandeja de Supervisión -->
      <template #tab-supervision>
        <BandejaSupervisionPanel />
      </template>

      <!-- Pestaña 3: Historial General -->
      <template #tab-historial>
        <v-card class="elevation-1 pa-6 rounded-lg text-center bg-surface border">
          <v-icon size="48" color="#5cb85c" class="mb-2">mdi-history</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold">Historial General de Inspecciones</h3>
          <p class="text-caption text-medium-emphasis">
            Filtra y exporta el registro histórico de inspecciones aprobadas y rechazadas.
          </p>
        </v-card>
      </template>
    </AppTabs>

    <!-- Modal Resumen antes de Enviar -->
    <ResumenInspeccionDialog
      ref="refResumenDialog"
      @enviado-exito="manejarEnviadoExito"
    />
  </v-container>
</template>

<style scoped>
.inspecciones-view-container {
  min-height: calc(100vh - 80px);
}
</style>
