import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './infrastructure/middlewares/errorHandler';
import { notFoundHandler } from './infrastructure/middlewares/notFoundHandler';
import prisma from './infrastructure/prisma/prismaClient';

const app = express();
const port = process.env.PORT || 3000;

// Middlewares de seguridad y parseo
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rutas de la API
app.get('/api/health', async (req, res, next) => {
  try {
    // Verificamos conexión a DB en el health check
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Backend DDD-Lite running', db: 'connected' });
  } catch (error) {
    next(error);
  }
});

// Manejo de rutas no encontradas y errores globales
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`\n\x1b[36m🚀 [Sinergy Backend]\x1b[0m \x1b[32mEscuchando en http://localhost:${port}\x1b[0m`);
});

// Manejo de cierres gráciles (Graceful Shutdown)
const gracefulShutdown = async () => {
  console.log('\n\x1b[33m[!] Cerrando el servidor de forma segura (Graceful Shutdown)...\x1b[0m');
  await prisma.$disconnect();
  server.close(() => {
    console.log('\x1b[31m[x] Servidor HTTP cerrado correctamente.\x1b[0m\n');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
