# Pasos para actualizar el mono repo en el servidor

```powershell
# 1. Detener la aplicacion en el visro de eventos

# 2. Descargar los últimos cambios desde la rama main
git fetch origin main
git pull origin main

# 3. Instalar o sincronizar dependencias del monorepositorio
pnpm install --frozen-lockfile

# 4. Regenerar el cliente de Prisma ORM
pnpm run db:generate

# 5. Compilar Frontend (Vite) y Backend (TypeScript) para producción
pnpm run build

# 6. Volver a iniciar desde el visor de eventos
```