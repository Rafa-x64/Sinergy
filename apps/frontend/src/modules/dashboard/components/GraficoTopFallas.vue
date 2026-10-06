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
import type { TopRiesgoItem } from "../dashboard.store"

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{
  datos: TopRiesgoItem[]
  cargando: boolean
}>()

const chartData = computed(() => ({
  labels: props.datos.map(d => `${d.codigo} — ${d.nombre.length > 18 ? d.nombre.slice(0, 18) + '...' : d.nombre}`),
  datasets: [
    {
      label: "Score de Riesgo",
      data: props.datos.map(d => d.scoreTotal),
      backgroundColor: (context: any) => {
        const val = context.raw || 0
        if (val >= 50) return "#f43f5e"
        if (val >= 25) return "#f59e0b"
        return "#38bdf8"
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
      padding: 14,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => {
          const item = props.datos[context.dataIndex]
          if (!item) return []
          const d = item.desglose
          const estadoLabel = item.estadoOperativo === 'INOPERATIVO'
            ? 'Inoperativo (+15 pts)'
            : item.estadoOperativo === 'EN_MANTENIMIENTO'
              ? 'En Mantenimiento (+8 pts)'
              : 'Operativo'
          return [
            ` Score total: ${item.scoreTotal} / 100`,
            ` Sede: ${item.plantaNombre}`,
            `─────────────────────────`,
            ` Variables fuera de rango: ${d.variables.porcentaje}%  (${d.variables.fueraRango}/${d.variables.total} vars)`,
            ` Lubricación vencida:      ${d.lubricacion.porcentaje}%  (${d.lubricacion.puntosVencidos}/${d.lubricacion.totalPuntos} puntos fuera de plazo)`,
            ` Rutinas con fuga:         ${d.fugas.porcentaje}%  (${d.fugas.rutinasConFuga}/${d.fugas.totalRutinas} rutinas)`,
            ` Estado operativo:         ${estadoLabel}`
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
        Top 10 Equipos con Mayor Riesgo
      </div>
      <v-chip size="x-small" color="error" variant="tonal" class="font-weight-bold">Críticos</v-chip>
    </div>
    <div class="text-caption text-medium-emphasis mb-3">
      Score compuesto: variables fuera de rango · lubricación vencida · fugas · estado operativo
    </div>

    <div v-if="cargando" class="d-flex justify-center align-center flex-grow-1" style="min-height: 260px;">
      <v-progress-circular indeterminate color="error" />
    </div>
    <div v-else-if="datos.length === 0" class="d-flex justify-center align-center flex-grow-1 text-caption text-medium-emphasis" style="min-height: 260px;">
      No se registran señales de riesgo en la flota
    </div>
    <div v-else class="flex-grow-1 position-relative" style="min-height: 260px;">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </v-card>
</template>
