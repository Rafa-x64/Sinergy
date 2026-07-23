import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './infrastructure/middlewares/errorHandler';
import { notFoundHandler } from './infrastructure/middlewares/notFoundHandler';
import prisma from './infrastructure/prisma/prismaClient';

const app = express();
const port = process.env.PORT;

// Middlewares de seguridad y parseo
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173']
}));
app.use(express.json());

// Rutas de la API
app.get('/', (req, res) => {
  res.json({
    name: 'Sinergy API Backend',
    version: '1.0',
    status: 'online',
    healthCheck: '/api/health'
  });
});

app.get('/api/health', async (req, res, next) => {
  try {
    // Verificamos conexión a DB en el health check
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Backend DDD-Lite running', db: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/version', async (req, res, next) => {
  try{
    res.json({
      status: 'ok', message: 'Version 1.0'
    })
  }catch(error){
    next(error)
  }
})

// Manejo de rutas no encontradas y errores globales
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`\n\x1b[36m🚀 [Sinergy Backend]\x1b[0m \x1b[32mEscuchando en http://localhost:${port}\x1b[0m`);
});

// Captura errores del servidor HTTP en el momento del bind (ej. puerto ocupado)
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `\n\x1b[31m[FATAL] Puerto ${port} ya está en uso.\x1b[0m\n` +
      `  → Ejecuta en PowerShell para identificar el proceso:\n` +
      `    \x1b[33mGet-NetTCPConnection -LocalPort ${port} | Select-Object OwningProcess, State\x1b[0m\n` +
      `  → Luego termínalo con:\n` +
      `    \x1b[33mtaskkill /F /PID <PID>\x1b[0m\n` +
      `  → O cambia el puerto en apps/backend/.env: PORT=<otro_puerto>\n`
    );
  } else {
    console.error(`\n\x1b[31m[FATAL] Error al iniciar el servidor: ${error.message}\x1b[0m`);
  }
  process.exit(1);
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
