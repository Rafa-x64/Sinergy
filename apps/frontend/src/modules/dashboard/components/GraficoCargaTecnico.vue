<script setup lang="ts">
import { computed } from "vue"
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from "chart.js"
import { Bar } from "vue-chartjs"
import type { CargaTecnicoItem } from "../dashboard.store"

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{
  datos: CargaTecnicoItem[]
  cargando: boolean
}>()

const chartData = computed(() => ({
  labels: props.datos.map(d => d.nombre),
  datasets: [
    {
      label: "Inspecciones Elaboradas",
      data: props.datos.map(d => d.cantidad),
      backgroundColor: "#6366f1", // Indigo
      borderRadius: 6,
      maxBarThickness: 24
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: "#334155",
        font: { size: 11, weight: "bold" as const },
        maxRotation: 35,
        minRotation: 15
      }
    },
    y: {
      grid: { color: "rgba(148, 163, 184, 0.15)" },
      ticks: {
        color: "#64748b",
        stepSize: 1,
        precision: 0,
        font: { size: 11 }
      }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#f8fafc",
      bodyColor: "#c7d2fe",
      borderColor: "rgba(99, 102, 241, 0.3)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => ` ${context.raw} rondas técnicas elaboradas en el mes`
      }
    }
  }
}
</script>

<template>
  <v-card class="elevation-1 rounded-xl pa-4 pa-sm-5 h-100 d-flex flex-column bg-surface border">
    <div class="d-flex align-center justify-space-between mb-1">
      <div class="text-subtitle-1 font-weight-bold text-slate-800 d-flex align-center gap-1">
        <v-icon size="20" color="secondary">mdi-account-hard-hat-outline</v-icon>
        Carga de Trabajo por Técnico
      </div>
      <v-chip size="x-small" color="secondary" variant="tonal" class="font-weight-bold">Productividad</v-chip>
    </div>
    <div class="text-caption text-medium-emphasis mb-3">Inspecciones elaboradas en el mes seleccionado</div>

    <div v-if="cargando" class="d-flex justify-center align-center flex-grow-1" style="min-height: 240px;">
      <v-progress-circular indeterminate color="secondary" />
    </div>
    <div v-else-if="datos.length === 0" class="d-flex justify-center align-center flex-grow-1 text-caption text-medium-emphasis" style="min-height: 240px;">
      Sin inspecciones registradas este mes
    </div>
    <div v-else class="flex-grow-1 position-relative" style="min-height: 240px;">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </v-card>
</template>
