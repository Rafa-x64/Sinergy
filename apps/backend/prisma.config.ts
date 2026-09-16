import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Validación anticipada: falla con mensaje claro antes de llegar a Prisma.
// La contraseña puede contener caracteres especiales (#, @, !) — encodeURIComponent
// los neutraliza correctamente para la URL. DB_PASSWORD DEBE ir entre comillas
// dobles en el archivo .env para que dotenv la lea correctamente.
const requerir = (nombre: string): string => {
  const valor = process.env[nombre]
  if (!valor) {
    console.error(`[prisma.config] ERROR: La variable de entorno '${nombre}' es obligatoria y no está definida.`)
    console.error(`[prisma.config] Asegúrate de que el archivo .env existe en apps/backend/ y contiene '${nombre}'.`)
    process.exit(1)
  }
  return valor
}

const construirDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const host     = requerir('DB_HOST')
  const port     = requerir('DB_PORT')
  const user     = requerir('DB_USER')
  const password = requerir('DB_PASSWORD')
  const name     = requerir('DB_NAME')

  const encodedPassword = encodeURIComponent(password)
  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${name}?schema=public`
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: construirDatabaseUrl(),
  },
})
