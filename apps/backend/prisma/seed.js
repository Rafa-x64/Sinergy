/* =============================================================================
 * SEED DE DATOS FICTICIOS — SISTEMA SINERGY
 * -----------------------------------------------------------------------------
 * Genera un conjunto mínimo pero coherente de datos para probar cada módulo:
 *   - Roles (Administrador / Supervisor / Técnico) y usuario administrador
 *   - Plantas, ubicaciones técnicas, tipos de equipo
 *   - Equipos, componentes, plantillas de variables y variables instancia
 *   - Catálogo de lubricantes, puntos de lubricación y horómetros
 *   - Inspecciones (varios estados y tipos), rutinas de lubricación,
 *     notificaciones y auditoría
 *
 * Uso:   node prisma/seed.js            (limpia y vuelve a poblar)
 *        node prisma/seed.js --force    (permite ejecutar con NODE_ENV=production)
 *
 * ADVERTENCIA: este script TRUNCA todas las tablas del sistema antes de
 * insertar. Está pensado exclusivamente para entornos de prueba/desarrollo.
 * ============================================================================= */

const path = require('path')

require(path.resolve(__dirname, '../node_modules/dotenv')).config({
  path: path.resolve(__dirname, '../.env')
})

const { PrismaClient, Prisma } = require(path.resolve(__dirname, '../node_modules/@prisma/client'))
const { PrismaPg } = require(path.resolve(__dirname, '../node_modules/@prisma/adapter-pg'))
const { Pool } = require(path.resolve(__dirname, '../node_modules/pg'))
const bcrypt = require(path.resolve(__dirname, '../node_modules/bcrypt'))

