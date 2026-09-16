/**
 * =============================================================================
 * SCRIPT DE DESPLIEGUE ROBUSTO DE MIGRACIONES (PRISMA ORM 7) — SINERGY
 * =============================================================================
 * Flujo para dos escenarios:
 *
 * A) BD nueva/vacía:
 *    prisma migrate deploy → aplica todas las migraciones → éxito.
 *
 * B) BD existente con datos pero sin tabla _prisma_migrations (ej. servidor APL
 *    restaurado desde backup o BD preexistente):
 *    prisma migrate deploy → falla P3005 → baseline automático de la migración
 *    inicial consolidada → re-deploy → éxito.
 *
 * Por qué --config: Prisma 7 requiere que le indiquemos explícitamente el
 * archivo de configuración cuando se ejecuta desde un script Node.js fuera del
 * directorio raíz del proyecto. Sin esto, prisma.config.ts no se carga y la
 * construcción de la DATABASE_URL con encodeURIComponent no ocurre.
 * =============================================================================
 */

'use strict'

const { execSync } = require('child_process')
const path = require('path')

const BACKEND_DIR = path.resolve(__dirname, '..')

// Carga el .env del backend antes de leer process.env.
// Sin esto, las variables no están disponibles cuando el script corre con `node`.
require('dotenv').config({ path: path.join(BACKEND_DIR, '.env') })

const MIGRACION_INICIAL = '20260916120000_db_produccion_inicial'
const PRISMA_CONFIG = path.join(BACKEND_DIR, 'prisma.config.ts')

// ─── Validación anticipada de variables de entorno ───────────────────────────
// Fallamos aquí con mensaje claro, antes de que Prisma lo intente y devuelva
// un error de conexión genérico que es difícil de diagnosticar.
const VARIABLES_REQUERIDAS = ['DATABASE_URL']
const variablesFaltantes = VARIABLES_REQUERIDAS.filter(v => !process.env[v])

if (variablesFaltantes.length > 0) {
  console.error('[deploy-migrations] FALLO: Las siguientes variables de entorno son obligatorias:')
  variablesFaltantes.forEach(v => console.error(`  - ${v}`))
  console.error('[deploy-migrations] Asegurate de que el archivo .env existe en apps/backend/ y esta correctamente configurado.')
  process.exit(1)
}

console.log('[deploy-migrations] Variables de entorno validadas. Iniciando despliegue de migraciones Prisma...')
console.log(`[deploy-migrations] BD objetivo: ${process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@')}`)

// ─── Utilidad de ejecución de comandos ───────────────────────────────────────
function ejecutarComando(comando) {
  try {
    return {
      exito: true,
      salida: execSync(comando, {
        cwd: BACKEND_DIR,
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env },
      }),
    }
  } catch (error) {
    return {
      exito: false,
      salida: (error.stdout || '') + '\n' + (error.stderr || '') + '\n' + (error.message || ''),
    }
  }
}

// ─── Paso 1: Intento directo de migrate deploy ───────────────────────────────
const intentoDeploy = ejecutarComando(`npx prisma migrate deploy --config "${PRISMA_CONFIG}"`)

if (intentoDeploy.exito) {
  console.log(intentoDeploy.salida)
  console.log('[deploy-migrations] Migraciones desplegadas exitosamente.')
  process.exit(0)
}

// ─── Paso 2: Detectar P3005 (BD con esquema preexistente sin _prisma_migrations) ──
const esErrorP3005 =
  intentoDeploy.salida.includes('P3005') ||
  intentoDeploy.salida.includes('The database schema is not empty')

if (esErrorP3005) {
  console.warn('[deploy-migrations] Detectado P3005: La BD ya contiene tablas (restauracion de backup o BD preexistente).')
  console.log(`[deploy-migrations] Aplicando baseline para la migracion consolidada '${MIGRACION_INICIAL}'...`)

  const intentoBaseline = ejecutarComando(
    `npx prisma migrate resolve --applied "${MIGRACION_INICIAL}" --config "${PRISMA_CONFIG}"`
  )

  if (!intentoBaseline.exito) {
    console.error('[deploy-migrations] Error critico al aplicar baseline:')
    console.error(intentoBaseline.salida)
    process.exit(1)
  }

  console.log(intentoBaseline.salida)
  console.log('[deploy-migrations] Baseline registrado. Re-ejecutando migrate deploy...')

  // ─── Paso 3: Re-deploy post-baseline para aplicar migraciones incrementales ──
  const reintentoDeploy = ejecutarComando(`npx prisma migrate deploy --config "${PRISMA_CONFIG}"`)

  if (!reintentoDeploy.exito) {
    console.error('[deploy-migrations] Error al desplegar migraciones post-baseline:')
    console.error(reintentoDeploy.salida)
    process.exit(1)
  }

  console.log(reintentoDeploy.salida)
  console.log('[deploy-migrations] Despliegue de migraciones completado exitosamente.')
  process.exit(0)
}

// ─── Paso 4: Error genuino (conexion, credenciales, network) ─────────────────
console.error('[deploy-migrations] Fallo en el despliegue. Salida completa del error:')
console.error(intentoDeploy.salida)
console.error('\n[deploy-migrations] Posibles causas:')
console.error('  1. El host/puerto de la BD no es accesible desde esta maquina.')
console.error('  2. Las credenciales en .env son incorrectas.')
console.error('  3. La base de datos especificada en DB_NAME no existe en el servidor.')
process.exit(1)
