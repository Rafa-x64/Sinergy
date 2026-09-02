<script setup lang="ts">
import { computed } from "vue"
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js"
import { Doughnut, Bar } from "vue-chartjs"
import type { DisponibilidadPorPlanta } from "../dashboard.store"

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement)

const props = defineProps<{
  porPlanta: DisponibilidadPorPlanta[]
  global: Array<{ estado: string; cantidad: number; porcentaje: number }>
  cargando: boolean
}>()

const COLORES_GLOBAL: Record<string, string> = {
  OPERATIVO: "#10b981",       // Esmeralda vibrante
  INOPERATIVO: "#f43f5e",     // Rose
  EN_MANTENIMIENTO: "#f59e0b" // Ámbar
}

const totalFlota = computed(() => props.global.reduce((acc, g) => acc + g.cantidad, 0))
const disponibilidadPct = computed(() => {
  const op = props.global.find(g => g.estado === "OPERATIVO")
  if (!op || totalFlota.value === 0) return 0
  return Math.round((op.cantidad / totalFlota.value) * 100)
})

const doughnutData = computed(() => ({
  labels: props.global.map(g => g.estado === "OPERATIVO" ? "Operativo" : g.estado === "INOPERATIVO" ? "Inoperativo" : "En Mantenimiento"),
  datasets: [
    {
      data: props.global.map(g => g.cantidad),
      backgroundColor: props.global.map(g => COLORES_GLOBAL[g.estado] || "#94a3b8"),
      borderColor: "#ffffff",
      borderWidth: 3,
      hoverOffset: 4
    }
  ]
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "75%",
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: "#64748b",
        font: { size: 12, weight: "bold" as const },
        padding: 16,
        usePointStyle: true,
        pointStyle: "circle"
      }
    },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#f8fafc",
      bodyColor: "#cbd5e1",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => {
          const val = context.raw || 0
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0
          return ` ${context.label}: ${val} equipos (${pct}%)`
        }
      }
    }
  }
}

const barData = computed(() => ({
  labels: props.porPlanta.map(p => p.nombre),
  datasets: [
    {
      label: "Operativo",
      data: props.porPlanta.map(p => p.OPERATIVO),
      backgroundColor: "#10b981",
      borderRadius: 4,
      maxBarThickness: 18
    },
    {
      label: "En Mantenimiento",
      data: props.porPlanta.map(p => p.EN_MANTENIMIENTO),
      backgroundColor: "#f59e0b",
      borderRadius: 4,
      maxBarThickness: 18
    },
    {
      label: "Inoperativo",
      data: props.porPlanta.map(p => p.INOPERATIVO),
      backgroundColor: "#f43f5e",
      borderRadius: 4,
      maxBarThickness: 18
    }
  ]
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y" as const,
  scales: {
    x: {
      stacked: true,
      grid: { color: "rgba(148, 163, 184, 0.15)" },
      ticks: { color: "#64748b", font: { size: 11 } }
    },
    y: {
      stacked: true,
      grid: { display: false },
      ticks: { color: "#334155", font: { size: 12, weight: "bold" as const } }
    }
  },
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: "#64748b",
        usePointStyle: true,
        pointStyle: "circle",
        padding: 14,
        font: { size: 11 }
      }
    },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#f8fafc",
      bodyColor: "#cbd5e1",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8
    }
  }
}
</script>

<template>
  <v-row dense>
    <v-col cols="12" md="5" class="d-flex">
      <v-card class="elevation-1 rounded-xl pa-4 pa-sm-5 w-100 d-flex flex-column bg-surface border">
        <div class="d-flex align-center justify-space-between mb-1">
          <div class="text-subtitle-1 font-weight-bold text-slate-800">Distribución Global de Flota</div>
          <v-chip size="x-small" color="success" variant="flat" class="font-weight-bold">Tiempo Real</v-chip>
        </div>
        <div class="text-caption text-medium-emphasis mb-3">Relación Operativo / Inoperativo / Mantenimiento</div>
        
        <div v-if="cargando" class="d-flex justify-center align-center flex-grow-1" style="min-height: 240px;">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <div v-else-if="global.length === 0" class="d-flex justify-center align-center flex-grow-1 text-caption text-medium-emphasis" style="min-height: 240px;">
          Sin datos de equipos registrados
        </div>
        <div v-else class="flex-grow-1 position-relative d-flex justify-center align-center" style="min-height: 240px;">
          <div class="donut-chart-container w-100 h-100 position-relative">
            <Doughnut :data="doughnutData" :options="doughnutOptions" />
            <div class="donut-center-badge">
              <div class="text-h4 font-weight-bold text-success">{{ disponibilidadPct }}%</div>
              <div class="text-caption text-medium-emphasis font-weight-medium">Operatividad</div>
            </div>
          </div>
        </div>
      </v-card>
    </v-col>

    <v-col cols="12" md="7" class="d-flex">
      <v-card class="elevation-1 rounded-xl pa-4 pa-sm-5 w-100 d-flex flex-column bg-surface border">
        <div class="d-flex align-center justify-space-between mb-1">
          <div class="text-subtitle-1 font-weight-bold text-slate-800">Disponibilidad por Planta Industrial</div>
          <v-chip size="x-small" color="info" variant="tonal">Comparativa</v-chip>
        </div>
        <div class="text-caption text-medium-emphasis mb-3">Distribución de equipos por cada sede de manufactura</div>

        <div v-if="cargando" class="d-flex justify-center align-center flex-grow-1" style="min-height: 240px;">
          <v-progress-circular indeterminate color="info" />
        </div>
        <div v-else-if="porPlanta.length === 0" class="d-flex justify-center align-center flex-grow-1 text-caption text-medium-emphasis" style="min-height: 240px;">
          Sin datos de plantas
        </div>
        <div v-else class="flex-grow-1 position-relative" style="min-height: 240px;">
          <Bar :data="barData" :options="barOptions" />
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.donut-chart-container {
  min-height: 230px;
}
.donut-center-badge {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}
</style>