// ─── Conexión (misma lógica que src/core/prisma.ts) ─────────────────────────
const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD ?? '')
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`

const pool = new Pool({ connectionString })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// ─── Utilidades ──────────────────────────────────────────────────────────────
const PASSWORD_PRUEBA = 'tubrica.2026'

/** Fecha relativa: hace N días. */
const hace = (dias) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000)

/** Código de fecha AAAAMMDD a partir de una fecha. */
const codigoFecha = (fecha) => fecha.toISOString().slice(0, 10).replace(/-/g, '')

/** Redondea a `dec` decimales. */
const r = (n, dec = 2) => Number(Number(n).toFixed(dec))

/** Conjunto estándar de opciones de inspección. */
const OPC_ESTANDAR = [
  { clave: 'N', etiqueta: 'Normal' },
  { clave: 'A', etiqueta: 'Anormal' },
  { clave: 'B', etiqueta: 'Bajo' },
  { clave: 'E', etiqueta: 'Existe' },
  { clave: 'NE', etiqueta: 'No Existe' },
  { clave: 'N/A', etiqueta: 'No Aplica' }
]

// ─── Catálogo de tipos de equipo / componentes / plantillas ──────────────────
// tipoInspeccion debe ser uno de los que el frontend ofrece en el wizard.
const CATALOGO = {
  Montacargas: {
    descripcion: 'Flota de montacargas (equipos móviles).',
    componentes: ['Motor', 'Caja', 'Radiador', 'Frenos', 'Ruedas', 'Mástil', 'Batería', 'Dirección'],
    plantillas: [
      { tipoInspeccion: 'MONTACARGAS_DIARIO', componente: 'Motor', nombre: 'Nivel de Aceite', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'MONTACARGAS_DIARIO', componente: 'Motor', nombre: 'Temperatura del Motor', tipo: 'TEMPERATURA', unidad: '°C', min: 40, max: 110 },
      { tipoInspeccion: 'MONTACARGAS_DIARIO', componente: 'Motor', nombre: 'Presión de Aceite', tipo: 'NUMERICO_DECIMAL', unidad: 'PSI', min: 20, max: 80 },
      { tipoInspeccion: 'MONTACARGAS_DIARIO', componente: 'Caja', nombre: 'Nivel de Aceite de Caja', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'MONTACARGAS_DIARIO', componente: 'Caja', nombre: 'Fugas de Caja', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'MONTACARGAS_DIARIO', componente: 'Radiador', nombre: 'Nivel de Refrigerante', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'MONTACARGAS_DIARIO', componente: 'Radiador', nombre: 'Fugas de Radiador', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'MONTACARGAS_DIARIO', componente: 'Frenos', nombre: 'Freno de Mano', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'MONTACARGAS_DIARIO', componente: 'Frenos', nombre: 'Freno Derecho/Izquierdo', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'MONTACARGAS_DIARIO', componente: 'Ruedas', nombre: 'Condición de Cauchos', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'MONTACARGAS_SEMANAL', componente: 'Mástil', nombre: 'Estado de Cadenas', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'MONTACARGAS_SEMANAL', componente: 'Mástil', nombre: 'Estado de Rodamientos', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'MONTACARGAS_SEMANAL', componente: 'Batería', nombre: 'Voltaje de Batería', tipo: 'NUMERICO_DECIMAL', unidad: 'V', min: 11, max: 14.5 },
      { tipoInspeccion: 'MONTACARGAS_SEMANAL', componente: 'Dirección', nombre: 'Juego de Dirección', tipo: 'SELECCION', opciones: true }
    ]
  },
  Chiller: {
    descripcion: 'Enfriadores de agua para proceso (servicio continuo).',
    componentes: ['Compresor', 'Condensador', 'Evaporador', 'Bomba de Agua', 'Sistema Eléctrico'],
    plantillas: [
      { tipoInspeccion: 'CHILLER_DIARIO', componente: 'Compresor', nombre: 'Presión de Succión', tipo: 'NUMERICO_DECIMAL', unidad: 'bar', min: 2, max: 6 },
      { tipoInspeccion: 'CHILLER_DIARIO', componente: 'Compresor', nombre: 'Presión de Descarga', tipo: 'NUMERICO_DECIMAL', unidad: 'bar', min: 10, max: 18 },
      { tipoInspeccion: 'CHILLER_DIARIO', componente: 'Compresor', nombre: 'Temperatura de Descarga', tipo: 'TEMPERATURA', unidad: '°C', min: 60, max: 95 },
      { tipoInspeccion: 'CHILLER_DIARIO', componente: 'Condensador', nombre: 'Temperatura de Salida', tipo: 'TEMPERATURA', unidad: '°C', min: 25, max: 45 },
      { tipoInspeccion: 'CHILLER_DIARIO', componente: 'Condensador', nombre: 'Estado de Ventiladores', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'CHILLER_DIARIO', componente: 'Evaporador', nombre: 'Temperatura de Entrada', tipo: 'TEMPERATURA', unidad: '°C', min: 8, max: 15 },
      { tipoInspeccion: 'CHILLER_DIARIO', componente: 'Evaporador', nombre: 'Temperatura de Salida', tipo: 'TEMPERATURA', unidad: '°C', min: 3, max: 10 },
      { tipoInspeccion: 'CHILLER_DIARIO', componente: 'Bomba de Agua', nombre: 'Presión de Bomba', tipo: 'NUMERICO_DECIMAL', unidad: 'bar', min: 2, max: 4 },
      { tipoInspeccion: 'CHILLER_DIARIO', componente: 'Bomba de Agua', nombre: 'Fugas de Agua', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'CHILLER_SEMANAL', componente: 'Compresor', nombre: 'Vibración', tipo: 'NUMERICO_DECIMAL', unidad: 'mm/s', min: 0, max: 7 },
      { tipoInspeccion: 'CHILLER_SEMANAL', componente: 'Condensador', nombre: 'Limpieza de Aletas', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'CHILLER_SEMANAL', componente: 'Sistema Eléctrico', nombre: 'Aislamiento Eléctrico', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'CHILLER_SEMANAL', componente: 'Sistema Eléctrico', nombre: 'Filtraciones', tipo: 'SELECCION', opciones: true }
    ]
  },
  Compresor: {
    descripcion: 'Compresores de aire para servicio de planta.',
    componentes: ['Motor', 'Compresor', 'Sistema Eléctrico', 'Generales'],
    plantillas: [
      { tipoInspeccion: 'COMPRESOR', componente: 'Motor', nombre: 'Temperatura del Estator', tipo: 'TEMPERATURA', unidad: '°C', min: 40, max: 120 },
      { tipoInspeccion: 'COMPRESOR', componente: 'Motor', nombre: 'Temperatura Lado Libre', tipo: 'TEMPERATURA', unidad: '°C', min: 40, max: 110 },
      { tipoInspeccion: 'COMPRESOR', componente: 'Motor', nombre: 'Amperaje con Carga', tipo: 'NUMERICO_DECIMAL', unidad: 'A', min: 0, max: 30 },
      { tipoInspeccion: 'COMPRESOR', componente: 'Compresor', nombre: 'Presión de Descarga', tipo: 'NUMERICO_DECIMAL', unidad: 'PSI', min: 90, max: 130 },
      { tipoInspeccion: 'COMPRESOR', componente: 'Compresor', nombre: 'Temperatura del Impulsor', tipo: 'TEMPERATURA', unidad: '°C', min: 40, max: 110 },
      { tipoInspeccion: 'COMPRESOR', componente: 'Compresor', nombre: 'Nivel de Aceite', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'COMPRESOR', componente: 'Compresor', nombre: 'Fugas de Aceite', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'COMPRESOR', componente: 'Sistema Eléctrico', nombre: 'Amperaje en Vacío', tipo: 'NUMERICO_DECIMAL', unidad: 'A', min: 0, max: 20 },
      { tipoInspeccion: 'COMPRESOR', componente: 'Sistema Eléctrico', nombre: 'Horómetro', tipo: 'NUMERICO_ENTERO', unidad: 'h', min: 0, max: 99999 },
      { tipoInspeccion: 'COMPRESOR', componente: 'Sistema Eléctrico', nombre: 'Set Point de Presión', tipo: 'NUMERICO_DECIMAL', unidad: 'PSI', min: 90, max: 130 },
      { tipoInspeccion: 'COMPRESOR', componente: 'Generales', nombre: 'Ruidos Anormales', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'COMPRESOR', componente: 'Generales', nombre: 'Estado de Filtros', tipo: 'SELECCION', opciones: true }
    ]
  },
  Generador: {
    descripcion: 'Generadores eléctricos de respaldo.',
    componentes: ['Motor', 'Baterías', 'Sistema Eléctrico', 'Tanque de Combustible'],
    plantillas: [
      { tipoInspeccion: 'GENERADOR', componente: 'Motor', nombre: 'Nivel de Aceite', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'GENERADOR', componente: 'Motor', nombre: 'Nivel de Refrigerante', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'GENERADOR', componente: 'Motor', nombre: 'Temperatura del Motor', tipo: 'TEMPERATURA', unidad: '°C', min: 40, max: 110 },
      { tipoInspeccion: 'GENERADOR', componente: 'Motor', nombre: 'Horómetro', tipo: 'NUMERICO_ENTERO', unidad: 'h', min: 0, max: 99999 },
      { tipoInspeccion: 'GENERADOR', componente: 'Baterías', nombre: 'Voltaje Batería 1', tipo: 'NUMERICO_DECIMAL', unidad: 'V', min: 11, max: 14.5 },
      { tipoInspeccion: 'GENERADOR', componente: 'Baterías', nombre: 'Voltaje Batería 2', tipo: 'NUMERICO_DECIMAL', unidad: 'V', min: 11, max: 14.5 },
      { tipoInspeccion: 'GENERADOR', componente: 'Sistema Eléctrico', nombre: 'Voltaje de Salida', tipo: 'NUMERICO_DECIMAL', unidad: 'V', min: 210, max: 240 },
      { tipoInspeccion: 'GENERADOR', componente: 'Sistema Eléctrico', nombre: 'Frecuencia', tipo: 'NUMERICO_DECIMAL', unidad: 'Hz', min: 58, max: 62 },
      { tipoInspeccion: 'GENERADOR', componente: 'Sistema Eléctrico', nombre: 'Energía Generada', tipo: 'NUMERICO_DECIMAL', unidad: 'kWh', min: 0, max: 99999 },
      { tipoInspeccion: 'GENERADOR', componente: 'Tanque de Combustible', nombre: 'Nivel de Diésel', tipo: 'NUMERICO_DECIMAL', unidad: '%', min: 0, max: 100 }
    ]
  },
  Torno: {
    descripcion: 'Tornos CNC de mecanizado.',
    componentes: ['Husillo', 'Motor', 'Sistema de Refrigeración'],
    plantillas: [
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Husillo', nombre: 'Velocidad de Husillo', tipo: 'NUMERICO_ENTERO', unidad: 'RPM', min: 0, max: 3000 },
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Husillo', nombre: 'Temperatura de Husillo', tipo: 'TEMPERATURA', unidad: '°C', min: 20, max: 80 },
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Motor', nombre: 'Amperaje de Motor', tipo: 'NUMERICO_DECIMAL', unidad: 'A', min: 0, max: 25 },
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Motor', nombre: 'Temperatura de Motor', tipo: 'TEMPERATURA', unidad: '°C', min: 30, max: 90 },
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Sistema de Refrigeración', nombre: 'Nivel de Refrigerante', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Sistema de Refrigeración', nombre: 'Presión de Refrigerante', tipo: 'NUMERICO_DECIMAL', unidad: 'bar', min: 1, max: 5 }
    ]
  },
  Bomba: {
    descripcion: 'Bombas centrífugas de proceso.',
    componentes: ['Bomba', 'Motor Eléctrico'],
    plantillas: [
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Bomba', nombre: 'Presión de Descarga', tipo: 'NUMERICO_DECIMAL', unidad: 'bar', min: 1, max: 8 },
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Bomba', nombre: 'Presión de Succión', tipo: 'NUMERICO_DECIMAL', unidad: 'bar', min: 0, max: 3 },
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Bomba', nombre: 'Fugas de Sello', tipo: 'SELECCION', opciones: true },
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Motor Eléctrico', nombre: 'Amperaje de Motor', tipo: 'NUMERICO_DECIMAL', unidad: 'A', min: 0, max: 15 },
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Motor Eléctrico', nombre: 'Temperatura de Motor', tipo: 'TEMPERATURA', unidad: '°C', min: 30, max: 90 },
      { tipoInspeccion: 'VARIABLES_CRITICAS', componente: 'Motor Eléctrico', nombre: 'Vibración', tipo: 'NUMERICO_DECIMAL', unidad: 'mm/s', min: 0, max: 7 }
    ]
  }
}

// ─── Plantas y ubicaciones técnicas ──────────────────────────────────────────
const PLANTAS = [
  { codigo: '1000', nombre: 'Planta de Extrusión' },
  { codigo: '2000', nombre: 'Planta de Inyección' },
  { codigo: '3000', nombre: 'Planta de Mezcla' }
]

const UBICACIONES = [
  { codigo: '1000-EXT-L01', nombre: 'Línea de Extrusión 01', planta: '1000' },
  { codigo: '1000-EXT-L02', nombre: 'Línea de Extrusión 02', planta: '1000' },
  { codigo: '1000-EXT-SRV', nombre: 'Servicios Auxiliares Extrusión', planta: '1000' },
  { codigo: '1000-EXT-MT01', nombre: 'Patio de Montacargas Extrusión', planta: '1000' },
  { codigo: '2000-INY-L01', nombre: 'Línea de Inyección 01', planta: '2000' },
  { codigo: '2000-INY-SRV', nombre: 'Servicios Auxiliares Inyección', planta: '2000' },
  { codigo: '2000-INY-MT01', nombre: 'Patio de Montacargas Inyección', planta: '2000' },
  { codigo: '3000-MEZ-L01', nombre: 'Línea de Mezcla 01', planta: '3000' },
  { codigo: '3000-MEZ-SRV', nombre: 'Servicios Auxiliares Mezcla', planta: '3000' }
]

// ─── Catálogo de lubricantes ─────────────────────────────────────────────────
const LUBRICANTES = [
  { codigo: 'MOBIL-DTE-24', nombre: 'Mobil DTE 24', marca: 'Mobil', tipo: 'Aceite Hidráulico', viscosidad: 'ISO VG 32', unidadMedida: 'Litros' },
  { codigo: 'MOBIL-DTE-25', nombre: 'Mobil DTE 25', marca: 'Mobil', tipo: 'Aceite Hidráulico', viscosidad: 'ISO VG 46', unidadMedida: 'Litros' },
  { codigo: 'MOBIL-DTE-26', nombre: 'Mobil DTE 26', marca: 'Mobil', tipo: 'Aceite Hidráulico', viscosidad: 'ISO VG 68', unidadMedida: 'Litros' },
  { codigo: 'MOBILGEAR-600-220', nombre: 'Mobilgear 600 XP 220', marca: 'Mobil', tipo: 'Aceite para Engranajes', viscosidad: 'ISO VG 220', unidadMedida: 'Litros' },
  { codigo: 'SHELL-GADUS-S2', nombre: 'Shell Gadus S2 V220 2', marca: 'Shell', tipo: 'Grasa Extrema Presión', viscosidad: 'NLGI 2', unidadMedida: 'Gramos' },
  { codigo: 'MOBILITH-SHC-220', nombre: 'Mobilith SHC 220', marca: 'Mobil', tipo: 'Grasa Extrema Presión', viscosidad: 'NLGI 2', unidadMedida: 'Gramos' },
  { codigo: 'MOBIL-DELVAC-MX', nombre: 'Mobil Delvac MX 15W-40', marca: 'Mobil', tipo: 'Aceite de Motor', viscosidad: '15W-40', unidadMedida: 'Litros' },
  { codigo: 'MOBIL-SHC-624', nombre: 'Mobil SHC 624', marca: 'Mobil', tipo: 'Aceite Sintético', viscosidad: 'ISO VG 32', unidadMedida: 'Litros' }
]

// ─── Equipos ─────────────────────────────────────────────────────────────────
// horometros: lecturas ascendentes (días hacia atrás) para el historial.
const EQUIPOS = [
  {
    codigo: '1000GEN00001', nombre: 'Generador Caterpillar DE150 E01', tipo: 'Generador', ubicacion: '1000-EXT-SRV',
    serial: 'CAT-DE150-0001', marca: 'Caterpillar', modelo: 'DE150', estado: 'OPERATIVO',
    horometros: [1200, 1255, 1310]
  },
  {
    codigo: '1000CHI00001', nombre: 'Chiller Carrier 30XA C01', tipo: 'Chiller', ubicacion: '1000-EXT-SRV',
    serial: 'CAR-30XA-0001', marca: 'Carrier', modelo: '30XA-150', estado: 'OPERATIVO'
  },
  {
    codigo: '1000COM00001', nombre: 'Compresor Atlas Copco GA37 A01', tipo: 'Compresor', ubicacion: '1000-EXT-L01',
    serial: 'AC-GA37-0001', marca: 'Atlas Copco', modelo: 'GA37', estado: 'OPERATIVO',
    horometros: [3000, 3060, 3120]
  },
  {
    codigo: '1000TOR00001', nombre: 'Torno CNC Haas ST-20 T01', tipo: 'Torno', ubicacion: '1000-EXT-L02',
    serial: 'HAAS-ST20-0001', marca: 'Haas', modelo: 'ST-20', estado: 'EN_MANTENIMIENTO'
  },
  {
    codigo: '1000MTC00009', nombre: 'Montacarga Yale GLP090 M09', tipo: 'Montacargas', ubicacion: '1000-EXT-MT01',
    serial: 'YALE-GLP090-0009', marca: 'Yale', modelo: 'GLP090', estado: 'OPERATIVO',
    horometros: [1250, 1280, 1310],
    montacargas: {
      denominacion: 'Montacarga Yale GLP090 M09', tipoMontacarga: 'Montacarga', marca: 'Yale', modelo: 'GLP090',
      identificacionAbreviada: 'M09', ubicacionTecnicaTexto: '1000-EXT-MT01',
      denominacion2: 'Montacarga GLP contrabalanceado 4.0 Ton - Área Extrusión'
    }
  },
  {
    codigo: '2000CHI00001', nombre: 'Chiller Trane RTAC C02', tipo: 'Chiller', ubicacion: '2000-INY-SRV',
    serial: 'TRANE-RTAC-0002', marca: 'Trane', modelo: 'RTAC-300', estado: 'OPERATIVO'
  },
  {
    codigo: '2000COM00001', nombre: 'Compresor Kaeser ASD40 A02', tipo: 'Compresor', ubicacion: '2000-INY-L01',
    serial: 'KAESER-ASD40-0002', marca: 'Kaeser', modelo: 'ASD40', estado: 'OPERATIVO',
    horometros: [1500, 1590, 1680]
  },
  {
    codigo: '2000BOM00001', nombre: 'Bomba Centrífuga Grundfos NB65 B01', tipo: 'Bomba', ubicacion: '2000-INY-SRV',
    serial: 'GF-NB65-0001', marca: 'Grundfos', modelo: 'NB65-200', estado: 'OPERATIVO',
    horometros: [700, 800, 900]
  },
  {
    codigo: '2000MTC00001', nombre: 'Montacarga Toyota 8FGU25 M01', tipo: 'Montacargas', ubicacion: '2000-INY-MT01',
    serial: 'TOYOTA-8FGU25-0001', marca: 'Toyota', modelo: '8FGU25', estado: 'OPERATIVO',
    horometros: [400, 440, 480],
    montacargas: {
      denominacion: 'Montacarga Toyota 8FGU25 M01', tipoMontacarga: 'Montacarga', marca: 'Toyota', modelo: '8FGU25',
      identificacionAbreviada: 'M01', ubicacionTecnicaTexto: '2000-INY-MT01',
      denominacion2: 'Montacarga 2.5 Ton - Área Inyección'
    }
  },
  {
    codigo: '3000GEN00001', nombre: 'Generador Cummins C200 E02', tipo: 'Generador', ubicacion: '3000-MEZ-SRV',
    serial: 'CUM-C200-0002', marca: 'Cummins', modelo: 'C200', estado: 'OPERATIVO',
    horometros: [800, 850, 905]
  },
  {
    codigo: '3000BOM00001', nombre: 'Bomba Centrífuga KSB Etanorm B02', tipo: 'Bomba', ubicacion: '3000-MEZ-SRV',
    serial: 'KSB-ETANORM-0002', marca: 'KSB', modelo: 'Etanorm 065', estado: 'INOPERATIVO',
    horometros: [300, 360, 400]
  },
  {
    codigo: '3000MTC00001', nombre: 'Montacarga Hyster H50FT M02', tipo: 'Montacargas', ubicacion: '3000-MEZ-L01',
    serial: 'HYSTER-H50FT-0002', marca: 'Hyster', modelo: 'H50FT', estado: 'OPERATIVO',
    horometros: [200, 230, 260],
    montacargas: {
      denominacion: 'Montacarga Hyster H50FT M02', tipoMontacarga: 'Montacarga', marca: 'Hyster', modelo: 'H50FT',
      identificacionAbreviada: 'M02', ubicacionTecnicaTexto: '3000-MEZ-L01',
      denominacion2: 'Montacarga 2.5 Ton - Área Mezcla'
    }
  }
]

// ─── Plantillas de puntos de lubricación por tipo de equipo ──────────────────
const PLANTILLAS_LUBRICACION = [
  { tipo: 'Generador', componente: 'Motor', nombrePunto: 'Aceite de Motor', lubricante: 'MOBIL-DELVAC-MX', limiteHorasCambio: 250, capacidadRecomendada: 12 },
  { tipo: 'Compresor', componente: 'Compresor', nombrePunto: 'Aceite del Compresor', lubricante: 'MOBIL-SHC-624', limiteHorasCambio: 2000, capacidadRecomendada: 20 },
  { tipo: 'Bomba', componente: 'Motor Eléctrico', nombrePunto: 'Grasa de Rodamientos', lubricante: 'SHELL-GADUS-S2', limiteHorasCambio: 500, capacidadRecomendada: 50 },
  { tipo: 'Montacargas', componente: 'Motor', nombrePunto: 'Aceite de Motor', lubricante: 'MOBIL-DELVAC-MX', limiteHorasCambio: 250, capacidadRecomendada: 8 },
  { tipo: 'Montacargas', componente: 'Caja', nombrePunto: 'Aceite de Transmisión', lubricante: 'MOBILGEAR-600-220', limiteHorasCambio: 1000, capacidadRecomendada: 10 }
]

// ─── Limpieza total de tablas ────────────────────────────────────────────────
async function limpiarBaseDeDatos() {
  const tablas = [
    'auditoria_logs', 'notifications', 'rutina_lubricacion_detalles', 'rutinas_lubricacion',
    'inspeccion_adjuntos', 'inspeccion_detalles', 'inspecciones', 'historial_horometros',
    'puntos_lubricacion', 'plantilla_puntos_lubricacion', 'catalogo_lubricantes',
    'opciones_seleccion', 'variables', 'componentes', 'montacargas_detalles', 'equipos',
    'plantilla_opciones_seleccion', 'plantilla_variables', 'tipos_equipo', 'ubicaciones_tecnicas',
    'usuarios_plantas', 'roles_usuario', 'usuarios', 'plantas', 'roles'
  ]
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tablas.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`
  )
  // Asegura valores recientes en el enum TipoInspeccion y NivelLubricante de Postgres
  await prisma.$executeRawUnsafe(`ALTER TYPE "TipoInspeccion" ADD VALUE IF NOT EXISTS 'CHILLER_DIARIO';`)
  await prisma.$executeRawUnsafe(`ALTER TYPE "TipoInspeccion" ADD VALUE IF NOT EXISTS 'CHILLER_SEMANAL';`)
  await prisma.$executeRawUnsafe(`ALTER TYPE "NivelLubricante" ADD VALUE IF NOT EXISTS 'MINIMO';`)
  await prisma.$executeRawUnsafe(`ALTER TYPE "NivelLubricante" ADD VALUE IF NOT EXISTS 'NORMAL';`)
  await prisma.$executeRawUnsafe(`ALTER TYPE "NivelLubricante" ADD VALUE IF NOT EXISTS 'MAXIMO';`)
  console.log('   · Tablas vaciadas y enums verificados')
}

