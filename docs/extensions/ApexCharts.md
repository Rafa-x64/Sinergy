# ApexCharts + vue3-apexcharts en Sinergy - Guía Completa y Tutorial

ApexCharts (`apexcharts@3.49.1` + `vue3-apexcharts@1.11.1`) es la librería principal recomendada para los Dashboards de Supervisión Industrial en Sinergy. Ofrece gráficos interactivos e impulsados por datos (Barras, Líneas, Áreas, Donas y Medidores Radiales).

---

## 1. Instalación y Registro

### Instalación de Paquetes
```powershell
# En apps/frontend
pnpm --filter @sinergy/frontend add apexcharts@3.49.1 vue3-apexcharts@^1.11.1
```

### Registro en `main.ts`

```typescript
// apps/frontend/src/main.ts
import { createApp } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import App from './App.vue'

const app = createApp(App)
app.use(VueApexCharts)
app.mount('#app')
```

---

## 2. Tutorial de Componentes Vue 3 (`<apexchart>`)

### A. Gráfico de Barras Responsivo (Inspecciones Semanales)

```vue
<!-- apps/frontend/src/components/dashboard/GraficoInspeccionesSemana.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ApexOptions } from 'apexcharts'
import { useTheme } from 'vuetify'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

// 1. Datos de las Series
const series = ref([
  {
    name: 'Inspecciones Realizadas',
    data: [12, 19, 15, 22, 18, 25, 10]
  },
  {
    name: 'Alertas Críticas',
    data: [2, 1, 4, 0, 3, 1, 0]
  }
])

// 2. Opciones de Configuración Computadas (para reaccionar al cambio de tema Claro/Oscuro)
const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    height: 350,
    toolbar: { show: false },
    background: 'transparent',
    foreColor: isDark.value ? '#E0E0E0' : '#424242'
  },
  colors: ['#1E88E5', '#FF5252'],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 4
    }
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: {
    categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  },
  yaxis: {
    title: { text: 'Cantidad de Registros' }
  },
  fill: { opacity: 1 },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light'
  }
}))
</script>

<template>
  <v-card elevation="2" class="pa-4">
    <v-card-title class="d-flex align-center gap-2">
      <v-icon icon="mdi-chart-bar" color="primary" />
      Resumen Semanal de Inspecciones
    </v-card-title>
    <v-card-text>
      <apexchart
        type="bar"
        height="350"
        :options="chartOptions"
        :series="series"
      />
    </v-card-text>
  </v-card>
</template>
```

---

### B. Gráfico de Dona (Distribución de Estado de Equipos)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ApexOptions } from 'apexcharts'

const series = ref([45, 12, 3]) // Operativos, Mantenimiento, Críticos

const chartOptions = ref<ApexOptions>({
  chart: { type: 'donut' },
  labels: ['Operativos', 'En Mantenimiento', 'Estado Crítico'],
  colors: ['#4CAF50', '#FB8C00', '#FF5252'],
  legend: { position: 'bottom' },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: { width: 300 },
        legend: { position: 'bottom' }
      }
    }
  ]
})
</script>

<template>
  <v-card elevation="2" class="pa-4">
    <v-card-title>Salud de Planta</v-card-title>
    <apexchart type="donut" height="280" :options="chartOptions" :series="series" />
  </v-card>
</template>
```
