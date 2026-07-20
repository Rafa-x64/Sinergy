import { PrismaClient } from '@prisma/client'

// Singleton: evita crear múltiples conexiones durante el desarrollo con hot-reload
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error']
})

export default prisma
