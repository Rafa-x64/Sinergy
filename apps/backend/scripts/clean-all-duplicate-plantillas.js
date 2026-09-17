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
  console.log('--- INICIANDO SANEAMIENTO Y ELIMINACIÓN DE PLANTILLAS DUPLICADAS ---')

  const tipos = await prisma.tipoEquipo.findMany({
    include: {
      plantillas: {
        include: {
          opcionesSeleccion: true,
          _count: { select: { variablesInstancia: true } }
        },
        orderBy: { id: 'asc' }
      }
    },
    orderBy: { nombre: 'asc' }
  })

  let totalPlantillasEliminadas = 0
  const tiposAfectadosIds = new Set()

  for (const tipo of tipos) {
    const grupos = new Map()

    for (const p of tipo.plantillas) {
      const compKey = (p.nombreComponente || 'GLOBAL').trim().toUpperCase()
      const varKey = p.nombre.trim().toUpperCase()
      const key = `${compKey} || ${varKey}`
      if (!grupos.has(key)) grupos.set(key, [])
      grupos.get(key).push(p)
    }

    for (const [key, lista] of grupos.entries()) {
      if (lista.length > 1) {
        tiposAfectadosIds.add(tipo.id)

        // Elegir canónica: la que tenga más variables de instancia, o si empatan, la de menor ID
        lista.sort((a, b) => {
          if (b._count.variablesInstancia !== a._count.variablesInstancia) {
            return b._count.variablesInstancia - a._count.variablesInstancia
          }
          return a.id - b.id
        })

        const canonica = lista[0]
        const duplicadas = lista.slice(1)

        console.log(`\nTipo [${tipo.nombre}]: Conservando Plantilla Canónica ID ${canonica.id} para [${key}] (${canonica._count.variablesInstancia} instancias)`)

        for (const dup of duplicadas) {
          console.log(`  - Re-enlazando variables de Plantilla ID ${dup.id} a ID ${canonica.id}...`)

          // 1. Re-enlazar variables hijas
          await prisma.variable.updateMany({
            where: { plantillaId: dup.id },
            data: { plantillaId: canonica.id }
          })

          // 2. Eliminar opciones de la plantilla duplicada
          await prisma.plantillaOpcionSeleccion.deleteMany({
            where: { plantillaId: dup.id }
          })

          // 3. Eliminar la plantilla duplicada
          await prisma.plantillaVariable.delete({
            where: { id: dup.id }
          })

          totalPlantillasEliminadas++
          console.log(`  - Plantilla duplicada ID ${dup.id} eliminada exitosamente.`)
        }
      }
    }
  }

  console.log(`\n======================================================`)
  console.log(`Total de plantillas duplicadas eliminadas: ${totalPlantillasEliminadas}`)
  console.log(`Tipos de equipo afectados: ${tiposAfectadosIds.size}`)
  console.log(`======================================================`)

  // Sincronizar todos los tipos de equipo afectados
  console.log('\n--- SINCRONIZANDO COMPONENTES DE TIPOS AFECTADOS ---')
  const { variableCriticaService } = require('../dist/modules/variables-criticas/variable-critica.service')

  for (const tipoId of tiposAfectadosIds) {
    const tipoObj = tipos.find(t => t.id === tipoId)
    console.log(`Sincronizando flota de: ${tipoObj ? tipoObj.nombre : tipoId}...`)
    const res = await variableCriticaService.sincronizarTipoEquipoCompleto(tipoId)
    console.log(`  Resultado: ${res.totalEquipos} equipos, ${res.totalComponentesSincronizados} componentes sincronizados.`)
  }

  console.log('\n--- SANEAMIENTO COMPLETADO EXITOSAMENTE ---')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
