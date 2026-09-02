<script setup lang="ts">
import { computed } from "vue"
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Filler
} from "chart.js"
import { Line } from "vue-chartjs"
import type { EvolucionMes } from "../dashboard.store"

ChartJS.register(Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale, Filler)

const props = defineProps<{
  datos: EvolucionMes[]
  cargando: boolean
}>()

const chartData = computed(() => ({
  labels: props.datos.map(d => d.mes),
  datasets: [
    {
      label: "% Disponibilidad Operativa",
      data: props.datos.map(d => d.porcentaje),
      borderColor: "#0284c7",
      backgroundColor: "rgba(2, 132, 199, 0.10)",
      borderWidth: 3,
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: "#0284c7",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { color: "rgba(148, 163, 184, 0.15)" },
      ticks: { color: "#64748b", font: { size: 11 } }
    },
    y: {
      min: 0,
      max: 100,
      grid: { color: "rgba(148, 163, 184, 0.15)" },
      ticks: {
        color: "#64748b",
        font: { size: 11 },
        callback: (val: any) => `${val}%`
      }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#f8fafc",
      bodyColor: "#38bdf8",
      borderColor: "rgba(2, 132, 199, 0.3)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => ` Disponibilidad: ${context.raw}% de la flota activa`
      }
    }
  }
}
</script>

<template>
  <v-card class="elevation-1 rounded-xl pa-4 pa-sm-5 h-100 d-flex flex-column bg-surface border">
    <div class="d-flex align-center justify-space-between mb-1">
      <div class="text-subtitle-1 font-weight-bold text-slate-800 d-flex align-center gap-1">
        <v-icon size="20" color="info">mdi-chart-line</v-icon>
        Evolución de Disponibilidad (Últimos 6 Meses)
      </div>
      <v-chip size="x-small" color="primary" variant="tonal">Gerencia</v-chip>
    </div>
    <div class="text-caption text-medium-emphasis mb-3">% Equipos Operativos a lo largo del tiempo</div>

    <div v-if="cargando" class="d-flex justify-center align-center flex-grow-1" style="min-height: 260px;">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <div v-else-if="datos.length === 0" class="d-flex justify-center align-center flex-grow-1 text-caption text-medium-emphasis" style="min-height: 260px;">
      Sin datos históricos suficientes
    </div>
    <div v-else class="flex-grow-1 position-relative" style="min-height: 260px;">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </v-card>
</template>
