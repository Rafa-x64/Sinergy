import 'dotenv/config';
import httpServer from './core/server';
import prisma from './core/prisma';

const port = process.env.PORT ?? 3000;

const server = httpServer.listen(port, () => {
  console.log(`\n\x1b[36m🚀 [Sinergy Backend]\x1b[0m \x1b[32mEscuchando en http://localhost:${port}\x1b[0m`);
});

// Captura errores del servidor HTTP en el momento del bind (ej. puerto ocupado)
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `\n\x1b[31m[FATAL] Puerto ${port} ya está en uso.\x1b[0m\n` +
      `  → Cambia el puerto en apps/backend/.env: PORT=<otro_puerto>\n`
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
