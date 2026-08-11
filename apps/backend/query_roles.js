const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const roles = await p.rol.findMany()
  console.log('=== ROLES ===')
  console.log(JSON.stringify(roles, null, 2))
  const usuarios = await p.usuario.findMany({
    include: { rolesUsuario: { include: { rol: true } } }
  })
  console.log('=== USUARIOS Y SUS ROLES ===')
  usuarios.forEach(u => {
    console.log(`${u.nombreUsuario} (${u.email}): ${u.rolesUsuario.map(r => r.rol.nombre).join(', ') || 'SIN ROL'}`)
  })
}
main().finally(() => p.$disconnect())
