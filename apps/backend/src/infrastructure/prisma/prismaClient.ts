import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

// Configuración del pool de conexiones usando `pg`
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Singleton: evita crear múltiples conexiones
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error']
});

export default prisma;
