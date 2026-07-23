import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './prisma';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';

const app = express();

// Middlewares de seguridad y parseo
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173']
}));
app.use(express.json());

// ─── Rutas base de la API ─────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    name: 'Sinergy API Backend',
    version: '1.0',
    status: 'online',
    healthCheck: '/api/health'
  });
});

app.get('/api/health', async (_req, res, next) => {
  try {
    // Verificamos conexión a la BD en el health check
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Sinergy Backend running', db: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/version', (_req, res, next) => {
  try {
    res.json({ status: 'ok', message: 'Version 1.0' });
  } catch (error) {
    next(error);
  }
});

// ─── Módulos de funcionalidades ───────────────────────────────────────────────
// Aquí se registrarán las rutas de cada módulo a medida que se desarrollen:
// app.use('/api/auth',        authRoutes);
// app.use('/api/equipment',   equipmentRoutes);
// app.use('/api/maintenance', maintenanceRoutes);

// Manejo de rutas no encontradas y errores globales (deben ir al final)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
