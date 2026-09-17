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

  let totalPlantillasGlobal = 0
  let totalDuplicadosGlobal = 0

  for (const tipo of tipos) {
    totalPlantillasGlobal += tipo.plantillas.length
    const grupos = new Map()
    for (const p of tipo.plantillas) {
      const compKey = (p.nombreComponente || 'GLOBAL').trim().toUpperCase()
      const varKey = p.nombre.trim().toUpperCase()
      const key = `${compKey} || ${varKey}`
      if (!grupos.has(key)) grupos.set(key, [])
      grupos.get(key).push(p)
    }

    let dupsTipo = 0
    for (const [key, lista] of grupos.entries()) {
      if (lista.length > 1) {
        dupsTipo += (lista.length - 1)
      }
    }

    if (dupsTipo > 0) {
      console.log(`Tipo [${tipo.id}] ${tipo.nombre}: ${tipo.plantillas.length} plantillas -> ${dupsTipo} duplicadas (únicas: ${grupos.size})`)
      totalDuplicadosGlobal += dupsTipo
    }
  }

  console.log(`\nTOTAL PLANTILLAS EN EL SISTEMA: ${totalPlantillasGlobal}`)
  console.log(`TOTAL PLANTILLAS DUPLICADAS A ELIMINAR: ${totalDuplicadosGlobal}`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
