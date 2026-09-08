<script setup lang="ts">
import { computed } from 'vue'
import type { EstadoSemaforoLubricacion } from '../types/lubricacion.types'

const props = defineProps<{
  estado: EstadoSemaforoLubricacion
  porcentaje?: number
  mostrarPorcentaje?: boolean
}>()

const configuracion = computed(() => {
  switch (props.estado) {
    case 'CRITICO':
      return {
        color: 'error',
        icono: 'mdi-alert-octagon',
        texto: 'Crítico',
        claseBadge: 'badge-critico'
      }
    case 'PREVENTIVO':
      return {
        color: 'warning',
        icono: 'mdi-alert',
        texto: 'Preventivo',
        claseBadge: 'badge-preventivo'
      }
    case 'NORMAL':
    default:
      return {
        color: 'success',
        icono: 'mdi-check-circle',
        texto: 'Normal',
        claseBadge: 'badge-normal'
      }
  }
})
</script>

<template>
  <v-chip
    :color="configuracion.color"
    size="small"
    variant="flat"
    class="font-weight-medium text-uppercase text-caption px-2"
  >
    <v-icon start size="14">{{ configuracion.icono }}</v-icon>
    <span>{{ configuracion.texto }}</span>
    <span v-if="mostrarPorcentaje && porcentaje !== undefined" class="ms-1 font-weight-bold">
      ({{ Math.round(porcentaje) }}%)
    </span>
  </v-chip>
</template>

<style scoped>
.v-chip {
  letter-spacing: 0.5px;
}
</style>
