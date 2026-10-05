/**
 * PM2 Ecosystem — Sinergy Production
 *
 * Comandos útiles:
 *   pm2 start ecosystem.config.cjs   → iniciar todos los servicios
 *   pm2 stop all                     → detener todos
 *   pm2 restart all                  → reiniciar todos
 *   pm2 logs                         → ver logs en tiempo real
 *   pm2 save                         → persistir lista (correr después del primer start)
 *   pm2 startup                      → generar comando de autoarranque al boot del SO
 */
module.exports = {
  apps: [
    {
      name: 'sinergy-backend',
      script: 'node',
      args: 'dist/index.js',
      cwd: './apps/backend',
      autorestart: true,
      watch: false,
      env: { NODE_ENV: 'production' },
      error_file: '../../logs/backend-error.log',
      out_file: '../../logs/backend-out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '500M',
    },
    {
      name: 'sinergy-frontend',
      script: 'node',
      args: './node_modules/.bin/vite preview',
      cwd: './apps/frontend',
      autorestart: true,
      watch: false,
      env: { NODE_ENV: 'production' },
      error_file: '../../logs/frontend-error.log',
      out_file: '../../logs/frontend-out.log',
      merge_logs: true,
      time: true,
    },
  ],
}
