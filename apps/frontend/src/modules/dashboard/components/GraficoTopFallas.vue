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
import type { TopFallaItem } from "../dashboard.store"

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{
  datos: TopFallaItem[]
  cargando: boolean
}>()

const chartData = computed(() => ({
  labels: props.datos.map(d => `${d.codigo} — ${d.nombre.length > 18 ? d.nombre.slice(0, 18) + '...' : d.nombre}`),
  datasets: [
    {
      label: "% Variables Fuera de Rango",
      data: props.datos.map(d => d.porcentajeFallas),
      backgroundColor: (context: any) => {
        const val = context.raw || 0
        if (val >= 40) return "#f43f5e" // Rose
        if (val >= 20) return "#f59e0b" // Ámbar
        return "#38bdf8" // Sky
      },
      borderRadius: 6,
      maxBarThickness: 16
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y" as const,
  scales: {
    x: {
      min: 0,
      max: 100,
      grid: { color: "rgba(148, 163, 184, 0.15)" },
      ticks: {
        color: "#64748b",
        font: { size: 11 },
        callback: (val: any) => `${val}%`
      }
    },
    y: {
      grid: { display: false },
      ticks: { color: "#334155", font: { size: 11, weight: "bold" as const } }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#f8fafc",
      bodyColor: "#cbd5e1",
      borderColor: "rgba(244, 63, 94, 0.3)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => {
          const item = props.datos[context.dataIndex]
          return [
            ` ${context.raw}% de lecturas fuera de límites`,
            ` Desvíos: ${item?.fueraDeRango || 0} de ${item?.totalVariables || 0} variables evaluadas`,
            ` Sede: ${item?.plantaNombre || 'General'}`
          ]
        }
      }
    }
  }
}
</script>

<template>
  <v-card class="elevation-1 rounded-xl pa-4 pa-sm-5 h-100 d-flex flex-column bg-surface border">
    <div class="d-flex align-center justify-space-between mb-1">
      <div class="text-subtitle-1 font-weight-bold text-slate-800 d-flex align-center gap-1">
        <v-icon size="20" color="error">mdi-alert-octagon-outline</v-icon>
        Top 10 Equipos con más Fallas
      </div>
      <v-chip size="x-small" color="error" variant="tonal" class="font-weight-bold">Críticos</v-chip>
    </div>
    <div class="text-caption text-medium-emphasis mb-3">% histórico de variables fuera de límites normativos</div>

    <div v-if="cargando" class="d-flex justify-center align-center flex-grow-1" style="min-height: 260px;">
      <v-progress-circular indeterminate color="error" />
    </div>
    <div v-else-if="datos.length === 0" class="d-flex justify-center align-center flex-grow-1 text-caption text-medium-emphasis" style="min-height: 260px;">
      No se registran desvíos fuera de rango en la flota
    </div>
    <div v-else class="flex-grow-1 position-relative" style="min-height: 260px;">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </v-card>
</template>
