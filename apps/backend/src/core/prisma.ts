import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD ?? '');
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`;

// Garantiza que DATABASE_URL esté disponible para el schema de Prisma en runtime
process.env.DATABASE_URL = connectionString;

// Pool de conexiones usando `pg` con URL construida desde variables de entorno
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Singleton: evita crear múltiples conexiones
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

export default prisma;
