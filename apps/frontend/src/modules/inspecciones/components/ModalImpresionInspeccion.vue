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

// Determinar si es una rutina de maquinaria auxiliar (FIM003) o variables críticas generales (FIM006)
const esRutinaEspecifica = computed(() => {
  const tipo = inspeccion.value?.tipoInspeccion
  return tipo === 'CHILLER' || tipo === 'COMPRESOR' || tipo === 'GENERADOR' || tipo === 'MONTACARGAS'
})

const tituloRutina = computed(() => {
  switch (inspeccion.value?.tipoInspeccion) {
    case 'CHILLER':
      return 'RUTINA DE INSPECCION CHILLERS'
    case 'COMPRESOR':
      return 'RUTINA DE INSPECCION COMPRESORES'
    case 'GENERADOR':
      return 'RUTINA DE INSPECCION GENERADORES'
    case 'MONTACARGAS':
      return 'RUTINA DE INSPECCION MONTACARGAS'
    default:
      return 'INSPECCIÓN DE VARIABLES CRÍTICAS'
  }
})

const codigoFormato = computed(() => {
  return esRutinaEspecifica.value ? 'FIM003' : 'FIM006'
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

// Agrupación de variables para FIM003: cualitativas vs cuantitativas/numéricas
const variablesCualitativas = computed(() => {
  if (!inspeccion.value?.detalles) return []
  return inspeccion.value.detalles.filter(d => {
    return d.variable?.tipoEvaluacion === 'SELECCION' || (d.valorNumerico === null || d.valorNumerico === undefined)
  })
})

const variablesCuantitativas = computed(() => {
  if (!inspeccion.value?.detalles) return []
  return inspeccion.value.detalles.filter(d => {
    return d.valorNumerico !== null && d.valorNumerico !== undefined
  })
})

// Agrupación cuantitativa por componente o bloque
const gruposCuantitativos = computed(() => {
  const grupos: Record<string, typeof variablesCuantitativas.value> = {}
  for (const d of variablesCuantitativas.value) {
    const compNombre = d.variable?.componente?.nombre || 'General'
    if (!grupos[compNombre]) {
      grupos[compNombre] = []
    }
    grupos[compNombre].push(d)
  }
  return grupos
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

// Estilos de evaluación cualitativa
const esEstadoPositivo = (valor?: string | null) => {
  if (!valor) return false
  const v = valor.trim().toLowerCase()
  return v === 'normal' || v === 'conforme' || v === 'operativo' || v === 'si' || v === 'sí' || v === 'ok'
}

const esEstadoNegativo = (valor?: string | null) => {
  if (!valor) return false
  const v = valor.trim().toLowerCase()
  return v === 'anormal' || v === 'no conforme' || v === 'falla' || v === 'inoperativo' || v === 'no' || v === 'crítico'
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
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
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
      <!-- Barra superior no imprimible -->
      <v-card-title class="py-3 px-4 d-flex align-center justify-space-between bg-slate-900 text-white d-print-none">
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
        <!-- DOCUMENTO IMPRIMIBLE OFICIAL -->
        <div id="documento-impresion-iso" class="formato-iso-contenedor pa-5 bg-white text-black mx-auto">

          <!-- ================================================================= -->
          <!-- FORMATO A: FIM003 (RUTINAS DE COMPRESORES, CHILLERS, GENERADORES) -->
          <!-- ================================================================= -->
          <template v-if="esRutinaEspecifica">
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
                    NOMBRE DEL EQUIPO
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="pa-1 align-top">
                    <div class="d-flex mb-1">
                      <span class="font-weight-medium mr-2" style="width: 60px;">Código:</span>
                      <span class="font-mono">{{ inspeccion.ubicacionTecnica?.codigo || '—' }}</span>
                    </div>
                    <div class="d-flex">
                      <span class="font-weight-medium mr-2" style="width: 60px;">Nombre:</span>
                      <span class="font-weight-bold">{{ inspeccion.ubicacionTecnica?.nombre || '—' }}</span>
                    </div>
                  </td>
                  <td class="pa-1 align-top">
                    <div class="d-flex mb-1">
                      <span class="font-weight-medium mr-2" style="width: 110px;">Código Abreviado:</span>
                      <span class="font-weight-bold font-mono text-danger">
                        {{ inspeccion.equipo?.codigo || '—' }}
                      </span>
                    </div>
                    <div class="d-flex mb-1">
                      <span class="font-weight-medium mr-2" style="width: 110px;">Código:</span>
                      <span class="font-mono">{{ inspeccion.equipo?.codigo || '—' }}</span>
                    </div>
                    <div class="d-flex">
                      <span class="font-weight-medium mr-2" style="width: 110px;">Nombre:</span>
                      <span class="font-weight-bold">{{ inspeccion.equipo?.nombre || '—' }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Tabla Principal: ITEM A INSPECCIONAR / ESTADO (Cualitativas) -->
            <table v-if="variablesCualitativas.length > 0" class="iso-table-grid mb-2 text-caption">
              <thead>
                <tr>
                  <th class="iso-cell-header text-center font-weight-bold" style="width: 65%;">
                    ITEM A INSPECCIONAR
                  </th>
                  <th class="iso-cell-header text-center font-weight-bold" style="width: 35%;">
                    ESTADO
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in variablesCualitativas" :key="item.id">
                  <td class="pa-1 px-2 font-weight-medium text-uppercase">
                    {{ item.variable?.nombre }}
                  </td>
                  <td
                    class="pa-1 text-center font-weight-bold"
                    :class="{
                      'iso-badge-normal': esEstadoPositivo(item.valorSeleccion),
                      'iso-badge-anormal': esEstadoNegativo(item.valorSeleccion)
                    }"
                  >
                    {{ item.valorSeleccion || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Mediciones Cuantitativas Agrupadas (Temperaturas, Amperajes, Horómetros) -->
            <div v-if="variablesCuantitativas.length > 0" class="mb-2">
              <table class="iso-table-grid text-caption">
                <thead>
                  <tr>
                    <th class="iso-cell-header text-center font-weight-bold" style="width: 65%;" colspan="2">
                      MEDICIONES Y PARÁMETROS OPERATIVOS
                    </th>
                    <th class="iso-cell-header text-center font-weight-bold" style="width: 35%;">
                      VALOR MEDIDO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(vars, compNombre) in gruposCuantitativos" :key="compNombre">
                    <tr v-for="(v, idx) in vars" :key="v.id">
                      <!-- Celda de componente agrupado -->
                      <td
                        v-if="idx === 0"
                        :rowspan="vars.length"
                        class="pa-1 px-2 font-weight-bold text-uppercase iso-cell-header align-middle"
                        style="width: 35%; background-color: #f1f5f9;"
                      >
                        {{ compNombre }}
                      </td>
                      <!-- Nombre de la variable específica -->
                      <td class="pa-1 px-2 font-weight-medium text-uppercase" style="width: 30%;">
                        {{ v.variable?.nombre }}
                      </td>
                      <!-- Valor medido numérico con unidad -->
                      <td
                        class="pa-1 text-center font-weight-bold font-mono"
                        :class="{ 'iso-badge-anormal': v.fueraDeRango }"
                        style="width: 35%;"
                      >
                        {{ v.valorNumerico }} {{ v.variable?.unidad || '' }}
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <!-- Sección: Observaciones -->
            <div class="iso-box-container mb-2">
              <div class="iso-cell-header text-center font-weight-bold pa-1">
                OBSERVACIONES
              </div>
              <div class="pa-2 text-caption font-weight-medium min-h-40">
                {{ inspeccion.observacionesGenerales || 'Sin observaciones registradas durante la ronda.' }}
              </div>
            </div>

            <!-- Sección: Valores Nominales -->
            <div class="iso-box-container mb-3">
              <div class="iso-cell-header text-center font-weight-bold pa-1">
                VALORES NOMINALES
              </div>
              <div class="pa-2 text-caption text-medium-emphasis min-h-30">
                Parámetros y rangos ajustados al manual del fabricante y especificaciones técnicas vigentes.
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
                    {{ inspeccion.aprobadoPor?.nombre ? `${inspeccion.aprobadoPor.nombre} ${inspeccion.aprobadoPor.apellido || ''}` : (inspeccion.revisadoPor?.nombre ? `${inspeccion.revisadoPor.nombre} ${inspeccion.revisadoPor.apellido || ''}` : '____________________________________') }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Código Oficial de Formato FIM003 -->
            <div class="text-caption font-weight-bold text-slate-800">
              FIM003
            </div>
          </template>


          <!-- ================================================================= -->
          <!-- FORMATO B: FIM006 (INSPECCIÓN DE VARIABLES CRÍTICAS GENERALES)    -->
          <!-- ================================================================= -->
          <template v-else>
            <!-- Encabezado con Logo, Título y Fecha/Semana -->
            <div class="d-flex align-center justify-space-between border-b pb-2 mb-2">
              <div style="width: 25%;">
                <img src="/LOGO_TUBRICA_AZUL.png" alt="TUBRICA" class="iso-logo-img" />
              </div>
              <div class="text-center font-weight-bold text-h6" style="width: 50%;">
                INSPECCIÓN DE VARIABLES CRÍTICAS
              </div>
              <div class="iso-header-dates text-caption" style="width: 25%;">
                <div class="d-flex border mb-1">
                  <span class="pa-1 iso-cell-header font-weight-bold" style="width: 50%;">Fecha:</span>
                  <span class="pa-1 font-mono text-center font-weight-bold text-danger" style="width: 50%;">{{ fechaStr }}</span>
                </div>
                <div class="d-flex border">
                  <span class="pa-1 iso-cell-header font-weight-bold" style="width: 50%;">Semana:</span>
                  <span class="pa-1 font-mono text-center font-weight-bold text-danger" style="width: 50%;">{{ semanaISO }}</span>
                </div>
              </div>
            </div>

            <!-- Grilla Ubicación Técnica y Equipo -->
            <table class="iso-table-grid mb-2 text-caption">
              <thead>
                <tr>
                  <th class="iso-cell-header text-center font-weight-bold" style="width: 50%;">
                    UBICACIÓN TÉCNICA
                  </th>
                  <th class="iso-cell-header text-center font-weight-bold" style="width: 50%;">
                    EQUIPO
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="pa-1 align-top">
                    <div class="d-flex mb-1">
                      <span class="font-weight-medium mr-2" style="width: 60px;">Código:</span>
                      <span class="font-mono">{{ inspeccion.ubicacionTecnica?.codigo || '—' }}</span>
                    </div>
                    <div class="d-flex">
                      <span class="font-weight-medium mr-2" style="width: 60px;">Nombre:</span>
                      <span class="font-weight-bold">{{ inspeccion.ubicacionTecnica?.nombre || '—' }}</span>
                    </div>
                  </td>
                  <td class="pa-1 align-top">
                    <div class="d-flex mb-1">
                      <span class="font-weight-medium mr-2" style="width: 60px;">Código:</span>
                      <span class="font-mono font-weight-bold">{{ inspeccion.equipo?.codigo || '—' }}</span>
                    </div>
                    <div class="d-flex">
                      <span class="font-weight-medium mr-2" style="width: 60px;">Nombre:</span>
                      <span class="font-weight-bold">{{ inspeccion.equipo?.nombre || '—' }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Tabla de Variables Críticas: DATOS PARA LA INSPECCIÓN -->
            <table class="iso-table-grid mb-2 text-caption">
              <thead>
                <tr>
                  <th colspan="5" class="iso-cell-header text-center font-weight-bold py-1">
                    DATOS PARA LA INSPECCIÓN
                  </th>
                </tr>
                <tr>
                  <th class="iso-cell-header text-center font-weight-bold" style="width: 25%;">Componente</th>
                  <th class="iso-cell-header text-center font-weight-bold" style="width: 30%;">Variable Critica</th>
                  <th class="iso-cell-header text-center font-weight-bold" style="width: 15%;">Valor Medido</th>
                  <th class="iso-cell-header text-center font-weight-bold" style="width: 15%;">Rango de Trabajo</th>
                  <th class="iso-cell-header text-center font-weight-bold" style="width: 15%;">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="d in inspeccion.detalles"
                  :key="d.id"
                  :class="{ 'iso-badge-anormal': d.fueraDeRango }"
                >
                  <td class="pa-1 px-2 font-weight-medium">
                    {{ d.variable?.componente?.nombre || 'General' }}
                  </td>
                  <td class="pa-1 px-2 font-weight-medium">
                    {{ d.variable?.nombre }}
                  </td>
                  <td class="pa-1 text-center font-weight-bold font-mono">
                    <span v-if="d.valorNumerico !== null && d.valorNumerico !== undefined">
                      {{ d.valorNumerico }} {{ d.variable?.unidad || '' }}
                    </span>
                    <span v-else>
                      {{ d.valorSeleccion || '—' }}
                    </span>
                  </td>
                  <td class="pa-1 text-center font-mono">
                    {{ formatearRango(d.variable) }}
                  </td>
                  <td class="pa-1 px-2 text-caption">
                    {{ d.observaciones || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Observaciones Generales (si existen) -->
            <div v-if="inspeccion.observacionesGenerales" class="iso-box-container mb-2">
              <div class="iso-cell-header text-center font-weight-bold pa-1">
                OBSERVACIONES GENERALES
              </div>
              <div class="pa-2 text-caption font-weight-medium min-h-30">
                {{ inspeccion.observacionesGenerales }}
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
                    {{ inspeccion.aprobadoPor?.nombre ? `${inspeccion.aprobadoPor.nombre} ${inspeccion.aprobadoPor.apellido || ''}` : (inspeccion.revisadoPor?.nombre ? `${inspeccion.revisadoPor.nombre} ${inspeccion.revisadoPor.apellido || ''}` : '____________________________________') }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Código Oficial de Formato FIM006 -->
            <div class="text-caption font-weight-bold text-slate-800">
              FIM006
            </div>
          </template>

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
  body * {
    visibility: hidden !important;
  }

  #documento-impresion-iso,
  #documento-impresion-iso * {
    visibility: visible !important;
  }

  #documento-impresion-iso {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 10mm !important;
    border: none !important;
    background: #ffffff !important;
    color: #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .d-print-none {
    display: none !important;
  }
}
</style>
