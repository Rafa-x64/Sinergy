/**
 * PM2 Ecosystem Config — Sinergy Production
 *
 * Uso:
 *   pm2 start ecosystem.config.cjs    → iniciar
 *   pm2 save                          → persistir lista de procesos
 *   pm2 startup                       → generar comando de arranque automático al boot
 *   pm2 stop sinergy-backend          → detener
 *   pm2 logs sinergy-backend          → ver logs en tiempo real
 */
module.exports = {
  apps: [
    {
      name: 'sinergy-backend',
      script: './apps/backend/dist/index.js',
      cwd: __dirname,

      // Reiniciar automáticamente si el proceso cae
      autorestart: true,

      // No usar watch en producción (eso es para dev)
      watch: false,

      // Variables de entorno de producción
      env_production: {
        NODE_ENV: 'production',
      },

      // Logs separados por fecha para facilitar debugging
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      merge_logs: true,
      time: true,

      // Límite de memoria antes de reiniciar el proceso
      max_memory_restart: '500M',
    },
  ],
}
