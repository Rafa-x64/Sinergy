<script setup lang="ts">
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { InspeccionMaestra } from '../inspecciones.store'

const mostrarModal = ref(false)
const inspeccion = ref<InspeccionMaestra | null>(null)
const generandoPdf = ref(false)

const abrir = (item: InspeccionMaestra) => {
  inspeccion.value = item
  mostrarModal.value = true
}

const cerrar = () => {
  mostrarModal.value = false
}

// Título dinámico según el tipo de inspección / rutina
const tituloRutina = computed(() => {
  switch (inspeccion.value?.tipoInspeccion) {
    case 'LUBRICACION':
      return 'RUTINA DE LUBRICACIÓN'
    case 'CHILLER':
      return 'RUTINA DE INSPECCIÓN CHILLERS'
    case 'CHILLER_DIARIO':
      return 'RUTINA DE INSPECCIÓN CHILLERS — DIARIA'
    case 'CHILLER_SEMANAL':
      return 'RUTINA DE INSPECCIÓN CHILLERS — SEMANAL'
    case 'COMPRESOR':
      return 'RUTINA DE INSPECCIÓN COMPRESORES'
    case 'GENERADOR':
      return 'RUTINA DE INSPECCIÓN GENERADORES'
    case 'MONTACARGAS':
      return 'RUTINA DE INSPECCIÓN MONTACARGAS'
    case 'MONTACARGAS_DIARIO':
      return 'RUTINA DE INSPECCIÓN MONTACARGAS — DIARIA'
    case 'MONTACARGAS_SEMANAL':
      return 'RUTINA DE INSPECCIÓN MONTACARGAS — SEMANAL'
    case 'VARIABLES_CRITICAS':
    default:
      return 'INSPECCIÓN DE VARIABLES CRÍTICAS'
  }
})

const codigoFormato = computed(() => {
  if (inspeccion.value?.tipoInspeccion === 'LUBRICACION') return 'FLUB001'
  if (inspeccion.value?.tipoInspeccion?.startsWith('CHILLER') ||
      inspeccion.value?.tipoInspeccion === 'COMPRESOR' ||
      inspeccion.value?.tipoInspeccion === 'GENERADOR' ||
      inspeccion.value?.tipoInspeccion?.startsWith('MONTACARGAS')) {
    return 'FIM003'
  }
  return 'FIM006'
})

// Metadatos calculados de tiempo
const fechaStr = computed(() => {
  if (!inspeccion.value?.fechaRegistro) return '—'
  const d = new Date(inspeccion.value.fechaRegistro)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
})

const horaStr = computed(() => {
  if (!inspeccion.value?.fechaRegistro) return '—'
  const d = new Date(inspeccion.value.fechaRegistro)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
})

const diaStr = computed(() => {
  if (!inspeccion.value?.fechaRegistro) return '—'
  const d = new Date(inspeccion.value.fechaRegistro)
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return dias[d.getDay()] || '—'
})

const semanaISO = computed(() => {
  if (!inspeccion.value?.fechaRegistro) return '—'
  const d = new Date(inspeccion.value.fechaRegistro)
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNr = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNr)
  const jan1 = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil((((target.getTime() - jan1.getTime()) / 86400000) + 1) / 7)
})

// Ubicación Técnica de la máquina (priorizando siempre el equipo evaluado)
const ubicacionTecnicaEquipo = computed(() => {
  if (inspeccion.value?.equipo?.ubicacionTecnica?.codigo) {
    return inspeccion.value.equipo.ubicacionTecnica
  }
  const eqVar = inspeccion.value?.detalles?.[0]?.variable?.componente?.equipo
  if (eqVar?.ubicacionTecnica?.codigo) {
    return eqVar.ubicacionTecnica
  }
  if (inspeccion.value?.ubicacionTecnica?.codigo) {
    return inspeccion.value.ubicacionTecnica
  }
  return null
})

// Datos del equipo evaluado (de la cabecera o derivado de los componentes de las variables)
const equipoEvaluado = computed(() => {
  if (inspeccion.value?.equipo) {
    return inspeccion.value.equipo
  }
  return inspeccion.value?.detalles?.[0]?.variable?.componente?.equipo || null
})

