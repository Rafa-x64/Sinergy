<script setup lang="ts">
import { ref, onMounted } from "vue"
import * as XLSX from "xlsx"
import api from "@/core/api"
import { useDashboardStore } from "../dashboard.store"
import { exportarTablaPDF } from "../utils/pdfExport"

const store = useDashboardStore()

// Sub-pestaña de reportes (R1 a R6 + RLUB)
const reporteSeleccionado = ref<"r1" | "r2" | "r3" | "r4" | "r5" | "r6" | "rlub">("r1")

// Filtros y estado para R7: Lubricación
const rlubSubTab = ref<"fugas" | "consumo">("fugas")
const rlubPlantaId = ref<number | undefined>(undefined)
const rlubFechaDesde = ref<string>("")
const rlubFechaHasta = ref<string>("")
const rlubCargando = ref(false)
const rlubDescargandoExcel = ref(false)

interface FugaReporteDashboardItem {
  rutinaId: string
  codigoRutina: string
  fechaEjecucion: string
  equipoId: number
  equipoCodigo: string
  equipoNombre: string
  plantaNombre: string
  ubicacionNombre: string
  puntoId: number
  puntoNombre: string
  lubricanteNombre: string
  observaciones: string | null
}

interface ConsumoReporteDashboardItem {
  lubricanteId: number
  lubricanteCodigo: string
  lubricanteNombre: string
  tipo: string
  unidadMedida: string
  totalRepuesto: number
  intervenciones: number
}

const rlubFugas = ref<FugaReporteDashboardItem[]>([])
const rlubConsumo = ref<ConsumoReporteDashboardItem[]>([])

// Filtros para R1
const r1PlantaId = ref<number | undefined>(undefined)
const r1TipoEquipoId = ref<number | undefined>(undefined)
const r1Estado = ref<string>("")
const r1DescargandoExcel = ref(false)
const r1DescargandoPdf = ref(false)

// Filtros para R2
const r2Estado = ref("")
const r2Inicio = ref("")
const r2Fin = ref("")
const r2DescargandoExcel = ref(false)
const r2DescargandoPdf = ref(false)

// Filtros para R3
const r3Inicio = ref("")
const r3Fin = ref("")
const r3DescargandoExcel = ref(false)
const r3DescargandoPdf = ref(false)

// Filtros para R4
const r4Mes = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM
const r4DescargandoPdf = ref(false)

// Filtros para R5
const r5DescargandoExcel = ref(false)
const r5DescargandoPdf = ref(false)

// Filtros para R6 (Tarjeta de ronda)
const equiposDisponibles = ref<Array<{ id: number; codigo: string; nombre: string }>>([])
const r6EquipoId = ref<number | null>(null)
const r6DatosEquipo = ref<any>(null)
const r6Cargando = ref(false)

// Catálogos auxiliares
const listaPlantas = ref<Array<{ id: number; nombre: string }>>([])
const listaTiposEquipo = ref<Array<{ id: number; nombre: string }>>([])

async function cargarCatalogos() {
  try {
    const [resP, resT, resE] = await Promise.allSettled([
      api.get("/plantas/listar"),
      api.get("/equipos/tipo/listar"),
      api.get("/equipos/listar")
    ])

    if (resP.status === "fulfilled" && resP.value.data) {
      listaPlantas.value = resP.value.data.data || resP.value.data || []
    }
    if (resT.status === "fulfilled" && resT.value.data) {
      listaTiposEquipo.value = resT.value.data.data || resT.value.data || []
    }
    if (resE.status === "fulfilled" && resE.value.data) {
      const listaEquipos = resE.value.data.data || resE.value.data || []
      equiposDisponibles.value = listaEquipos.map((e: any) => ({
        id: e.id,
        codigo: e.codigo,
        nombre: `${e.codigo} — ${e.nombre}`
      }))
    }
  } catch (err) {
    console.error("Error al cargar catálogos de reportes", err)
  }
}

// ═══════════════════════════════════════════════════════════════
// R1: ESTADO DE FLOTA
// ═══════════════════════════════════════════════════════════════
async function cargarR1() {
  await store.cargarReporteFlota({
    plantaId: r1PlantaId.value,
    tipoEquipoId: r1TipoEquipoId.value,
    estadoOperativo: r1Estado.value || undefined
  })
}

