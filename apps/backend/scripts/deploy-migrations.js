/**
 * =============================================================================
 * SCRIPT DE DESPLIEGUE ROBUSTO DE MIGRACIONES (PRISMA ORM 7) — SINERGY
 * =============================================================================
 * Este script ejecuta el despliegue de migraciones en entornos de staging o producción.
 * 
 * Manejo inteligente de casos de borde:
 * 1. Base de datos vacía / nueva: Ejecuta todas las migraciones en secuencia.
 * 2. Base de datos restaurada / existente (Error P3005): Si la base de datos fue
 *    poblada mediante un backup (ej. Sinergy_produccion_backup.sql) y carece de la
 *    tabla _prisma_migrations, aplica automáticamente la línea base (baseline)
 *    marcando '20260916120000_db_produccion_inicial' como aplicada, evitando la
 *    falla del despliegue y permitiendo migraciones incrementales futuras.
 * =============================================================================
 */

const { execSync } = require('child_process');
const path = require('path');

const MIGRACION_INICIAL = '20260916120000_db_produccion_inicial';
const BACKEND_DIR = path.resolve(__dirname, '..');

console.log('[deploy-migrations] Iniciando verificacion y despliegue de migraciones Prisma...');

function ejecutarComando(comando, descripcion) {
  try {
    return {
      exito: true,
      salida: execSync(comando, {
        cwd: BACKEND_DIR,
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe'],
      }),
    };
  } catch (error) {
    return {
      exito: false,
      salida: (error.stdout || '') + '\n' + (error.stderr || '') + '\n' + (error.message || ''),
    };
  }
}

// 1. Intentar despliegue directo de migraciones
const intentoDeploy = ejecutarComando('npx prisma migrate deploy', 'Despliegue directo');

if (intentoDeploy.exito) {
  console.log(intentoDeploy.salida);
  console.log('[deploy-migrations] Migraciones desplegadas exitosamente.');
  process.exit(0);
}

// 2. Analizar si el fallo se debe a esquema no vacio (Error P3005 - Baseline requerido)
const esErrorP3005 =
  intentoDeploy.salida.includes('P3005') ||
  intentoDeploy.salida.includes('The database schema is not empty');

if (esErrorP3005) {
  console.warn(`[deploy-migrations] Aviso P3005 detectado: La base de datos ya contiene tablas (restauracion de backup o BD preexistente).`);
  console.log(`[deploy-migrations] Aplicando baseline para la migracion inicial consolidada '${MIGRACION_INICIAL}'...`);

  const intentoBaseline = ejecutarComando(
    `npx prisma migrate resolve --applied ${MIGRACION_INICIAL}`,
    'Aplicar baseline'
  );

  if (!intentoBaseline.exito) {
    console.error('[deploy-migrations] Error critico al aplicar baseline:');
    console.error(intentoBaseline.salida);
    process.exit(1);
  }

  console.log(intentoBaseline.salida);
  console.log(`[deploy-migrations] Baseline registrado correctamente.`);

  // 3. Re-ejecutar migrate deploy para asegurar consistencia y aplicar posibles migraciones posteriores
  console.log('[deploy-migrations] Re-ejecutando prisma migrate deploy tras el baseline...');
  const reintentoDeploy = ejecutarComando('npx prisma migrate deploy', 'Reintento post-baseline');

  if (!reintentoDeploy.exito) {
    console.error('[deploy-migrations] Error al desplegar migraciones posteriores al baseline:');
    console.error(reintentoDeploy.salida);
    process.exit(1);
  }

  console.log(reintentoDeploy.salida);
  console.log('[deploy-migrations] Despliegue de migraciones completado exitosamente.');
  process.exit(0);
}

// 4. Si el error no es P3005, es un error genuino de conexion o configuracion
console.error('[deploy-migrations] Fallo en el despliegue de migraciones:');
console.error(intentoDeploy.salida);
process.exit(1);