// Código abreviado del equipo (ej. COM_10003, GEN_20002 o identificacionAbreviada)
const codigoAbreviadoEquipo = computed(() => {
  const eq = equipoEvaluado.value
  if (!eq) return '—'
  if ((eq as any).montacargasDetalle?.identificacionAbreviada) {
    return (eq as any).montacargasDetalle.identificacionAbreviada
  }
  const match = eq.codigo.match(/^[0-9]+([A-Z]+)([0-9]+)$/)
  if (match) {
    return `${match[1]}_${match[2]}`
  }
  return eq.codigo
})

// Nombre de supervisor aprobador: SOLO cuando la inspección ha sido formalmente APROBADA
const nombreAprobador = computed(() => {
  if (inspeccion.value?.estadoInspeccion === 'APROBADO' && inspeccion.value?.aprobadoPor?.nombre) {
    return `${inspeccion.value.aprobadoPor.nombre} ${inspeccion.value.aprobadoPor.apellido || ''}`.trim()
  }
  return '____________________________________'
})

// Formateo de rangos de trabajo
const formatearRango = (v?: any) => {
  if (!v) return '—'
  const min = v.valorMinimo
  const max = v.valorMaximo
  const unidad = v.unidad ? ` ${v.unidad}` : ''
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    return `${min} - ${max}${unidad}`
  }
  if (min !== null && min !== undefined) {
    return `≥ ${min}${unidad}`
  }
  if (max !== null && max !== undefined) {
    return `≤ ${max}${unidad}`
  }
  return '—'
}

// Observaciones generales limpias (omite el resumen tecnico concatenado autogenerado)
const observacionesGeneralesLimpias = computed(() => {
  const texto = inspeccion.value?.observacionesGenerales
  if (!texto || !texto.trim()) {
    return 'Sin observaciones registradas durante la ronda.'
  }
  if (texto.includes('[RUTINA DE LUBRICACIÓN Y HORÓMETROS') || texto.includes('Resumen de Puntos Evaluados')) {
    const match = texto.match(/Observaciones del Técnico:\s*([\s\S]*?)(?=\nResumen de Puntos Evaluados|$)/)
    if (match && match[1]?.trim()) {
      return match[1].trim()
    }
    return 'Sin observaciones registradas durante la ronda.'
  }
  return texto
})

// Estilos de evaluación cualitativa
const esEstadoPositivo = (valor?: string | null) => {
  if (!valor) return false
  const v = valor.trim().toLowerCase()
  return v === 'normal' || v === 'conforme' || v === 'operativo' || v === 'si' || v === 'sí' || v === 'ok' || v === 'completado'
}

const esEstadoNegativo = (valor?: string | null) => {
  if (!valor) return false
  const v = valor.trim().toLowerCase()
  return v === 'anormal' || v === 'no conforme' || v === 'falla' || v === 'inoperativo' || v === 'no' || v === 'crítico' || v === 'critico' || v === 'no_completado' || v === 'no completado'
}

// Acciones de exportación e impresión
const imprimir = () => {
  window.print()
}

