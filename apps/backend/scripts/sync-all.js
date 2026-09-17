require('dotenv').config()
const { variableCriticaService } = require('../dist/src/modules/variables-criticas/variable-critica.service')
const prisma = require('../dist/src/core/prisma').default

async function main() {
  console.log('--- INICIANDO SINCRONIZACIÓN DE TODOS LOS TIPOS DE EQUIPO ---')

  const tipos = await prisma.tipoEquipo.findMany({
    where: {
      equipos: { some: {} }
    },
    orderBy: { nombre: 'asc' }
  })

  for (const tipo of tipos) {
    console.log(`\nSincronizando: ${tipo.nombre} (ID: ${tipo.id})...`)
    const res = await variableCriticaService.sincronizarTipoEquipoCompleto(tipo.id)
    console.log(`  Equipos: ${res.totalEquipos}, Componentes sincronizados: ${res.totalComponentesSincronizados}`)
  }

  // Comprobar Acampanadora
  const acampanadora = await prisma.tipoEquipo.findFirst({
    where: { nombre: { contains: 'Acampanadora', mode: 'insensitive' } },
    include: {
      plantillas: { where: { activa: true } },
      _count: { select: { plantillas: true } }
    }
  })

  console.log(`\n========================================`)
  console.log(`RESULTADO FINAL ACAMPANADORA:`)
  console.log(`Total Plantillas Activas en BD: ${acampanadora.plantillas.length}`)
  console.log(`========================================`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