function exportarR1Excel() {
  if (!store.reporteFlota?.equipos.length) return
  r1DescargandoExcel.value = true
  try {
    const filas = store.reporteFlota.equipos.map(e => ({
      "Código": e.codigo,
      "Nombre de Equipo": e.nombre,
      "Tipo de Maquinaria": e.tipoEquipo,
      "Planta Industrial": e.planta,
      "Ubicación Técnica": e.ubicacion,
      "Serial": e.serial,
      "Marca": e.marca,
      "Modelo": e.modelo,
      "Estado Actual": e.estadoOperativo,
      "Última Inspección": e.ultimaInspeccionFecha ? new Date(e.ultimaInspeccionFecha).toLocaleDateString("es-ES") : "Sin registro",
      "Estado Última Ronda": e.ultimaInspeccionEstado || "-"
    }))

    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Estado_Flota")
    XLSX.writeFile(wb, `Reporte_R1_Estado_Flota_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } finally {
    r1DescargandoExcel.value = false
  }
}

function exportarR1Pdf() {
  if (!store.reporteFlota?.equipos.length) return
  r1DescargandoPdf.value = true
  try {
    exportarTablaPDF({
      titulo: "Reporte de Estado de Flota Industrial (R1)",
      subtitulo: "Inventario general de maquinaria con estado operativo y última inspección",
      nombreArchivo: `R1_Estado_Flota_${new Date().toISOString().slice(0, 10)}`,
      resumen: [
        { label: "Total Flota", valor: `${store.reporteFlota.resumen.total} equipos` },
        { label: "Operativos", valor: `${store.reporteFlota.resumen.operativos}` },
        { label: "En Mantenimiento", valor: `${store.reporteFlota.resumen.enMantenimiento}` },
        { label: "Inoperativos", valor: `${store.reporteFlota.resumen.inoperativos}` },
        { label: "Disponibilidad", valor: `${store.reporteFlota.resumen.porcentajeDisponibilidad}%` }
      ],
      columnas: [
        { title: "Código", key: "codigo", width: 28 },
        { title: "Nombre del Equipo", key: "nombre", width: 55 },
        { title: "Tipo Maquinaria", key: "tipoEquipo", width: 35 },
        { title: "Planta", key: "planta", width: 35 },
        { title: "Serial", key: "serial", width: 30 },
        { title: "Estado Actual", key: "estadoOperativo", width: 35 },
        { title: "Última Insp.", key: "ultimaInspStr", width: 35 }
      ],
      filas: store.reporteFlota.equipos.map(e => ({
        ...e,
        ultimaInspStr: e.ultimaInspeccionFecha ? new Date(e.ultimaInspeccionFecha).toLocaleDateString("es-ES") : "Sin registro"
      }))
    })
  } finally {
    r1DescargandoPdf.value = false
  }
}

// ═══════════════════════════════════════════════════════════════
// R2: INSPECCIONES DEL PERÍODO
// ═══════════════════════════════════════════════════════════════
async function cargarR2() {
  await store.cargarInspeccionesDelPeriodo({
    estado: r2Estado.value || undefined,
    fechaInicio: r2Inicio.value || undefined,
    fechaFin: r2Fin.value || undefined,
    limite: 500
  })
}

function exportarR2Excel() {
  if (!store.inspeccionesDelPeriodo?.inspecciones.length) return
  r2DescargandoExcel.value = true
  try {
    const filas = store.inspeccionesDelPeriodo.inspecciones.map(i => ({
      "Código Inspección": i.codigoInspeccion,
      "Fecha": new Date(i.fechaRegistro).toLocaleString("es-ES"),
      "Planta": i.planta?.nombre || "N/A",
      "Código Equipo": i.equipo?.codigo || "N/A",
      "Nombre Equipo": i.equipo?.nombre || "N/A",
      "Tipo Maquinaria": i.tipoEquipo?.nombre || "N/A",
      "Técnico": i.elaboradoPor ? `${i.elaboradoPor.nombre} ${i.elaboradoPor.apellido}` : "N/A",
      "Estado": i.estadoInspeccion,
      "Variables Evaluadas": i._count?.detalles || 0
    }))

    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Inspecciones")
    XLSX.writeFile(wb, `Reporte_R2_Inspecciones_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } finally {
    r2DescargandoExcel.value = false
  }
}

function exportarR2Pdf() {
  if (!store.inspeccionesDelPeriodo?.inspecciones.length) return
  r2DescargandoPdf.value = true
  try {
    exportarTablaPDF({
      titulo: "Reporte de Inspecciones del Período (R2)",
      subtitulo: "Seguimiento y cobertura de rondas de inspección técnica mensual",
      nombreArchivo: `R2_Inspecciones_${new Date().toISOString().slice(0, 10)}`,
      resumen: [
        { label: "Total Inspecciones", valor: `${store.inspeccionesDelPeriodo.total}` },
        { label: "Aprobadas", valor: `${store.inspeccionesDelPeriodo.aprobadas}` },
        { label: "Rechazadas", valor: `${store.inspeccionesDelPeriodo.rechazadas}` },
        { label: "Tasa Aprobación", valor: `${store.inspeccionesDelPeriodo.tasaAprobacion}%` }
      ],
      columnas: [
        { title: "Código", key: "codigoInspeccion", width: 45 },
        { title: "Fecha", key: "fechaStr", width: 35 },
        { title: "Planta", key: "plantaNombre", width: 35 },
        { title: "Equipo", key: "equipoStr", width: 50 },
        { title: "Técnico Responsable", key: "tecnicoNombre", width: 45 },
        { title: "Estado", key: "estadoInspeccion", width: 30 },
        { title: "Variables", key: "totalVars", width: 25 }
      ],
      filas: store.inspeccionesDelPeriodo.inspecciones.map(i => ({
        codigoInspeccion: i.codigoInspeccion,
        fechaStr: new Date(i.fechaRegistro).toLocaleDateString("es-ES"),
        plantaNombre: i.planta?.nombre || "General",
        equipoStr: i.equipo ? `${i.equipo.codigo} - ${i.equipo.nombre}` : "General",
        tecnicoNombre: i.elaboradoPor ? `${i.elaboradoPor.nombre} ${i.elaboradoPor.apellido}` : "-",
        estadoInspeccion: i.estadoInspeccion,
        totalVars: i._count?.detalles || 0
      }))
    })
  } finally {
    r2DescargandoPdf.value = false
  }
}

// ═══════════════════════════════════════════════════════════════
// R3: NO CONFORMIDADES
// ═══════════════════════════════════════════════════════════════
async function cargarR3() {
  await store.cargarNoConformidades({
    fechaInicio: r3Inicio.value || undefined,
    fechaFin: r3Fin.value || undefined
  })
}

function exportarR3Excel() {
  if (!store.noConformidades.length) return
  r3DescargandoExcel.value = true
  try {
    const filas = store.noConformidades.map(nc => ({
      "Código Inspección": nc.codigo_inspeccion,
      "Fecha": new Date(nc.fecha_registro).toLocaleString("es-ES"),
      "Planta": nc.planta_nombre,
      "Equipo": `${nc.equipo_codigo} - ${nc.equipo_nombre}`,
      "Componente": nc.componente_nombre,
      "Variable Crítica": nc.variable_nombre,
      "Valor Medido": nc.valor_medido,
      "Límite Mínimo": nc.valor_minimo ?? "N/A",
      "Límite Máximo": nc.valor_maximo ?? "N/A",
      "Unidad": nc.unidad || "",
      "Técnico Evaluador": nc.tecnico_nombre
    }))

    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "NoConformidades")
    XLSX.writeFile(wb, `Reporte_R3_NoConformidades_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } finally {
    r3DescargandoExcel.value = false
  }
}

function exportarR3Pdf() {
  if (!store.noConformidades.length) return
  r3DescargandoPdf.value = true
  try {
    exportarTablaPDF({
      titulo: "Reporte de equipos críticos (R3)",
      subtitulo: "Variables críticas fuera de límites normativos para justificación de mantenimiento preventivo",
      nombreArchivo: `R3_NoConformidades_${new Date().toISOString().slice(0, 10)}`,
      resumen: [
        { label: "Total Desvíos", valor: `${store.noConformidades.length}` }
      ],
      columnas: [
        { title: "Fecha", key: "fechaStr", width: 28 },
        { title: "Equipo", key: "equipoStr", width: 45 },
        { title: "Componente", key: "componente_nombre", width: 40 },
        { title: "Variable Crítica", key: "variable_nombre", width: 45 },
        { title: "Valor Medido", key: "valorMedidoStr", width: 35 },
        { title: "Rango Normativo", key: "rangoStr", width: 35 },
        { title: "Técnico", key: "tecnico_nombre", width: 35 }
      ],
      filas: store.noConformidades.map(nc => ({
        fechaStr: new Date(nc.fecha_registro).toLocaleDateString("es-ES"),
        equipoStr: `${nc.equipo_codigo} - ${nc.equipo_nombre}`,
        componente_nombre: nc.componente_nombre,
        variable_nombre: nc.variable_nombre,
        valorMedidoStr: `${nc.valor_medido} ${nc.unidad || ""}`,
        rangoStr: `[${nc.valor_minimo ?? "-∞"} a ${nc.valor_maximo ?? "+∞"}]`,
        tecnico_nombre: nc.tecnico_nombre
      }))
    })
  } finally {
    r3DescargandoPdf.value = false
  }
}

// ═══════════════════════════════════════════════════════════════
// R4: REPORTE EJECUTIVO MENSUAL
// ═══════════════════════════════════════════════════════════════
async function cargarR4() {
  await store.cargarReporteEjecutivo(undefined, r4Mes.value)
}

function exportarR4Pdf() {
  if (!store.reporteEjecutivo) return
  r4DescargandoPdf.value = true
  try {
    const kpis = store.reporteEjecutivo.kpis
    exportarTablaPDF({
      titulo: `Reporte Ejecutivo Mensual — ${store.reporteEjecutivo.periodo.etiqueta.toUpperCase()} (R4)`,
      subtitulo: "Resumen gerencial de disponibilidad operativa, productividad y causas críticas de inoperatividad",
      nombreArchivo: `R4_Reporte_Ejecutivo_${r4Mes.value}`,
      resumen: [
        { label: "Flota Total", valor: `${kpis.flotaTotal} equipos` },
        { label: "Disponibilidad", valor: `${kpis.disponibilidad}% (Tendencia: ${kpis.tendencia})` },
        { label: "Inspecciones Realizadas", valor: `${kpis.inspeccionesRealizadas}` },
        { label: "Desvíos Críticos", valor: `${kpis.totalNoConformidades}` },
        { label: "Horas Inoperativas Est.", valor: `${kpis.horasInoperatividad} hrs` }
      ],
      columnas: [
        { title: "Planta Industrial", key: "nombre", width: 70 },
        { title: "Equipos Operativos", key: "OPERATIVO", width: 60 },
        { title: "En Mantenimiento", key: "EN_MANTENIMIENTO", width: 65 },
        { title: "Inoperativos", key: "INOPERATIVO", width: 65 }
      ],
      filas: store.reporteEjecutivo.plantas
    })
  } finally {
    r4DescargandoPdf.value = false
  }
}

// ═══════════════════════════════════════════════════════════════
// R5: MATRIZ DE CRITICIDAD ABC
// ═══════════════════════════════════════════════════════════════
async function cargarR5() {
  await store.cargarMatrizCriticidad()
}

function exportarR5Excel() {
  if (!store.matrizCriticidad.length) return
  r5DescargandoExcel.value = true
  try {
    const filas = store.matrizCriticidad.map(m => ({
      "Código": m.codigo,
      "Nombre de Equipo": m.nombre,
      "Tipo Maquinaria": m.tipo,
      "Planta Industrial": m.planta,
      "Estado Operativo": m.estadoOperativo,
      "Clasificación": m.clasificacion,
      "Prioridad": m.prioridad,
      "Puntaje de Criticidad (0-100)": m.score,
      "% Variables Fuera de Rango": `${m.tasaFallas}%`,
      "% Rondas Rechazadas": `${m.tasaRechazos}%`,
      "Rondas Evaluadas": m.inspeccionesEvaluadas
    }))

    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Matriz_Criticidad")
    XLSX.writeFile(wb, `Reporte_R5_Criticidad_ABC_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } finally {
    r5DescargandoExcel.value = false
  }
}

function exportarR5Pdf() {
  if (!store.matrizCriticidad.length) return
  r5DescargandoPdf.value = true
  try {
    exportarTablaPDF({
      titulo: "Matriz de Criticidad de Equipos (R5)",
      subtitulo: "Priorización para plan de mantenimiento preventivo basado en fallas y rechazos",
      nombreArchivo: `R5_Criticidad_ABC_${new Date().toISOString().slice(0, 10)}`,
      columnas: [
        { title: "Clase", key: "clasificacion", width: 22 },
        { title: "Código", key: "codigo", width: 28 },
        { title: "Nombre del Equipo", key: "nombre", width: 55 },
        { title: "Tipo Maquinaria", key: "tipo", width: 35 },
        { title: "Planta", key: "planta", width: 35 },
        { title: "Score (0-100)", key: "score", width: 30 },
        { title: "% Fallas", key: "tasaFallasStr", width: 28 },
        { title: "Prioridad", key: "prioridad", width: 40 }
      ],
      filas: store.matrizCriticidad.map(m => ({
        ...m,
        tasaFallasStr: `${m.tasaFallas}%`
      }))
    })
  } finally {
    r5DescargandoPdf.value = false
  }
}

// ═══════════════════════════════════════════════════════════════
// R6: TARJETA DE RONDA FÍSICA
// ═══════════════════════════════════════════════════════════════
async function cargarR6Tarjeta() {
  if (!r6EquipoId.value) return
  r6Cargando.value = true
  try {
    const res = await api.get(`/dashboard/tarjeta-ronda/${r6EquipoId.value}`)
    if (res.data?.status === "ok") {
      r6DatosEquipo.value = res.data.data
    }
  } finally {
    r6Cargando.value = false
  }
}

function imprimirTarjetaRonda() {
  window.print()
}

// ═══════════════════════════════════════════════════════════════
// R7: REPORTE DE LUBRICACIÓN, FUGAS Y CONSUMOS
// ═══════════════════════════════════════════════════════════════
async function cargarRLub() {
  rlubCargando.value = true
  try {
    const paramsFugas: Record<string, number | string> = {}
    if (rlubPlantaId.value) paramsFugas.plantaId = rlubPlantaId.value

    const paramsConsumo: Record<string, number | string> = {}
    if (rlubPlantaId.value) paramsConsumo.plantaId = rlubPlantaId.value
    if (rlubFechaDesde.value) paramsConsumo.fechaDesde = rlubFechaDesde.value
    if (rlubFechaHasta.value) paramsConsumo.fechaHasta = rlubFechaHasta.value

    const [resF, resC] = await Promise.allSettled([
      api.get("/lubricacion/reportes/fugas", { params: paramsFugas }),
      api.get("/lubricacion/reportes/consumo", { params: paramsConsumo })
    ])

    if (resF.status === "fulfilled" && resF.value.data?.status === "ok") {
      rlubFugas.value = resF.value.data.data || []
    }
    if (resC.status === "fulfilled" && resC.value.data?.status === "ok") {
      rlubConsumo.value = resC.value.data.data || []
    }
  } finally {
    rlubCargando.value = false
  }
}

function exportarRLubExcel() {
  if (rlubSubTab.value === "fugas") {
    if (!rlubFugas.value.length) return
    rlubDescargandoExcel.value = true
    try {
      const filas = rlubFugas.value.map(f => ({
        "Fecha": new Date(f.fechaEjecucion).toLocaleDateString("es-ES"),
        "Rutina": f.codigoRutina,
        "Código Equipo": f.equipoCodigo,
        "Equipo": f.equipoNombre,
        "Planta": f.plantaNombre,
        "Ubicación": f.ubicacionNombre,
        "Parte con Fuga": f.puntoNombre,
        "Lubricante": f.lubricanteNombre,
        "Observaciones": f.observaciones || "Fuga detectada"
      }))
      const ws = XLSX.utils.json_to_sheet(filas)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Fugas_Lubricacion")
      XLSX.writeFile(wb, `Reporte_Fugas_Lubricacion_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } finally {
      rlubDescargandoExcel.value = false
    }
  } else {
    if (!rlubConsumo.value.length) return
    rlubDescargandoExcel.value = true
    try {
      const filas = rlubConsumo.value.map(c => ({
        "Código": c.lubricanteCodigo,
        "Lubricante": c.lubricanteNombre,
        "Tipo": c.tipo,
        "Unidad": c.unidadMedida,
        "Total Repuesto": c.totalRepuesto,
        "Intervenciones": c.intervenciones
      }))
      const ws = XLSX.utils.json_to_sheet(filas)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Consumo_Lubricantes")
      XLSX.writeFile(wb, `Reporte_Consumo_Lubricantes_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } finally {
      rlubDescargandoExcel.value = false
    }
  }
}

onMounted(() => {
  cargarCatalogos()
  cargarR1()
  cargarR2()
  cargarR3()
  cargarR4()
  cargarR5()
  cargarRLub()
})
</script>

<template>
  <div class="panel-reportes-wrapper">
    <!-- Barra de Navegación de Reportes (Totalmente Responsiva) -->
    <v-card class="elevation-1 rounded-xl pa-3 pa-md-4 mb-4 bg-surface border d-print-none">
      <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-3">
        <div>
          <div class="text-subtitle-1 font-weight-bold text-slate-800 d-flex align-center gap-2">
            <v-icon color="primary" size="22">mdi-file-chart-outline</v-icon>
            Centro de Emisión de Reportes Normativos
          </div>
          <div class="text-caption text-medium-emphasis">
            Generación y descarga de informes de flota, criticidad y formatos físicos
          </div>
        </div>

        <v-btn-toggle
          v-model="reporteSeleccionado"
          mandatory
          color="primary"
          density="comfortable"
          variant="outlined"
          divided
          class="flex-wrap rounded-lg"
        >
          <v-btn value="r1" prepend-icon="mdi-format-list-numbered">R1: Flota</v-btn>
          <v-btn value="r2" prepend-icon="mdi-file-table-outline">R2: Inspecciones</v-btn>
          <v-btn value="r3" prepend-icon="mdi-alert-octagon-outline">R3: Equipos Críticos</v-btn>
          <v-btn value="r4" prepend-icon="mdi-chart-box-outline">R4: Ejecutivo</v-btn>
          <v-btn value="r5" prepend-icon="mdi-matrix">R5: Criticidad</v-btn>
          <v-btn value="r6" prepend-icon="mdi-printer-outline">R6: Tarjeta Ronda</v-btn>
          <v-btn value="rlub" prepend-icon="mdi-oil">R7: Lubricación</v-btn>
        </v-btn-toggle>
      </div>
    </v-card>

    <!-- R1: REPORTE DE ESTADO DE FLOTA -->
    <v-card v-if="reporteSeleccionado === 'r1'" class="elevation-1 rounded-xl pa-4 pa-sm-5 bg-surface border">
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
        <div>
          <div class="text-subtitle-1 font-weight-bold text-primary">R1. Reporte de Estado de Flota Completo</div>
          <div class="text-caption text-medium-emphasis">Para comités de mantenimiento semanales. Inventario con última inspección y estado operativo</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-microsoft-excel"
            size="small"
            class="font-weight-bold"
            :loading="r1DescargandoExcel"
            @click="exportarR1Excel"
          >
            Excel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            size="small"
            class="font-weight-bold"
            :loading="r1DescargandoPdf"
            @click="exportarR1Pdf"
          >
            PDF
          </v-btn>
        </div>
      </div>

      <!-- Filtros R1 -->
      <v-row dense class="mb-3">
        <v-col cols="12" sm="4">
          <v-select
            v-model="r1PlantaId"
            :items="[{ id: undefined, nombre: 'Todas las Plantas' }, ...listaPlantas]"
            item-title="nombre"
            item-value="id"
            label="Planta Industrial"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="cargarR1"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="r1TipoEquipoId"
            :items="[{ id: undefined, nombre: 'Todos los Tipos' }, ...listaTiposEquipo]"
            item-title="nombre"
            item-value="id"
            label="Tipo de Maquinaria"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="cargarR1"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="r1Estado"
            :items="[
              { title: 'Todos los estados', value: '' },
              { title: 'Operativo', value: 'OPERATIVO' },
              { title: 'Inoperativo', value: 'INOPERATIVO' },
              { title: 'En Mantenimiento', value: 'EN_MANTENIMIENTO' }
            ]"
            item-title="title"
            item-value="value"
            label="Estado Operativo"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="cargarR1"
          />
        </v-col>
      </v-row>

      <!-- Resumen de Flota -->
      <div v-if="store.reporteFlota" class="d-flex flex-wrap gap-2 mb-3">
        <v-chip size="small" color="primary" variant="tonal">Total: <strong>{{ store.reporteFlota.resumen.total }} equipos</strong></v-chip>
        <v-chip size="small" color="success" variant="tonal">Operativos: <strong>{{ store.reporteFlota.resumen.operativos }}</strong></v-chip>
        <v-chip size="small" color="warning" variant="tonal">En Mantenimiento: <strong>{{ store.reporteFlota.resumen.enMantenimiento }}</strong></v-chip>
        <v-chip size="small" color="error" variant="tonal">Inoperativos: <strong>{{ store.reporteFlota.resumen.inoperativos }}</strong></v-chip>
        <v-chip size="small" color="info" variant="tonal">Disponibilidad: <strong>{{ store.reporteFlota.resumen.porcentajeDisponibilidad }}%</strong></v-chip>
      </div>

      <!-- Tabla R1 -->
      <div class="table-responsive rounded-xl border">
        <v-table density="compact" hover>
          <thead>
            <tr class="bg-slate-50">
              <th class="text-left font-weight-bold">Código</th>
              <th class="text-left font-weight-bold">Nombre del Equipo</th>
              <th class="text-left font-weight-bold">Tipo</th>
              <th class="text-left font-weight-bold">Planta</th>
              <th class="text-left font-weight-bold">Serial</th>
              <th class="text-left font-weight-bold">Estado Actual</th>
              <th class="text-left font-weight-bold">Última Inspección</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.cargandoFlota">
              <td colspan="7" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" size="24" />
              </td>
            </tr>
            <tr v-else-if="!store.reporteFlota?.equipos.length">
              <td colspan="7" class="text-center py-6 text-medium-emphasis">
                No se encontraron equipos con los filtros seleccionados.
              </td>
            </tr>
            <tr v-for="eq in store.reporteFlota?.equipos" :key="eq.id">
              <td class="font-weight-bold font-mono">{{ eq.codigo }}</td>
              <td>{{ eq.nombre }}</td>
              <td>{{ eq.tipoEquipo }}</td>
              <td>{{ eq.planta }}</td>
              <td class="text-caption font-mono">{{ eq.serial }}</td>
              <td>
                <v-chip
                  size="x-small"
                  :color="eq.estadoOperativo === 'OPERATIVO' ? 'success' : eq.estadoOperativo === 'INOPERATIVO' ? 'error' : 'warning'"
                  variant="flat"
                  class="font-weight-bold"
                >
                  {{ eq.estadoOperativo }}
                </v-chip>
              </td>
              <td class="text-caption">
                <span v-if="eq.ultimaInspeccionFecha">
                  {{ new Date(eq.ultimaInspeccionFecha).toLocaleDateString("es-ES") }}
                  <span v-if="eq.ultimaInspeccionEstado">({{ eq.ultimaInspeccionEstado }})</span>
                </span>
                <span v-else class="text-medium-emphasis">Sin rondas</span>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>

    <!-- R2: REPORTE DE INSPECCIONES DEL PERÍODO -->
    <v-card v-if="reporteSeleccionado === 'r2'" class="elevation-1 rounded-xl pa-4 pa-sm-5 bg-surface border">
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
        <div>
          <div class="text-subtitle-1 font-weight-bold text-primary">R2. Reporte de Inspecciones del Período</div>
          <div class="text-caption text-medium-emphasis">Historial acumulado, tasa de aprobación mensual y desglose por equipo</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-microsoft-excel"
            size="small"
            class="font-weight-bold"
            :loading="r2DescargandoExcel"
            @click="exportarR2Excel"
          >
            Excel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            size="small"
            class="font-weight-bold"
            :loading="r2DescargandoPdf"
            @click="exportarR2Pdf"
          >
            PDF
          </v-btn>
        </div>
      </div>

      <v-row dense class="mb-3">
        <v-col cols="12" sm="4">
          <v-select
            v-model="r2Estado"
            :items="[
              { title: 'Todos los estados', value: '' },
              { title: 'Aprobadas', value: 'APROBADO' },
              { title: 'Pendientes', value: 'PENDIENTE' },
              { title: 'Rechazadas', value: 'RECHAZADO' }
            ]"
            item-title="title"
            item-value="value"
            label="Estado"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="cargarR2"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="r2Inicio"
            type="date"
            label="Desde"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            @update:model-value="cargarR2"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="r2Fin"
            type="date"
            label="Hasta"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            @update:model-value="cargarR2"
          />
        </v-col>
      </v-row>

      <div v-if="store.inspeccionesDelPeriodo" class="d-flex flex-wrap gap-2 mb-3">
        <v-chip size="small" color="primary" variant="tonal">Total: {{ store.inspeccionesDelPeriodo.total }}</v-chip>
        <v-chip size="small" color="success" variant="tonal">Aprobadas: {{ store.inspeccionesDelPeriodo.aprobadas }}</v-chip>
        <v-chip size="small" color="error" variant="tonal">Rechazadas: {{ store.inspeccionesDelPeriodo.rechazadas }}</v-chip>
        <v-chip size="small" color="info" variant="tonal">Tasa de Aprobación: {{ store.inspeccionesDelPeriodo.tasaAprobacion }}%</v-chip>
      </div>

      <div class="table-responsive rounded-xl border">
        <v-table density="compact" hover>
          <thead>
            <tr class="bg-slate-50">
              <th class="text-left font-weight-bold">Código</th>
              <th class="text-left font-weight-bold">Fecha</th>
              <th class="text-left font-weight-bold">Planta</th>
              <th class="text-left font-weight-bold">Equipo</th>
              <th class="text-left font-weight-bold">Técnico</th>
              <th class="text-left font-weight-bold">Estado</th>
              <th class="text-left font-weight-bold">Variables</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.cargandoInspecciones">
              <td colspan="7" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" size="24" />
              </td>
            </tr>
            <tr v-else-if="!store.inspeccionesDelPeriodo?.inspecciones.length">
              <td colspan="7" class="text-center py-6 text-medium-emphasis">
                No hay inspecciones registradas para el período.
              </td>
            </tr>
            <tr v-for="i in store.inspeccionesDelPeriodo?.inspecciones" :key="i.id">
              <td class="font-weight-bold font-mono">{{ i.codigoInspeccion }}</td>
              <td class="text-caption">{{ new Date(i.fechaRegistro).toLocaleDateString("es-ES") }}</td>
              <td>{{ i.planta?.nombre || "General" }}</td>
              <td>{{ i.equipo ? `${i.equipo.codigo} - ${i.equipo.nombre}` : "General" }}</td>
              <td>{{ i.elaboradoPor ? `${i.elaboradoPor.nombre} ${i.elaboradoPor.apellido}` : "-" }}</td>
              <td>
                <v-chip
                  size="x-small"
                  :color="i.estadoInspeccion === 'APROBADO' ? 'success' : i.estadoInspeccion === 'RECHAZADO' ? 'error' : 'warning'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ i.estadoInspeccion }}
                </v-chip>
              </td>
              <td>
                <v-chip size="x-small" color="secondary" variant="flat">{{ i._count?.detalles || 0 }} vars</v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>

    <!-- R3: REPORTE DE EQUIPOS CRÍTOCOS -->
    <v-card v-if="reporteSeleccionado === 'r3'" class="elevation-1 rounded-xl pa-4 pa-sm-5 bg-surface border">
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
        <div>
          <div class="text-subtitle-1 font-weight-bold text-error">R3. Reporte de Equipos Críticos</div>
          <div class="text-caption text-medium-emphasis">Registro exclusivo de variables operativas que superaron límites normativos mínimos o máximos</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-microsoft-excel"
            size="small"
            class="font-weight-bold"
            :loading="r3DescargandoExcel"
            @click="exportarR3Excel"
          >
            Excel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            size="small"
            class="font-weight-bold"
            :loading="r3DescargandoPdf"
            @click="exportarR3Pdf"
          >
            PDF
          </v-btn>
        </div>
      </div>

      <v-row dense class="mb-3">
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="r3Inicio"
            type="date"
            label="Desde"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            @update:model-value="cargarR3"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="r3Fin"
            type="date"
            label="Hasta"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            @update:model-value="cargarR3"
          />
        </v-col>
      </v-row>

      <div class="table-responsive rounded-xl border">
        <v-table density="compact" hover>
          <thead>
            <tr class="bg-slate-50">
              <th class="text-left font-weight-bold">Fecha</th>
              <th class="text-left font-weight-bold">Equipo</th>
              <th class="text-left font-weight-bold">Componente</th>
              <th class="text-left font-weight-bold">Variable Crítica</th>
              <th class="text-left font-weight-bold">Valor Medido</th>
              <th class="text-left font-weight-bold">Rango Permitido</th>
              <th class="text-left font-weight-bold">Técnico</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.cargandoNoConformidades">
              <td colspan="7" class="text-center py-6">
                <v-progress-circular indeterminate color="error" size="24" />
              </td>
            </tr>
            <tr v-else-if="store.noConformidades.length === 0">
              <td colspan="7" class="text-center py-6 text-medium-emphasis">
                No hay desviaciones fuera de rango registradas en el período.
              </td>
            </tr>
            <tr v-for="nc in store.noConformidades" :key="nc.inspeccion_id + nc.variable_nombre">
              <td class="text-caption">{{ new Date(nc.fecha_registro).toLocaleDateString("es-ES") }}</td>
              <td class="font-weight-medium">{{ nc.equipo_codigo }}</td>
              <td>{{ nc.componente_nombre }}</td>
              <td class="font-weight-bold text-error">{{ nc.variable_nombre }}</td>
              <td>
                <v-chip size="x-small" color="error" variant="flat">
                  {{ nc.valor_medido }} {{ nc.unidad || "" }}
                </v-chip>
              </td>
              <td class="text-caption font-mono">
                [{{ nc.valor_minimo !== null ? nc.valor_minimo : "-∞" }} — {{ nc.valor_maximo !== null ? nc.valor_maximo : "+∞" }}]
              </td>
              <td class="text-caption">{{ nc.tecnico_nombre }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>

    <!-- R4: REPORTE EJECUTIVO MENSUAL (1 PÁGINA) -->
    <v-card v-if="reporteSeleccionado === 'r4'" class="elevation-1 rounded-xl pa-4 pa-sm-5 bg-surface border">
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
        <div>
          <div class="text-subtitle-1 font-weight-bold text-info">R4. Reporte Ejecutivo Mensual (1 Página)</div>
        </div>
        <div class="d-flex flex-wrap align-center gap-2">
          <v-text-field
            v-model="r4Mes"
            type="month"
            label="Mes / Año"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 170px;"
            @update:model-value="cargarR4"
          />
          <v-btn
            color="error"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            size="small"
            class="font-weight-bold"
            :loading="r4DescargandoPdf"
            @click="exportarR4Pdf"
          >
            Exportar PDF
          </v-btn>
        </div>
      </div>

      <div v-if="store.cargandoEjecutivo" class="text-center py-8">
        <v-progress-circular indeterminate color="info" size="32" />
        <div class="text-caption mt-2">Generando resumen ejecutivo...</div>
      </div>

      <div v-else-if="store.reporteEjecutivo" class="reporte-ejecutivo-panel">
        <!-- 5 KPIs Principales -->
        <v-row dense class="mb-4">
          <v-col cols="12" sm="6" md="4" lg="2-4">
            <v-card variant="tonal" color="primary" class="pa-4 text-center rounded-xl border">
              <div class="text-caption text-medium-emphasis font-weight-medium">Flota Total</div>
              <div class="text-h4 font-weight-bold my-1 text-slate-800">{{ store.reporteEjecutivo.kpis.flotaTotal }}</div>
              <div class="text-caption text-medium-emphasis">{{ store.reporteEjecutivo.kpis.operativos }} Operativos</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="4" lg="2-4">
            <v-card variant="tonal" color="success" class="pa-4 text-center rounded-xl border">
              <div class="text-caption text-medium-emphasis font-weight-medium">Disponibilidad</div>
              <div class="text-h4 font-weight-bold my-1 text-success">{{ store.reporteEjecutivo.kpis.disponibilidad }}%</div>
              <div class="text-caption font-weight-bold text-success">{{ store.reporteEjecutivo.kpis.tendencia }} vs mes ant.</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="4" lg="2-4">
            <v-card variant="tonal" color="info" class="pa-4 text-center rounded-xl border">
              <div class="text-caption text-medium-emphasis font-weight-medium">Inspecciones</div>
              <div class="text-h4 font-weight-bold my-1 text-info">{{ store.reporteEjecutivo.kpis.inspeccionesRealizadas }}</div>
              <div class="text-caption text-medium-emphasis">{{ store.reporteEjecutivo.kpis.tasaAprobacion }}% Aprobadas</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="6" lg="2-4">
            <v-card variant="tonal" color="error" class="pa-4 text-center rounded-xl border">
              <div class="text-caption text-medium-emphasis font-weight-medium">No-Conformidades</div>
              <div class="text-h4 font-weight-bold my-1 text-error">{{ store.reporteEjecutivo.kpis.totalNoConformidades }}</div>
              <div class="text-caption text-medium-emphasis">Variables críticas</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="12" md="6" lg="2-4">
            <v-card variant="tonal" color="warning" class="pa-4 text-center rounded-xl border">
              <div class="text-caption text-medium-emphasis font-weight-medium">Inoperatividad Est.</div>
              <div class="text-h4 font-weight-bold my-1 text-warning">{{ store.reporteEjecutivo.kpis.horasInoperatividad }} hrs</div>
              <div class="text-caption text-medium-emphasis">Acumuladas en el mes</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Top 3 Equipos con Desvíos + Tabla Desglose por Planta -->
        <v-row dense>
          <v-col cols="12" md="5">
            <v-card variant="outlined" class="pa-4 rounded-xl h-100 bg-white border">
              <div class="text-subtitle-2 font-weight-bold text-error mb-2 d-flex align-center gap-1">
                <v-icon size="18" color="error">mdi-alert-circle-outline</v-icon>
                Top 3 Equipos con Mayor Incidencia
              </div>
              <v-list density="compact" class="bg-transparent">
                <v-list-item
                  v-for="(eq, idx) in store.reporteEjecutivo.kpis.top3EquiposCriticos"
                  :key="eq.codigo"
                  class="px-0 py-1"
                >
                  <template #prepend>
                    <v-avatar color="error" size="24" class="text-caption font-weight-bold text-white mr-2">
                      {{ idx + 1 }}
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-bold text-body-2">{{ eq.codigo }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">{{ eq.nombre }} — {{ eq.fallas }} desvíos</v-list-item-subtitle>
                </v-list-item>
                <div v-if="!store.reporteEjecutivo.kpis.top3EquiposCriticos.length" class="text-caption text-medium-emphasis py-4 text-center">
                  No se registraron fallas en el mes seleccionado.
                </div>
              </v-list>
            </v-card>
          </v-col>

          <v-col cols="12" md="7">
            <v-card variant="outlined" class="pa-4 rounded-xl h-100 bg-white border">
              <div class="text-subtitle-2 font-weight-bold text-slate-800 mb-2 d-flex align-center gap-1">
                <v-icon size="18" color="info">mdi-factory</v-icon>
                Distribución de Flota por Planta
              </div>
              <div class="table-responsive">
                <v-table density="compact">
                  <thead>
                    <tr class="bg-slate-50">
                      <th class="text-left font-weight-bold">Planta</th>
                      <th class="text-center font-weight-bold text-success">Operativos</th>
                      <th class="text-center font-weight-bold text-warning">En Mant.</th>
                      <th class="text-center font-weight-bold text-error">Inoperativos</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="pl in store.reporteEjecutivo.plantas" :key="pl.nombre">
                      <td class="font-weight-medium">{{ pl.nombre }}</td>
                      <td class="text-center font-weight-bold text-success">{{ pl.OPERATIVO }}</td>
                      <td class="text-center font-weight-bold text-warning">{{ pl.EN_MANTENIMIENTO }}</td>
                      <td class="text-center font-weight-bold text-error">{{ pl.INOPERATIVO }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-card>

    <!-- R5: MATRIZ DE CRITICIDAD POR EQUIPO (ABC) -->
    <v-card v-if="reporteSeleccionado === 'r5'" class="elevation-1 rounded-xl pa-4 pa-sm-5 bg-surface border">
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
        <div>
          <div class="text-subtitle-1 font-weight-bold text-slate-800">R5. Matriz de Criticidad por Equipo (Clasificación ABC)</div>
          <div class="text-caption text-medium-emphasis">Priorización para plan de mantenimiento preventivo según fallas en variables, rechazos y estado</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-microsoft-excel"
            size="small"
            class="font-weight-bold"
            :loading="r5DescargandoExcel"
            @click="exportarR5Excel"
          >
            Excel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            size="small"
            class="font-weight-bold"
            :loading="r5DescargandoPdf"
            @click="exportarR5Pdf"
          >
            PDF
          </v-btn>
        </div>
      </div>

      <!-- Tabla R5 -->
      <div class="table-responsive rounded-xl border">
        <v-table density="comfortable" hover>
          <thead>
            <tr class="bg-slate-50">
              <th class="text-center font-weight-bold" style="width: 70px;">Clase</th>
              <th class="text-left font-weight-bold">Código</th>
              <th class="text-left font-weight-bold">Nombre del Equipo</th>
              <th class="text-left font-weight-bold">Tipo</th>
              <th class="text-left font-weight-bold">Planta</th>
              <th class="text-left font-weight-bold" style="min-width: 130px;">Puntaje de Criticidad</th>
              <th class="text-center font-weight-bold">% Fallas</th>
              <th class="text-center font-weight-bold">Prioridad</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.cargandoCriticidad">
              <td colspan="8" class="text-center py-6">
                <v-progress-circular indeterminate color="warning" size="24" />
              </td>
            </tr>
            <tr v-else-if="!store.matrizCriticidad.length">
              <td colspan="8" class="text-center py-6 text-medium-emphasis">
                No hay datos calculados para la matriz de criticidad.
              </td>
            </tr>
            <tr v-for="m in store.matrizCriticidad" :key="m.id">
              <td class="text-center">
                <v-avatar :color="m.color" size="28" class="text-white font-weight-bold text-caption elevation-1">
                  {{ m.clasificacion }}
                </v-avatar>
              </td>
              <td class="font-weight-bold font-mono">{{ m.codigo }}</td>
              <td>{{ m.nombre }}</td>
              <td>{{ m.tipo }}</td>
              <td>{{ m.planta }}</td>
              <td>
                <div class="d-flex align-center gap-2">
                  <span class="text-caption font-weight-bold font-mono text-slate-700" style="min-width: 30px;">
                    {{ m.score }}
                  </span>
                  <v-progress-linear
                    :model-value="m.score"
                    :color="m.color"
                    height="8"
                    rounded
                    class="flex-grow-1"
                  />
                </div>
              </td>
              <td class="text-center font-weight-bold">{{ m.tasaFallas }}%</td>
              <td class="text-center">
                <v-chip size="x-small" :color="m.color" variant="tonal" class="font-weight-bold">
                  {{ m.prioridad }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>

    <!-- R6: TARJETA DE RONDA IMPRIMIBLE -->
    <v-card v-if="reporteSeleccionado === 'r6'" class="elevation-1 rounded-xl pa-4 pa-sm-5 bg-surface border">
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4 d-print-none">
        <div>
          <div class="text-subtitle-1 font-weight-bold text-info">R6. Tarjeta de Inspección por Equipo (Ronda Física)</div>
          <div class="text-caption text-medium-emphasis">Formato impreso F-MANT-04 para toma de lecturas en campo y evidencia física</div>
        </div>
        <div class="d-flex flex-wrap gap-2 align-center">
          <v-select
            v-model="r6EquipoId"
            :items="equiposDisponibles"
            item-title="nombre"
            item-value="id"
            label="Seleccionar Equipo"
            variant="outlined"
            density="compact"
            hide-details
            style="min-width: 240px;"
            @update:model-value="cargarR6Tarjeta"
          />
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-printer"
            size="small"
            class="font-weight-bold"
            :disabled="!r6DatosEquipo"
            @click="imprimirTarjetaRonda"
          >
            Imprimir Formato
          </v-btn>
        </div>
      </div>

      <div v-if="r6Cargando" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
        <div class="text-caption mt-2">Generando tarjeta de inspección...</div>
      </div>

      <div v-else-if="!r6DatosEquipo" class="text-center py-10 text-medium-emphasis">
        Selecciona un equipo arriba para previsualizar su tarjeta de ronda física.
      </div>

      <!-- Tarjeta física imprimible -->
      <div v-else class="tarjeta-ronda-imprimible pa-4 border rounded bg-white text-black">
        <div class="d-flex justify-space-between align-center border-b pb-2 mb-3">
          <div>
            <h2 class="text-h6 font-weight-bold mb-0">TUBRICA — TARJETA DE RONDA TÉCNICA</h2>
            <div class="text-caption font-mono">Formato F-MANT-04 | Sistema Sinergy</div>
          </div>
          <div class="text-right text-caption">
            <div><strong>Fecha:</strong> ____________________</div>
            <div><strong>Turno:</strong> [ ] Día  [ ] Noche</div>
          </div>
        </div>

        <div class="datos-cabecera-grid mb-3 text-caption pa-2 rounded bg-grey-lighten-4">
          <div><strong>Equipo:</strong> {{ r6DatosEquipo.codigo }} — {{ r6DatosEquipo.nombre }}</div>
          <div><strong>Tipo:</strong> {{ r6DatosEquipo.tipoEquipo?.nombre }}</div>
          <div><strong>Ubicación:</strong> {{ r6DatosEquipo.ubicacionTecnica?.codigo }} ({{ r6DatosEquipo.ubicacionTecnica?.nombre }})</div>
          <div><strong>Serial:</strong> {{ r6DatosEquipo.serial || "N/A" }}</div>
        </div>

        <div v-for="c in r6DatosEquipo.componentes" :key="c.id" class="mb-4">
          <div class="font-weight-bold text-subtitle-2 bg-grey-lighten-3 pa-1 px-2 border-b">
            Componente: {{ c.nombre }}
          </div>
          <table class="tabla-impresion w-100 text-caption mt-1">
            <thead>
              <tr class="border-b">
                <th style="width: 40%; text-align: left;">Variable Crítica</th>
                <th style="width: 20%; text-align: center;">Rango Normativo</th>
                <th style="width: 20%; text-align: center;">Lectura Campo</th>
                <th style="width: 20%; text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in c.variables" :key="v.id" class="border-b">
                <td class="py-2">{{ v.nombre }}</td>
                <td class="text-center font-mono">
                  <span v-if="v.valorMinimo !== null && v.valorMaximo !== null">
                    {{ v.valorMinimo }} - {{ v.valorMaximo }} {{ v.unidad || "" }}
                  </span>
                  <span v-else-if="v.valorMinimo !== null">≥ {{ v.valorMinimo }} {{ v.unidad || "" }}</span>
                  <span v-else-if="v.valorMaximo !== null">≤ {{ v.valorMaximo }} {{ v.unidad || "" }}</span>
                  <span v-else>Cualitativo</span>
                </td>
                <td class="text-center">[ ____________ ]</td>
                <td class="text-center">[ ] OK &nbsp; [ ] FUERA</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pt-4 border-t d-flex justify-space-between text-caption firmas-seccion">
          <div class="text-center" style="width: 40%;">
            <div class="border-b mb-1 pb-4"></div>
            <div>Firma y Nombre del Técnico</div>
          </div>
          <div class="text-center" style="width: 40%;">
            <div class="border-b mb-1 pb-4"></div>
            <div>Firma y Nombre del Supervisor</div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- R7: REPORTE DE LUBRICACIÓN, FUGAS Y CONSUMO -->
    <v-card v-if="reporteSeleccionado === 'rlub'" class="elevation-1 rounded-xl pa-4 pa-sm-5 bg-surface border">
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2 mb-4">
        <div>
          <div class="text-subtitle-1 font-weight-bold text-primary">R7. Reporte de Lubricación, Consumo y Fugas</div>
          <div class="text-caption text-medium-emphasis">Control analítico de fugas activas no resueltas y volumen de lubricantes consumidos</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-microsoft-excel"
            :loading="rlubDescargandoExcel"
            @click="exportarRLubExcel"
          >
            Exportar Excel
          </v-btn>
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-refresh"
            :loading="rlubCargando"
            @click="cargarRLub"
          >
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- Filtros de Lubricación -->
      <v-row dense class="mb-4">
        <v-col cols="12" sm="4">
          <v-select
            v-model="rlubPlantaId"
            :items="listaPlantas"
            item-title="nombre"
            item-value="id"
            label="Planta Industrial"
            placeholder="Todas las plantas"
            clearable
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="cargarRLub"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="rlubFechaDesde"
            type="date"
            label="Fecha Desde"
            density="compact"
            variant="outlined"
            hide-details
            @change="cargarRLub"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="rlubFechaHasta"
            type="date"
            label="Fecha Hasta"
            density="compact"
            variant="outlined"
            hide-details
            @change="cargarRLub"
          />
        </v-col>
      </v-row>

      <!-- Sub-pestañas Fugas vs Consumo -->
      <v-tabs v-model="rlubSubTab" color="primary" density="compact" class="mb-3">
        <v-tab value="fugas">
          <v-icon start size="18">mdi-water-alert</v-icon>
          Fugas Detectadas ({{ rlubFugas.length }})
        </v-tab>
        <v-tab value="consumo">
          <v-icon start size="18">mdi-gas-station</v-icon>
          Consumo de Lubricantes ({{ rlubConsumo.length }})
        </v-tab>
      </v-tabs>

      <!-- Tabla de Fugas -->
      <div v-if="rlubSubTab === 'fugas'" class="table-responsive">
        <div v-if="rlubFugas.length === 0" class="text-center py-6 text-muted">
          <v-icon size="40" color="success" class="mb-1">mdi-check-circle-outline</v-icon>
          <div class="text-subtitle-2 font-weight-bold">No se registran fugas activas de lubricante</div>
        </div>
        <table v-else class="table table-sm table-hover border">
          <thead class="bg-light">
            <tr>
              <th>Fecha</th>
              <th>Rutina</th>
              <th>Equipo</th>
              <th>Planta / Ubicación</th>
              <th>Parte con Fuga</th>
              <th>Lubricante</th>
              <th>Diagnóstico / Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in rlubFugas" :key="`${f.rutinaId}-${f.puntoId}`">
              <td class="text-caption font-weight-medium">{{ new Date(f.fechaEjecucion).toLocaleDateString() }}</td>
              <td><span class="badge bg-secondary text-white">{{ f.codigoRutina }}</span></td>
              <td><strong>{{ f.equipoCodigo }}</strong> - {{ f.equipoNombre }}</td>
              <td class="text-caption">{{ f.plantaNombre }} &bull; {{ f.ubicacionNombre }}</td>
              <td>
                <span class="badge bg-danger text-white">{{ f.puntoNombre }}</span>
              </td>
              <td>{{ f.lubricanteNombre }}</td>
              <td class="text-caption text-danger">{{ f.observaciones || 'Fuga detectada en rutina' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabla de Consumo -->
      <div v-if="rlubSubTab === 'consumo'" class="table-responsive">
        <div v-if="rlubConsumo.length === 0" class="text-center py-6 text-muted">
          <v-icon size="40" color="grey" class="mb-1">mdi-oil-level</v-icon>
          <div class="text-subtitle-2">Sin reposiciones de lubricante en el período</div>
        </div>
        <table v-else class="table table-sm table-hover border">
          <thead class="bg-light">
            <tr>
              <th>Código</th>
              <th>Lubricante</th>
              <th>Tipo</th>
              <th>Unidad</th>
              <th class="text-end">Total Repuesto</th>
              <th class="text-end">Intervenciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in rlubConsumo" :key="c.lubricanteId">
              <td class="font-weight-bold">{{ c.lubricanteCodigo }}</td>
              <td>{{ c.lubricanteNombre }}</td>
              <td><span class="badge bg-light text-dark border">{{ c.tipo }}</span></td>
              <td>{{ c.unidadMedida }}</td>
              <td class="text-end font-weight-bold text-primary">
                {{ c.totalRepuesto.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) }}
              </td>
              <td class="text-end">{{ c.intervenciones }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tabla-impresion {
  border-collapse: collapse;
}
.tabla-impresion th, .tabla-impresion td {
  padding: 6px 8px;
}
.datos-cabecera-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

@media (max-width: 600px) {
  .datos-cabecera-grid {
    grid-template-columns: 1fr;
  }
}

@media print {
  body * {
    visibility: hidden;
  }
  .tarjeta-ronda-imprimible, .tarjeta-ronda-imprimible * {
    visibility: visible;
  }
  .tarjeta-ronda-imprimible {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none !important;
  }
  .d-print-none {
    display: none !important;
  }
}
</style>