// ─── Seed principal ──────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Sembrando datos ficticios de Sinergy...\n')

  await limpiarBaseDeDatos()

  // 1) ROLES ------------------------------------------------------------------
  const rolSuperAdmin = await prisma.rol.create({
    data: {
      nombre: 'Administrador del Sistema',
      descripcion: 'Super Administrador Corporativo Tubrica. Acceso total e irrestricto a todas las plantas y configuración general.',
      esSupervisor: false,
      requiereSupervisor: false
    }
  })
  const rolAdminPlanta = await prisma.rol.create({
    data: {
      nombre: 'Administrador de Planta',
      descripcion: 'Administrador local de planta. Gestión de equipos, usuarios de planta y tablero operativo local.',
      esSupervisor: false,
      requiereSupervisor: false
    }
  })
  const rolSupervisor = await prisma.rol.create({
    data: {
      nombre: 'Supervisor / Gerente de Mantenimiento',
      descripcion: 'Verifica, aprueba y rechaza inspecciones. Configura la estructura de planta y exporta reportes.',
      esSupervisor: true,
      requiereSupervisor: false
    }
  })
  const rolTecnico = await prisma.rol.create({
    data: {
      nombre: 'Técnico de Mantenimiento',
      descripcion: 'Captura inspecciones y rutinas de lubricación en planta.',
      esSupervisor: false,
      requiereSupervisor: true
    }
  })
  console.log(`   · Roles creados: ${rolSuperAdmin.nombre}, ${rolAdminPlanta.nombre}, ${rolSupervisor.nombre}, ${rolTecnico.nombre}`)

  // 2) PLANTAS ----------------------------------------------------------------
  const plantasPorCodigo = {}
  for (const p of PLANTAS) {
    plantasPorCodigo[p.codigo] = await prisma.planta.create({ data: p })
  }
  const idsPlantas = Object.values(plantasPorCodigo).map((p) => p.id)
  console.log(`   · Plantas creadas: ${PLANTAS.map((p) => p.nombre).join(' | ')}`)

  // 3) UBICACIONES TÉCNICAS ---------------------------------------------------
  const ubicacionesPorCodigo = {}
  for (const u of UBICACIONES) {
    ubicacionesPorCodigo[u.codigo] = await prisma.ubicacionTecnica.create({
      data: {
        codigo: u.codigo,
        nombre: u.nombre,
        descripcion: `${u.nombre} — ${plantasPorCodigo[u.planta].nombre}`,
        plantaId: plantasPorCodigo[u.planta].id
      }
    })
  }
  console.log(`   · Ubicaciones técnicas creadas: ${UBICACIONES.length}`)

  // 4) USUARIOS ---------------------------------------------------------------
  const hash = await bcrypt.hash(PASSWORD_PRUEBA, 12)

  // 4.1 Super Administrador Tubrica (todas las plantas)
  const superAdmin = await prisma.usuario.create({
    data: {
      nombre: 'Super',
      apellido: 'Admin Tubrica',
      email: 'admin.tubrica@tubrica.com',
      nombreUsuario: 'admin.tubrica',
      passwordHash: hash,
      activo: true,
      ultimoAcceso: new Date(),
      plantaId: null,
      rolesUsuario: { create: [{ rolId: rolSuperAdmin.id }] },
      plantasUsuario: { create: idsPlantas.map((plantaId) => ({ plantaId })) }
    }
  })

  // 4.2 Administradores por Planta
  const adminExtrusion = await prisma.usuario.create({
    data: {
      nombre: 'Admin',
      apellido: 'Extrusión',
      email: 'admin.extrusion@tubrica.com',
      nombreUsuario: 'admin.extrusion',
      passwordHash: hash,
      activo: true,
      ultimoAcceso: new Date(),
      plantaId: plantasPorCodigo['1000'].id,
      rolesUsuario: { create: [{ rolId: rolAdminPlanta.id }] },
      plantasUsuario: { create: [{ plantaId: plantasPorCodigo['1000'].id }] }
    }
  })

  const adminInyeccion = await prisma.usuario.create({
    data: {
      nombre: 'Admin',
      apellido: 'Inyección',
      email: 'admin.inyeccion@tubrica.com',
      nombreUsuario: 'admin.inyeccion',
      passwordHash: hash,
      activo: true,
      ultimoAcceso: new Date(),
      plantaId: plantasPorCodigo['2000'].id,
      rolesUsuario: { create: [{ rolId: rolAdminPlanta.id }] },
      plantasUsuario: { create: [{ plantaId: plantasPorCodigo['2000'].id }] }
    }
  })

  const adminMezcla = await prisma.usuario.create({
    data: {
      nombre: 'Admin',
      apellido: 'Mezcla',
      email: 'admin.mezcla@tubrica.com',
      nombreUsuario: 'admin.mezcla',
      passwordHash: hash,
      activo: true,
      ultimoAcceso: new Date(),
      plantaId: plantasPorCodigo['3000'].id,
      rolesUsuario: { create: [{ rolId: rolAdminPlanta.id }] },
      plantasUsuario: { create: [{ plantaId: plantasPorCodigo['3000'].id }] }
    }
  })

  // 4.3 Supervisores
  const supervisor = await prisma.usuario.create({
    data: {
      nombre: 'Carlos',
      apellido: 'Mendoza (Supervisor)',
      email: 'supervisor@tubrica.com',
      nombreUsuario: 'supervisor',
      passwordHash: hash,
      activo: true,
      ultimoAcceso: new Date(),
      plantaId: plantasPorCodigo['1000'].id,
      rolesUsuario: { create: [{ rolId: rolSupervisor.id }] },
      plantasUsuario: { create: idsPlantas.map((plantaId) => ({ plantaId })) }
    }
  })

  const supervisorInyeccion = await prisma.usuario.create({
    data: {
      nombre: 'Luis',
      apellido: 'Pérez (Supervisor)',
      email: 'supervisor.inyeccion@tubrica.com',
      nombreUsuario: 'supervisor.inyeccion',
      passwordHash: hash,
      activo: true,
      ultimoAcceso: new Date(),
      plantaId: plantasPorCodigo['2000'].id,
      rolesUsuario: { create: [{ rolId: rolSupervisor.id }] },
      plantasUsuario: { create: [{ plantaId: plantasPorCodigo['2000'].id }] }
    }
  })

  // 4.4 Técnicos de Planta
  const tecnicoExtrusion = await prisma.usuario.create({
    data: {
      nombre: 'José',
      apellido: 'Rivas (Técnico)',
      email: 'tecnico.extrusion@tubrica.com',
      nombreUsuario: 'tecnico.extrusion',
      passwordHash: hash,
      activo: true,
      ultimoAcceso: new Date(),
      plantaId: plantasPorCodigo['1000'].id,
      supervisorId: supervisor.id,
      rolesUsuario: { create: [{ rolId: rolTecnico.id }] },
      plantasUsuario: { create: [{ plantaId: plantasPorCodigo['1000'].id }] }
    }
  })

  const tecnicoInyeccion = await prisma.usuario.create({
    data: {
      nombre: 'Miguel',
      apellido: 'Gómez (Técnico)',
      email: 'tecnico.inyeccion@tubrica.com',
      nombreUsuario: 'tecnico.inyeccion',
      passwordHash: hash,
      activo: true,
      ultimoAcceso: new Date(),
      plantaId: plantasPorCodigo['2000'].id,
      supervisorId: supervisorInyeccion.id,
      rolesUsuario: { create: [{ rolId: rolTecnico.id }] },
      plantasUsuario: { create: [{ plantaId: plantasPorCodigo['2000'].id }] }
    }
  })

  const tecnicoMezcla = await prisma.usuario.create({
    data: {
      nombre: 'Andrés',
      apellido: 'Salazar (Técnico)',
      email: 'tecnico.mezcla@tubrica.com',
      nombreUsuario: 'tecnico.mezcla',
      passwordHash: hash,
      activo: true,
      ultimoAcceso: new Date(),
      plantaId: plantasPorCodigo['3000'].id,
      supervisorId: supervisor.id,
      rolesUsuario: { create: [{ rolId: rolTecnico.id }] },
      plantasUsuario: { create: [{ plantaId: plantasPorCodigo['3000'].id }] }
    }
  })

  console.log('   · Usuarios creados: admin.tubrica, admin.extrusion, admin.inyeccion, admin.mezcla, supervisor, supervisor.inyeccion, tecnico.extrusion, tecnico.inyeccion, tecnico.mezcla')

  // 5) TIPOS DE EQUIPO + PLANTILLAS DE VARIABLES ------------------------------
  const tiposEquipoPorNombre = {}
  const plantillasPorTipo = {} // nombre tipo -> [ plantilla ]
  const opcionesPlantilla = {} // plantillaId -> [ opciones ]

  for (const [nombreTipo, def] of Object.entries(CATALOGO)) {
    const tipoEquipo = await prisma.tipoEquipo.create({
      data: { nombre: nombreTipo, descripcion: def.descripcion }
    })
    tiposEquipoPorNombre[nombreTipo] = tipoEquipo

    const lista = []
    let orden = 0
    for (const p of def.plantillas) {
      if (!def.componentes.includes(p.componente)) {
        throw new Error(`Plantilla "${p.nombre}" referencia un componente inexistente "${p.componente}" en ${nombreTipo}`)
      }
      const opciones = p.opciones ? OPC_ESTANDAR : []
      const plantilla = await prisma.plantillaVariable.create({
        data: {
          tipoEquipoId: tipoEquipo.id,
          tipoInspeccion: p.tipoInspeccion,
          nombreComponente: p.componente,
          nombre: p.nombre,
          descripcion: `Variable normativa para ${p.componente} (${p.tipoInspeccion})`,
          tipoEvaluacion: p.tipo,
          unidad: p.unidad ?? null,
          valorMinimo: p.min ?? null,
          valorMaximo: p.max ?? null,
          ordenPosicion: orden++,
          activa: true,
          ...(opciones.length > 0
            ? { opcionesSeleccion: { createMany: { data: opciones.map((o, i) => ({ ...o, ordenPosicion: i })) } } }
            : {})
        }
      })
      lista.push(plantilla)
      opcionesPlantilla[plantilla.id] = opciones
    }
    plantillasPorTipo[nombreTipo] = lista
  }
  console.log(`   · Tipos de equipo y plantillas de variables creados (${Object.keys(CATALOGO).length} tipos)`)

  // 6) EQUIPOS + COMPONENTES + VARIABLES INSTANCIA ----------------------------
  const equiposPorCodigo = {}
  const variablesPorEquipo = {} // equipoId -> [ { id, nombre, tipoEvaluacion, min, max, componente, tipoInspeccion } ]

  for (const def of EQUIPOS) {
    const tipo = tiposEquipoPorNombre[def.tipo]
    const ubicacion = ubicacionesPorCodigo[def.ubicacion]

    const equipo = await prisma.equipo.create({
      data: {
        codigo: def.codigo,
        nombre: def.nombre,
        serial: def.serial ?? null,
        marca: def.marca ?? null,
        modelo: def.modelo ?? null,
        estadoOperativo: def.estado,
        observacion: `Equipo de prueba — ${def.tipo}`,
        ubicacionTecnicaId: ubicacion.id,
        tipoEquipoId: tipo.id,
        creadoEn: hace(160),
        ...(def.montacargas ? { montacargasDetalle: { create: def.montacargas } } : {})
      }
    })
    equiposPorCodigo[def.codigo] = equipo

    // Componentes del tipo
    const componentesPorNombre = {}
    let ordenComp = 0
    for (const nombreComp of CATALOGO[def.tipo].componentes) {
      componentesPorNombre[nombreComp] = await prisma.componente.create({
        data: {
          equipoId: equipo.id,
          nombre: nombreComp,
          descripcion: `Componente ${nombreComp} de ${def.nombre}`,
          activo: true,
          ordenPosicion: ordenComp++
        }
      })
    }

    // Variables instancia (una por plantilla del tipo), enlazadas a su componente
    const variables = []
    for (const plantilla of plantillasPorTipo[def.tipo]) {
      const componente = componentesPorNombre[plantilla.nombreComponente]
      const opciones = opcionesPlantilla[plantilla.id] || []
      const variable = await prisma.variable.create({
        data: {
          componenteId: componente.id,
          plantillaId: plantilla.id,
          nombre: plantilla.nombre,
          tipoEvaluacion: plantilla.tipoEvaluacion,
          unidad: plantilla.unidad,
          valorMinimo: plantilla.valorMinimo,
          valorMaximo: plantilla.valorMaximo,
          ordenPosicion: plantilla.ordenPosicion,
          activa: true,
          ...(opciones.length > 0
            ? { opcionesSeleccion: { createMany: { data: opciones.map((o, i) => ({ ...o, ordenPosicion: i })) } } }
            : {})
        }
      })
      variables.push({
        id: variable.id,
        nombre: variable.nombre,
        tipoEvaluacion: variable.tipoEvaluacion,
        componente: plantilla.nombreComponente,
        tipoInspeccion: plantilla.tipoInspeccion,
        min: plantilla.valorMinimo !== null ? Number(plantilla.valorMinimo) : null,
        max: plantilla.valorMaximo !== null ? Number(plantilla.valorMaximo) : null,
        opciones
      })
    }
    variablesPorEquipo[equipo.id] = variables

    // Historial de horómetros
    if (def.horometros && def.horometros.length > 0) {
      let dias = def.horometros.length * 7
      for (const valor of def.horometros) {
        await prisma.historialHorometro.create({
          data: {
            equipoId: equipo.id,
            valorHorometro: valor,
            fechaLectura: hace(dias),
            origen: 'LECTURA_MANUAL',
            registradoPorId: tecnicoExtrusion.id
          }
        })
        dias -= 7
      }
    }
  }
  console.log(`   · Equipos, componentes y variables creados (${EQUIPOS.length} equipos)`)

  // 7) CATÁLOGO DE LUBRICANTES + PLANTILLAS DE LUBRICACIÓN --------------------
  const lubricantesPorCodigo = {}
  for (const l of LUBRICANTES) {
    lubricantesPorCodigo[l.codigo] = await prisma.catalogoLubricante.create({ data: { ...l, activo: true } })
  }

  const plantillasLubricacion = []
  for (const p of PLANTILLAS_LUBRICACION) {
    const tipo = tiposEquipoPorNombre[p.tipo]
    const pl = await prisma.plantillaPuntoLubricacion.create({
      data: {
        tipoEquipoId: tipo.id,
        nombreComponente: p.componente,
        nombrePunto: p.nombrePunto,
        lubricanteId: lubricantesPorCodigo[p.lubricante].id,
        limiteHorasCambio: p.limiteHorasCambio,
        capacidadRecomendada: p.capacidadRecomendada,
        activo: true
      }
    })
    plantillasLubricacion.push({ ...p, id: pl.id, tipoEquipoId: tipo.id })
  }
  console.log(`   · Catálogo de lubricantes (${LUBRICANTES.length}) y plantillas de lubricación (${plantillasLubricacion.length}) creados`)

  // 8) PUNTOS DE LUBRICACIÓN (instancia por equipo) ---------------------------
  const puntosPorEquipo = {} // equipoId -> [ { id, nombre, horometroUltimoCambio, limite } ]
  for (const def of EQUIPOS) {
    const equipo = equiposPorCodigo[def.codigo]
    const componentes = await prisma.componente.findMany({ where: { equipoId: equipo.id } })
    const compPorNombre = Object.fromEntries(componentes.map((c) => [c.nombre, c.id]))
    const horometroActual = def.horometros && def.horometros.length ? def.horometros[def.horometros.length - 1] : 0

    puntosPorEquipo[equipo.id] = []

    for (const p of plantillasLubricacion.filter((x) => x.tipo === def.tipo)) {
      // El último cambio se fija en 0 para la caja (quedará vencido) y ~60h antes del actual para el resto.
      const esVencido = p.nombrePunto === 'Aceite de Transmisión'
      const ultimoCambio = esVencido ? 0 : Math.max(0, horometroActual - 60)

      const punto = await prisma.puntoLubricacion.create({
        data: {
          equipoId: equipo.id,
          componenteId: compPorNombre[p.componente] ?? null,
          plantillaId: p.id,
          lubricanteId: lubricantesPorCodigo[p.lubricante].id,
          nombrePunto: p.nombrePunto,
          limiteHorasCambio: p.limiteHorasCambio,
          horometroUltimoCambio: ultimoCambio,
          fechaUltimoCambio: hace(45),
          capacidadRecomendada: p.capacidadRecomendada,
          activo: true
        }
      })
      puntosPorEquipo[equipo.id].push({ id: punto.id, nombre: punto.nombrePunto, horometroUltimoCambio: ultimoCambio, limite: p.limiteHorasCambio, lubricante: p.lubricante })
    }
  }
  console.log(`   · Puntos de lubricación generados por equipo`)

  // 9) INSPECCIONES + DETALLES ------------------------------------------------
  const contadorCodigos = {}

  /** Genera el siguiente código secuencial para un prefijo/día. */
  const siguienteCodigo = (prefijo, fecha) => {
    const cf = codigoFecha(fecha)
    const key = `${prefijo}-${cf}`
    contadorCodigos[key] = (contadorCodigos[key] || 0) + 1
    return `INSP-LUB-${prefijo}-${cf}-${String(contadorCodigos[key]).padStart(2, '0')}`
  }

  const prefijoPorTipo = {
    VARIABLES_CRITICAS: 'EXT', MONTACARGAS_DIARIO: 'MTC', MONTACARGAS_SEMANAL: 'MTC',
    CHILLER_DIARIO: 'CHI', CHILLER_SEMANAL: 'CHI', COMPRESOR: 'COM', GENERADOR: 'GEN', LUBRICACION: 'LUB'
  }

  /** Valor por defecto coherente con el tipo de evaluación de la variable. */
  const valorParaVariable = (v, forzarFueraDeRango = false) => {
    if (v.tipoEvaluacion === 'SELECCION') {
      return { valorSeleccion: forzarFueraDeRango ? 'A' : 'N', valorNumerico: null }
    }
    if (v.min === null || v.max === null) {
      return { valorNumerico: r((v.min ?? 0) + 1, 2), valorSeleccion: null }
    }
    if (forzarFueraDeRango) {
      return { valorNumerico: r(v.max * 1.15, 2), valorSeleccion: null }
    }
    const medio = v.min + (v.max - v.min) * 0.5
    const dec = v.tipoEvaluacion === 'NUMERICO_ENTERO' ? 0 : v.tipoEvaluacion === 'TEMPERATURA' ? 1 : 2
    return { valorNumerico: r(medio, dec), valorSeleccion: null }
  }

  /**
   * Crea una inspección con sus detalles.
   * @param indivar opciones de generación
   */
  async function crearInspeccionConDetalles(opts) {
    const equipo = equiposPorCodigo[opts.equipoCodigo]
    const variables = variablesPorEquipo[equipo.id].filter((v) => v.tipoInspeccion === opts.tipoInspeccion)
    if (variables.length === 0) {
      throw new Error(`No hay variables tipo ${opts.tipoInspeccion} para el equipo ${opts.equipoCodigo}`)
    }

    const fecha = opts.fecha
    const codigo = siguienteCodigo(prefijoPorTipo[opts.tipoInspeccion] ?? 'GEN', fecha)
    const ubicacion = await prisma.equipo.findUnique({ where: { id: equipo.id }, select: { ubicacionTecnicaId: true, tipoEquipoId: true } })

    const inspeccion = await prisma.inspeccion.create({
      data: {
        codigoInspeccion: codigo,
        tipoInspeccion: opts.tipoInspeccion,
        plantaId: opts.plantaId,
        ubicacionTecnicaId: ubicacion.ubicacionTecnicaId,
        tipoEquipoId: ubicacion.tipoEquipoId,
        equipoId: equipo.id,
        elaboradoPorId: opts.elaboradoPorId,
        revisadoPorId: opts.estado !== 'PENDIENTE' ? opts.revisadoPorId ?? null : null,
        aprobadoPorId: opts.estado === 'APROBADO' ? opts.revisadoPorId ?? null : null,
        estadoInspeccion: opts.estado,
        origenDatos: opts.origenDatos ?? 'ONLINE',
        fechaRegistro: fecha,
        fechaSincronizacion: opts.origenDatos === 'OFFLINE_SYNC' ? fecha : null,
        observacionesGenerales: opts.observaciones ?? null,
        motivoRechazo: opts.motivoRechazo ?? null,
        creadoEn: fecha,
        detalles: {
          create: variables.map((v, idx) => {
            const fuera = opts.fueraDeRangoIndex === idx
            const valor = valorParaVariable(v, fuera)
            return {
              variableId: v.id,
              valorNumerico: valor.valorNumerico,
              valorSeleccion: valor.valorSeleccion,
              observaciones: fuera ? 'Valor fuera del rango normativo. Requiere revisión.' : null,
              estadoComponente: !fuera
            }
          })
        }
      }
    })

    return { inspeccion, codigo, variables }
  }

  const inspeccionesCreadas = []

  // 9.1 Generador Extrusión — APROBADO
  {
    const { inspeccion, codigo } = await crearInspeccionConDetalles({
      equipoCodigo: '1000GEN00001', tipoInspeccion: 'GENERADOR', estado: 'APROBADO',
      plantaId: plantasPorCodigo['1000'].id, elaboradoPorId: tecnicoExtrusion.id, revisadoPorId: supervisor.id,
      fecha: hace(12), observaciones: 'Generador operativo. Niveles de fluidos estables.'
    })
    inspeccionesCreadas.push({ inspeccion, codigo, tipo: 'GENERADOR', tecnico: tecnicoExtrusion, estado: 'APROBADO' })
  }

  // 9.2 Compresor Extrusión — PENDIENTE (con 1 valor fuera de rango)
  {
    const { inspeccion, codigo } = await crearInspeccionConDetalles({
      equipoCodigo: '1000COM00001', tipoInspeccion: 'COMPRESOR', estado: 'PENDIENTE',
      plantaId: plantasPorCodigo['1000'].id, elaboradoPorId: tecnicoExtrusion.id,
      fecha: hace(3), fueraDeRangoIndex: 0, observaciones: 'Temperatura del estator por encima del rango.'
    })
    inspeccionesCreadas.push({ inspeccion, codigo, tipo: 'COMPRESOR', tecnico: tecnicoExtrusion, estado: 'PENDIENTE' })
  }

  // 9.3 Chiller Extrusión — PENDIENTE
  {
    const { inspeccion, codigo } = await crearInspeccionConDetalles({
      equipoCodigo: '1000CHI00001', tipoInspeccion: 'CHILLER_DIARIO', estado: 'PENDIENTE',
      plantaId: plantasPorCodigo['1000'].id, elaboradoPorId: tecnicoExtrusion.id,
      fecha: hace(1), observaciones: 'Lecturas dentro de parámetros normales.'
    })
    inspeccionesCreadas.push({ inspeccion, codigo, tipo: 'CHILLER_DIARIO', tecnico: tecnicoExtrusion, estado: 'PENDIENTE' })
  }

  // 9.4 Montacargas Extrusión — RECHAZADO
  {
    const { inspeccion, codigo } = await crearInspeccionConDetalles({
      equipoCodigo: '1000MTC00009', tipoInspeccion: 'MONTACARGAS_DIARIO', estado: 'RECHAZADO',
      plantaId: plantasPorCodigo['1000'].id, elaboradoPorId: tecnicoExtrusion.id, revisadoPorId: supervisor.id,
      fecha: hace(6), motivoRechazo: 'Falta evidencia fotográfica del estado de los cauchos.',
      observaciones: 'Se detectó desgaste leve en caucho delantero derecho.'
    })
    inspeccionesCreadas.push({ inspeccion, codigo, tipo: 'MONTACARGAS_DIARIO', tecnico: tecnicoExtrusion, estado: 'RECHAZADO' })
  }

  // 9.5 Torno Extrusión — APROBADO (variables críticas)
  {
    const { inspeccion, codigo } = await crearInspeccionConDetalles({
      equipoCodigo: '1000TOR00001', tipoInspeccion: 'VARIABLES_CRITICAS', estado: 'APROBADO',
      plantaId: plantasPorCodigo['1000'].id, elaboradoPorId: tecnicoExtrusion.id, revisadoPorId: supervisor.id,
      fecha: hace(20), observaciones: 'Torno en mantenimiento programado, parámetros estables.'
    })
    inspeccionesCreadas.push({ inspeccion, codigo, tipo: 'VARIABLES_CRITICAS', tecnico: tecnicoExtrusion, estado: 'APROBADO' })
  }

  // 9.6 Chiller Inyección — APROBADO (origen offline)
  {
    const { inspeccion, codigo } = await crearInspeccionConDetalles({
      equipoCodigo: '2000CHI00001', tipoInspeccion: 'CHILLER_DIARIO', estado: 'APROBADO',
      plantaId: plantasPorCodigo['2000'].id, elaboradoPorId: tecnicoInyeccion.id, revisadoPorId: supervisor.id,
      fecha: hace(8), origenDatos: 'OFFLINE_SYNC', observaciones: 'Registro capturado sin señal y sincronizado.'
    })
    inspeccionesCreadas.push({ inspeccion, codigo, tipo: 'CHILLER_DIARIO', tecnico: tecnicoInyeccion, estado: 'APROBADO' })
  }

  // 9.7 Bomba Inyección — PENDIENTE (variables críticas)
  {
    const { inspeccion, codigo } = await crearInspeccionConDetalles({
      equipoCodigo: '2000BOM00001', tipoInspeccion: 'VARIABLES_CRITICAS', estado: 'PENDIENTE',
      plantaId: plantasPorCodigo['2000'].id, elaboradoPorId: tecnicoInyeccion.id,
      fecha: hace(2), observaciones: 'Bomba operativa, pendiente revisión de vibración.'
    })
    inspeccionesCreadas.push({ inspeccion, codigo, tipo: 'VARIABLES_CRITICAS', tecnico: tecnicoInyeccion, estado: 'PENDIENTE' })
  }

  // 9.8 Montacargas Inyección — APROBADO
  {
    const { inspeccion, codigo } = await crearInspeccionConDetalles({
      equipoCodigo: '2000MTC00001', tipoInspeccion: 'MONTACARGAS_DIARIO', estado: 'APROBADO',
      plantaId: plantasPorCodigo['2000'].id, elaboradoPorId: tecnicoInyeccion.id, revisadoPorId: supervisor.id,
      fecha: hace(10), observaciones: 'Inspección diaria sin novedades.'
    })
    inspeccionesCreadas.push({ inspeccion, codigo, tipo: 'MONTACARGAS_DIARIO', tecnico: tecnicoInyeccion, estado: 'APROBADO' })
  }

  console.log(`   · Inspecciones creadas: ${inspeccionesCreadas.length}`)

  // 10) RUTINAS DE LUBRICACIÓN + INSPECCIÓN VINCULADA -------------------------
  const rutinasCreadas = []

  async function crearRutinaLubricacion(opts) {
    const equipo = equiposPorCodigo[opts.equipoCodigo]
    const puntos = puntosPorEquipo[equipo.id] || []
    if (puntos.length === 0) throw new Error(`El equipo ${opts.equipoCodigo} no tiene puntos de lubricación`)

    const fecha = opts.fecha
    const horometro = opts.horometro
    const ubic = await prisma.ubicacionTecnica.findUnique({ where: { id: equipo.ubicacionTecnicaId } })

    const codigoRutina = `RUT-LUB-${codigoFecha(fecha)}-${opts.equipoCodigo.slice(-3)}`

    const inspeccion = await prisma.inspeccion.create({
      data: {
        codigoInspeccion: `INSP-LUB-PL${ubic.id}-${codigoFecha(fecha)}-${String(rutinasCreadas.length + 1).padStart(4, '0')}`,
        tipoInspeccion: 'LUBRICACION',
        plantaId: opts.plantaId,
        ubicacionTecnicaId: equipo.ubicacionTecnicaId,
        tipoEquipoId: equipo.tipoEquipoId,
        equipoId: equipo.id,
        elaboradoPorId: opts.elaboradoPorId,
        estadoInspeccion: opts.estado,
        revisadoPorId: opts.estado !== 'PENDIENTE' ? opts.revisadoPorId ?? null : null,
        aprobadoPorId: opts.estado === 'APROBADO' ? opts.revisadoPorId ?? null : null,
        fechaRegistro: fecha,
        observacionesGenerales: opts.observaciones ?? null,
        creadoEn: fecha
      }
    })

    const rutina = await prisma.rutinaLubricacion.create({
      data: {
        codigoRutina,
        inspeccionId: inspeccion.id,
        plantaId: opts.plantaId,
        ubicacionTecnicaId: equipo.ubicacionTecnicaId,
        equipoId: equipo.id,
        elaboradoPorId: opts.elaboradoPorId,
        fechaEjecucion: fecha,
        horometroRegistrado: horometro,
        observaciones: opts.observaciones ?? null,
        creadoEn: fecha
      }
    })

    for (const [idx, p] of puntos.entries()) {
      const nivel = idx === 0 && opts.detectaFuga ? 'MINIMO' : 'NORMAL'
      const fuga = Boolean(opts.detectaFuga) && idx === 0
      const reposicion = idx === 0
      await prisma.rutinaLubricacionDetalle.create({
        data: {
          rutinaId: rutina.id,
          puntoLubricacionId: p.id,
          nivelLubricante: nivel,
          seRealizoReposicion: reposicion,
          cantidadRepuesta: reposicion ? r(p.limite / 100 + 1, 2) : null,
          seRealizoCambioTotal: false,
          presentaFuga: fuga,
          observaciones: fuga ? 'Se detecta fuga leve en sello; se recomienda inspección.' : null
        }
      })
    }

    // Registro de horómetro asociado a la rutina
    await prisma.historialHorometro.create({
      data: {
        equipoId: equipo.id,
        valorHorometro: horometro,
        fechaLectura: fecha,
        origen: 'RUTINA_LUBRICACION',
        registradoPorId: opts.elaboradoPorId
      }
    })

    return { rutina, inspeccion, codigo: inspeccion.codigoInspeccion }
  }

  // Generador Extrusión — PENDIENTE (con fuga)
  {
    const { codigo } = await crearRutinaLubricacion({
      equipoCodigo: '1000GEN00001', plantaId: plantasPorCodigo['1000'].id,
      elaboradoPorId: tecnicoExtrusion.id, fecha: hace(4), horometro: 1335,
      detectaFuga: true, observaciones: 'Rutina de lubricación con fuga detectada en motor.'
    })
    rutinasCreadas.push(codigo)
  }

  // Montacargas Inyección — APROBADO
  {
    const { codigo } = await crearRutinaLubricacion({
      equipoCodigo: '2000MTC00001', plantaId: plantasPorCodigo['2000'].id,
      elaboradoPorId: tecnicoInyeccion.id, revisadoPorId: supervisor.id, estado: 'APROBADO',
      fecha: hace(9), horometro: 500, detectaFuga: false,
      observaciones: 'Reposición de aceite de motor y transmisión sin novedades.'
    })
    rutinasCreadas.push(codigo)
  }

  console.log(`   · Rutinas de lubricación creadas: ${rutinasCreadas.length}`)

  // 11) NOTIFICACIONES --------------------------------------------------------
  const notificaciones = []

  for (const item of inspeccionesCreadas) {
    if (item.estado === 'PENDIENTE') {
      notificaciones.push({
        usuarioId: supervisor.id,
        tipo: 'WARNING',
        categoria: 'INSPECCION_PENDIENTE',
        titulo: 'Nueva Inspección Pendiente',
        mensaje: `Se ha registrado la inspección ${item.codigo} (${item.tipo}) pendiente de revisión.`,
        entidadAfectada: 'INSPECCION',
        entidadId: String(item.inspeccion.id),
        leido: false,
        creadoEn: item.inspeccion.fechaRegistro
      })
    } else if (item.estado === 'APROBADO') {
      notificaciones.push({
        usuarioId: item.tecnico.id,
        tipo: 'SUCCESS',
        categoria: 'INSPECCION_APROBADA',
        titulo: 'Inspección Aprobada',
        mensaje: `Tu inspección ${item.codigo} ha sido aprobada.`,
        entidadAfectada: 'INSPECCION',
        entidadId: String(item.inspeccion.id),
        leido: true,
        creadoEn: item.inspeccion.fechaRegistro
      })
    } else if (item.estado === 'RECHAZADO') {
      notificaciones.push({
        usuarioId: item.tecnico.id,
        tipo: 'ERROR',
        categoria: 'INSPECCION_RECHAZADA',
        titulo: 'Inspección Rechazada',
        mensaje: `Tu inspección ${item.codigo} ha sido rechazada. Motivo: falta evidencia fotográfica.`,
        entidadAfectada: 'INSPECCION',
        entidadId: String(item.inspeccion.id),
        leido: false,
        creadoEn: item.inspeccion.fechaRegistro
      })
    }
  }

  // Notificación broadcast de auditoría del sistema
  notificaciones.push({
    usuarioId: null,
    tipo: 'ALERT',
    categoria: 'AUDITORIA_SISTEMA',
    titulo: 'Mantenimiento programado',
    mensaje: 'El sistema estará en mantenimiento el próximo domingo de 02:00 a 04:00 AM.',
    entidadAfectada: 'SISTEMA',
    entidadId: null,
    leido: false,
    creadoEn: hace(1)
  })

  await prisma.notificacion.createMany({ data: notificaciones })
  console.log(`   · Notificaciones creadas: ${notificaciones.length}`)

  // 12) ADJUNTO DE EJEMPLO ----------------------------------------------------
  const inspeccionAprobada = inspeccionesCreadas.find((i) => i.estado === 'APROBADO')
  if (inspeccionAprobada) {
    await prisma.inspeccionAdjunto.create({
      data: {
        inspeccionId: inspeccionAprobada.inspeccion.id,
        rutaArchivo: '/uploads/inspecciones/evidencia-ejemplo.jpg',
        nombreArchivo: 'evidencia-ejemplo.jpg',
        tipoMime: 'image/jpeg',
        tamanoBytes: BigInt(204800)
      }
    })
  }

  // 13) AUDITORÍA -------------------------------------------------------------
  await prisma.auditoriaLog.createMany({
    data: [
      {
        usuarioId: superAdmin.id,
        accion: 'CREAR_ESTRUCTURA_PLANTA',
        tablaAfectada: 'plantas',
        registroId: BigInt(plantasPorCodigo['1000'].id),
        datosNuevos: { codigo: '1000', nombre: 'Planta de Extrusión' },
        ipOrigen: '127.0.0.1',
        creadoEn: hace(30)
      },
      {
        usuarioId: supervisor.id,
        accion: 'APROBAR_INSPECCION',
        tablaAfectada: 'inspecciones',
        registroId: inspeccionAprobada ? inspeccionAprobada.inspeccion.id : BigInt(1),
        datosPrevios: { estadoInspeccion: 'PENDIENTE' },
        datosNuevos: { estadoInspeccion: 'APROBADO' },
        ipOrigen: '192.168.1.20',
        creadoEn: hace(11)
      },
      {
        usuarioId: tecnicoExtrusion.id,
        accion: 'REGISTRAR_RUTINA_LUBRICACION',
        tablaAfectada: 'rutinas_lubricacion',
        registroId: BigInt(1),
        datosNuevos: { tipo: 'LUBRICACION', equipo: '1000GEN00001' },
        ipOrigen: '192.168.1.35',
        creadoEn: hace(4)
      }
    ]
  })
  console.log('   · Registros de auditoría creados: 3')

  console.log('\n✅ Seed completado exitosamente.\n')
  console.log('   Credenciales de acceso:')
  console.log('   ┌──────────────────────────┬──────────────────┬────────────────────────────────────────────┐')
  console.log('   │ Usuario                  │ Contraseña       │ Rol / Alcance                              │')
  console.log('   ├──────────────────────────┼──────────────────┼────────────────────────────────────────────┤')
  console.log('   │ admin.tubrica            │ tubrica.2026     │ Super Admin (Todas las plantas)            │')
  console.log('   │ admin.extrusion          │ tubrica.2026     │ Admin Planta (Extrusión)                   │')
  console.log('   │ admin.inyeccion          │ tubrica.2026     │ Admin Planta (Inyección)                   │')
  console.log('   │ admin.mezcla             │ tubrica.2026     │ Admin Planta (Mezcla)                      │')
  console.log('   │ supervisor               │ tubrica.2026     │ Supervisor (Extrusión / Global)            │')
  console.log('   │ supervisor.inyeccion     │ tubrica.2026     │ Supervisor (Inyección)                     │')
  console.log('   │ tecnico.extrusion        │ tubrica.2026     │ Técnico (Extrusión)                        │')
  console.log('   │ tecnico.inyeccion        │ tubrica.2026     │ Técnico (Inyección)                        │')
  console.log('   │ tecnico.mezcla           │ tubrica.2026     │ Técnico (Mezcla)                           │')
  console.log('   └──────────────────────────┴──────────────────┴────────────────────────────────────────────┘\n')
}

// ─── Punto de entrada ────────────────────────────────────────────────────────
;(async () => {
  const forzar = process.argv.includes('--force')
  if (process.env.NODE_ENV === 'production' && !forzar) {
    console.error('⛔ NODE_ENV=production. El seed TRUNCA todas las tablas. Usa --force si estás seguro.')
    process.exit(1)
  }

  try {
    await main()
  } catch (error) {
    console.error('\n❌ Error durante el seed:')
    console.error(error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
})()
