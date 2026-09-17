require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD ?? '')
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`

process.env.DATABASE_URL = connectionString

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const tipo = await prisma.tipoEquipo.findFirst({
    where: { nombre: { contains: 'Acampanadora', mode: 'insensitive' } }
  })

  if (!tipo) {
    console.log('No se encontró el tipo de equipo Acampanadora')
    return
  }

  console.log(`Tipo de Equipo encontrado: ID ${tipo.id} - ${tipo.nombre}`)

  // Plantillas
  const plantillas = await prisma.plantillaVariable.findMany({
    where: { tipoEquipoId: tipo.id },
    include: {
      opcionesSeleccion: true,
      _count: { select: { variablesInstancia: true } }
    },
    orderBy: { id: 'asc' }
  })

  console.log(`Total de plantillas registradas para ${tipo.nombre}: ${plantillas.length}`)

  // Agrupar por (nombre + nombreComponente)
  const grupos = new Map()
  for (const p of plantillas) {
    const compKey = (p.nombreComponente || 'GLOBAL').trim().toUpperCase()
    const varKey = p.nombre.trim().toUpperCase()
    const key = `${compKey} || ${varKey}`
    if (!grupos.has(key)) {
      grupos.set(key, [])
    }
    grupos.get(key).push(p)
  }

  let totalDuplicados = 0
  console.log('\n--- GRUPOS CON DUPLICADOS EN PLANTILLAS ---')
  for (const [key, lista] of grupos.entries()) {
    if (lista.length > 1) {
      console.log(`\nClave: [${key}] -> ${lista.length} plantillas:`)
      lista.forEach(p => {
        console.log(`  - ID: ${p.id}, activa: ${p.activa}, tipoEval: ${p.tipoEvaluacion}, instancias: ${p._count.variablesInstancia}, opciones: ${p.opcionesSeleccion.length}`)
      })
      totalDuplicados += (lista.length - 1)
    }
  }

  console.log(`\n========================================`)
  console.log(`Total de plantillas en BD: ${plantillas.length}`)
  console.log(`Total plantillas redundantes/duplicadas: ${totalDuplicados}`)
  console.log(`Plantillas únicas si se deduplica: ${grupos.size}`)
  console.log(`========================================`)

  // Equipos y variables en componentes
  const equipos = await prisma.equipo.findMany({
    where: { tipoEquipoId: tipo.id },
    include: {
      componentes: {
        include: {
          variables: {
            include: {
              _count: { select: { inspeccionDetalles: true } }
            }
          }
        }
      }
    }
  })

  let totalVariables = 0
  let totalVariablesDuplicadas = 0
  for (const eq of equipos) {
    console.log(`\nEquipo: ${eq.codigo} - ${eq.nombre} (${eq.componentes.length} componentes)`)
    for (const comp of eq.componentes) {
      totalVariables += comp.variables.length
      const mapVars = new Map()
      for (const v of comp.variables) {
        const k = v.nombre.trim().toUpperCase()
        if (!mapVars.has(k)) mapVars.set(k, [])
        mapVars.get(k).push(v)
      }
      for (const [k, lista] of mapVars.entries()) {
        if (lista.length > 1) {
          console.log(`  Componente [${comp.nombre}] -> Variable duplicada "${k}" (${lista.length} veces):`)
          lista.forEach(v => {
            console.log(`    - Var ID: ${v.id}, activa: ${v.activa}, plantillaId: ${v.plantillaId}, inspecciones: ${v._count.inspeccionDetalles}`)
          })
          totalVariablesDuplicadas += (lista.length - 1)
        }
      }
    }
  }

  console.log(`\n========================================`)
  console.log(`Total variables en componentes para ${tipo.nombre}: ${totalVariables}`)
  console.log(`Total variables redundantes en componentes: ${totalVariablesDuplicadas}`)
  console.log(`========================================`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
