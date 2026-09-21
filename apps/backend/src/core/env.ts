import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Posibles ubicaciones de .env dependiendo del runtime (ts-node, node dist, cwd root o cwd apps/backend)
const possiblePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/backend/.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
]

for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}