const descargarPDF = async () => {
  const elemento = document.getElementById('documento-impresion-iso')
  if (!elemento) return
  generandoPdf.value = true
  try {
    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 210
    const pageHeight = 295 // Alto imprimible por página A4 con margen seguro
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    // Primera página
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Páginas siguientes para inspecciones largas
    while (heightLeft > 0) {
      position -= pageHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    const codigo = inspeccion.value?.codigoInspeccion || 'inspeccion'
    pdf.save(`${codigoFormato.value}_${codigo}.pdf`)
  } catch (error) {
    console.error('Error generando documento PDF:', error)
  } finally {
    generandoPdf.value = false
  }
}

defineExpose({ abrir, cerrar })
</script>

<template>
  <v-dialog v-model="mostrarModal" max-width="920px" scrollable>
    <v-card v-if="inspeccion" class="rounded-lg bg-surface">
      <!-- Barra superior no imprimible con contraste garantizado -->
      <v-card-title class="py-3 px-4 d-flex align-center justify-space-between text-white d-print-none" style="background-color: #0f172a !important; color: #ffffff !important;">
        <div class="d-flex align-center">
          <v-icon start size="22" color="#5cb85c">mdi-printer</v-icon>
          <span class="font-weight-bold">Vista de Impresión: {{ inspeccion.codigoInspeccion }}</span>
        </div>
        <div class="d-flex align-center gap-2">
          <v-btn
            size="small"
            color="#5cb85c"
            variant="flat"
            prepend-icon="mdi-printer"
            class="font-weight-bold"
            @click="imprimir"
          >
            Imprimir
          </v-btn>
          <v-btn
            size="small"
            color="info"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            class="font-weight-bold"
            :loading="generandoPdf"
            @click="descargarPDF"
          >
            Descargar PDF
          </v-btn>
          <v-btn icon variant="text" size="small" color="white" @click="cerrar">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text class="pa-4 bg-grey-lighten-4 custom-scrollbar">
        <!-- DOCUMENTO IMPRIMIBLE OFICIAL UNIFICADO -->
        <div id="documento-impresion-iso" class="formato-iso-contenedor pa-5 bg-white text-black mx-auto">

          <!-- Encabezado con Logo y Título -->
          <div class="iso-header-grid mb-2">
            <div class="iso-logo-cell">
              <img src="/LOGO_TUBRICA_AZUL.png" alt="TUBRICA" class="iso-logo-img" />
            </div>
            <div class="iso-title-cell text-center font-weight-bold">
              {{ tituloRutina }}
            </div>
          </div>

          <!-- Fila de Metadatos de Tiempo: SEMANA, FECHA, DIA, HORA -->
          <table class="iso-table-grid mb-2 text-caption">
            <tbody>
              <tr>
                <td class="iso-cell-header text-center" style="width: 12%;">SEMANA</td>
                <td class="iso-cell-data text-center font-weight-bold font-mono text-danger" style="width: 13%;">
                  {{ semanaISO }}
                </td>
                <td class="iso-cell-header text-center" style="width: 12%;">FECHA</td>
                <td class="iso-cell-data text-center font-weight-medium font-mono text-danger" style="width: 23%;">
                  {{ fechaStr }}
                </td>
                <td class="iso-cell-header text-center" style="width: 10%;">DIA</td>
                <td class="iso-cell-data text-center font-weight-medium text-danger" style="width: 15%;">
                  {{ diaStr }}
                </td>
                <td class="iso-cell-header text-center" style="width: 8%;">HORA</td>
                <td class="iso-cell-data text-center font-weight-medium font-mono text-danger" style="width: 7%;">
                  {{ horaStr }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Ubicación Técnica y Nombre del Equipo -->
          <table class="iso-table-grid mb-2 text-caption">
            <thead>
              <tr>
                <th class="iso-cell-header text-center font-weight-bold" style="width: 50%;">
                  UBICACIÓN TÉCNICA
                </th>
                <th class="iso-cell-header text-center font-weight-bold" style="width: 50%;">
                  DATOS DEL EQUIPO
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="pa-2 align-top">
                  <div class="d-flex mb-1">
                    <span class="font-weight-medium mr-2" style="width: 60px;">Código:</span>
                    <span class="font-mono">{{ ubicacionTecnicaEquipo?.codigo || '—' }}</span>
                  </div>
                  <div class="d-flex">
                    <span class="font-weight-medium mr-2" style="width: 60px;">Nombre:</span>
                    <span class="font-weight-bold">{{ ubicacionTecnicaEquipo?.nombre || '—' }}</span>
                  </div>
                </td>
                <td class="pa-2 align-top">
                  <div class="d-flex mb-1" v-if="codigoAbreviadoEquipo !== '—' && codigoAbreviadoEquipo !== equipoEvaluado?.codigo">
                    <span class="font-weight-medium mr-2" style="width: 110px;">Código Abreviado:</span>
                    <span class="font-weight-bold font-mono text-danger">
                      {{ codigoAbreviadoEquipo }}
                    </span>
                  </div>
                  <div class="d-flex mb-1">
                    <span class="font-weight-medium mr-2" style="width: 110px;">Código:</span>
                    <span class="font-mono font-weight-bold">{{ equipoEvaluado?.codigo || '—' }}</span>
                  </div>
                  <div class="d-flex">
                    <span class="font-weight-medium mr-2" style="width: 110px;">Nombre:</span>
                    <span class="font-weight-bold">{{ equipoEvaluado?.nombre || '—' }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Tabla Principal de Inspección (Componente, Variable / Punto, Valor Medido / Estado, Rango de Trabajo) -->
          <table class="iso-table-grid mb-2 text-caption">
            <thead>
              <tr>
                <th colspan="4" class="iso-cell-header text-center font-weight-bold py-1">
                  {{ inspeccion.tipoInspeccion === 'LUBRICACION' ? 'PUNTOS Y VARIABLES DE LUBRICACIÓN' : 'DATOS PARA LA INSPECCIÓN' }}
                </th>
              </tr>
              <tr>
                <th class="iso-cell-header text-center font-weight-bold" style="width: 25%;">Componente</th>
                <th class="iso-cell-header text-center font-weight-bold" style="width: 35%;">
                  {{ inspeccion.tipoInspeccion === 'LUBRICACION' ? 'Punto de Lubricación' : 'Variable / Item' }}
                </th>
                <th class="iso-cell-header text-center font-weight-bold" style="width: 20%;">
                  {{ inspeccion.tipoInspeccion === 'LUBRICACION' ? 'Estado / Cantidad' : 'Valor Medido / Estado' }}
                </th>
                <th class="iso-cell-header text-center font-weight-bold" style="width: 20%;">
                  {{ inspeccion.tipoInspeccion === 'LUBRICACION' ? 'Dosis Estimada' : 'Rango de Trabajo' }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="d in inspeccion.detalles"
                :key="d.id"
                :class="{ 'iso-badge-anormal': d.fueraDeRango }"
              >
                <!-- Componente -->
                <td class="pa-1 px-2 font-weight-medium">
                  {{ d.variable?.componente?.nombre || 'General' }}
                </td>

                <!-- Variable / Punto de Lubricación -->
                <td class="pa-1 px-2 font-weight-medium">
                  {{ d.variable?.nombre || '—' }}
                </td>

                <!-- Valor Medido / Estado -->
                <td class="pa-1 text-center font-weight-bold font-mono">
                  <template v-if="d.valorNumerico !== null && d.valorNumerico !== undefined && d.valorSeleccion">
                    <span :class="{ 'iso-badge-normal': esEstadoPositivo(d.valorSeleccion), 'iso-badge-anormal': esEstadoNegativo(d.valorSeleccion) }" class="px-1 rounded">
                      {{ d.valorSeleccion }}
                    </span>
                    <span class="ml-1">({{ d.valorNumerico }} {{ d.variable?.unidad || '' }})</span>
                  </template>
                  <template v-else-if="d.valorNumerico !== null && d.valorNumerico !== undefined">
                    {{ d.valorNumerico }} {{ d.variable?.unidad || '' }}
                  </template>
                  <template v-else-if="d.valorSeleccion">
                    <span :class="{ 'iso-badge-normal': esEstadoPositivo(d.valorSeleccion), 'iso-badge-anormal': esEstadoNegativo(d.valorSeleccion) }" class="px-1 rounded">
                      {{ d.valorSeleccion }}
                    </span>
                  </template>
                  <template v-else>
                    —
                  </template>
                </td>

                <!-- Rango de Trabajo / Dosis Estimada -->
                <td class="pa-1 text-center font-mono">
                  {{ formatearRango(d.variable) }}
                </td>
              </tr>
              <tr v-if="!inspeccion.detalles || inspeccion.detalles.length === 0">
                <td colspan="4" class="pa-3 text-center text-medium-emphasis">
                  No se registraron detalles específicos en esta inspección.
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Sección: Observaciones Generales -->
          <div class="iso-box-container mb-2">
            <div class="iso-cell-header text-center font-weight-bold pa-1 text-caption">
              OBSERVACIONES GENERALES
            </div>
            <div class="pa-2 text-caption font-weight-medium min-h-40">
              {{ observacionesGeneralesLimpias }}
            </div>
          </div>

          <!-- Sección de Firmas de Responsabilidad -->
          <table class="iso-table-grid mb-1 text-caption">
            <tbody>
              <tr>
                <td class="pa-2 font-weight-bold text-uppercase" style="width: 35%;">
                  ELABORADO POR:
                </td>
                <td class="pa-2 font-weight-bold font-mono text-danger text-uppercase" style="width: 65%;">
                  {{ inspeccion.elaboradoPor?.nombre }} {{ inspeccion.elaboradoPor?.apellido }}
                </td>
              </tr>
              <tr>
                <td class="pa-2 font-weight-bold text-uppercase" style="width: 35%;">
                  REVISADO Y APROBADO POR:
                </td>
                <td class="pa-2 font-weight-bold font-mono text-danger text-uppercase" style="width: 65%;">
                  {{ nombreAprobador }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Código Oficial de Formato -->
          <div class="text-caption font-weight-bold text-slate-800">
            {{ codigoFormato }}
          </div>

        </div>
      </v-card-text>

      <v-card-actions class="pa-3 justify-end bg-surface border-t d-print-none">
        <v-btn variant="text" size="small" @click="cerrar">
          Cerrar
        </v-btn>
        <v-btn
          color="info"
          variant="flat"
          size="small"
          prepend-icon="mdi-file-pdf-box"
          :loading="generandoPdf"
          @click="descargarPDF"
        >
          Descargar PDF
        </v-btn>
        <v-btn
          color="#5cb85c"
          variant="flat"
          size="small"
          prepend-icon="mdi-printer"
          @click="imprimir"
        >
          Imprimir
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.formato-iso-contenedor {
  width: 100%;
  max-width: 800px;
  background: #ffffff;
  color: #000000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  border: 2px solid #000000;
  box-sizing: border-box;
}

.iso-header-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #000000;
  padding-bottom: 6px;
}

.iso-logo-img {
  height: 38px;
  max-width: 160px;
  object-fit: contain;
}

.iso-title-cell {
  font-size: 1.125rem;
  letter-spacing: 0.5px;
  color: #000000;
  flex: 1;
}

.iso-table-grid {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #000000;
}

.iso-table-grid th,
.iso-table-grid td {
  border: 1px solid #000000;
}

.iso-cell-header {
  background-color: #e2e8f0;
  color: #000000;
  font-weight: 700;
}

.iso-box-container {
  border: 1px solid #000000;
}

.iso-badge-normal {
  background-color: #c8e6c9 !important;
  color: #1b5e20 !important;
}

.iso-badge-anormal {
  background-color: #ff5252 !important;
  color: #ffffff !important;
}

.min-h-40 {
  min-height: 40px;
}

.min-h-30 {
  min-height: 30px;
}

/* Reglas Estrictas de Impresión del Navegador */
@media print {
  html, body {
    overflow: visible !important;
    height: auto !important;
    background: #ffffff !important;
  }

  /* Desactivar scroll containers y fijaciones de modales de Vuetify */
  .v-overlay,
  .v-overlay__content,
  .v-card,
  .v-card-text {
    position: static !important;
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    width: 100% !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  body * {
    visibility: hidden !important;
  }

  #documento-impresion-iso,
  #documento-impresion-iso * {
    visibility: visible !important;
  }

  #documento-impresion-iso {
    position: static !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 6mm !important;
    border: none !important;
    background: #ffffff !important;
    color: #000000 !important;
    page-break-after: auto;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Evitar cortes antiestéticos dentro de filas de tablas */
  tr, .iso-table-grid tr, .iso-box-container {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .d-print-none {
    display: none !important;
  }
}
</style>
