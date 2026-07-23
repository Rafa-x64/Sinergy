# Guía de Configuración — Sinergy

Instrucciones paso a paso para instalar, configurar y poner en marcha el sistema desde cero en un entorno local de desarrollo.

## Tabla de Contenidos

- [Requisitos del sistema](#1-requisitos-del-sistema)
- [Clonar el repositorio](#2-clonar-el-repositorio)
- [Instalar dependencias](#3-instalar-dependencias)
- [Configurar variables de entorno](#4-configurar-variables-de-entorno)
- [Configurar la base de datos](#5-configurar-la-base-de-datos)
- [Ejecutar las migraciones](#6-ejecutar-las-migraciones)
- [Arrancar el sistema](#7-arrancar-el-sistema)
- [Verificar la instalación](#8-verificar-la-instalación)
- [Extensiones recomendadas de VS Code](#9-extensiones-recomendadas-de-vs-code)
- [Solución de problemas comunes](#10-solución-de-problemas-comunes)

---

## 1. Requisitos del Sistema

Instala las siguientes herramientas antes de continuar. Verifica cada una ejecutando el comando de verificación.

| Herramienta | Versión mínima | Comando de verificación | Descarga |
|---|---|---|---|
| **Node.js** | 20.x LTS | `node -v` | [nodejs.org](https://nodejs.org) |
| **pnpm** | 8.x | `pnpm -v` | `npm install -g pnpm` |
| **PostgreSQL** | 14.x | `psql --version` | [postgresql.org](https://www.postgresql.org/download/) |
| **Git** | cualquiera | `git --version` | [git-scm.com](https://git-scm.com) |

> [!NOTE]
> En Windows puedes instalar PostgreSQL con el instalador oficial o usar [EDB PostgreSQL](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads). Asegúrate de anotar la contraseña del usuario `postgres` durante la instalación.

---

## 2. Clonar el Repositorio

```powershell
git clone <url-del-repositorio-privado>
cd Sinergy
```

Si es la primera vez que configuras Git con este repositorio:

```powershell
git config user.name "Tu Nombre"
git config user.email "tu@email.com"
```

---

## 3. Instalar Dependencias

Desde la **raíz del monorepo** (donde está `pnpm-workspace.yaml`):

```powershell
pnpm install --ignore-scripts
```

Este comando instala las dependencias de los tres workspaces (`raíz`, `@sinergy/frontend`, `@sinergy/backend`) en un solo paso. La flag `--ignore-scripts` es necesaria para evitar el error `ERR_PNPM_IGNORED_BUILDS`.

Verifica que la instalación fue correcta:

```powershell
pnpm list --depth=0 --filter @sinergy/frontend
pnpm list --depth=0 --filter @sinergy/backend
```

---

## 4. Configurar Variables de Entorno

### Frontend

Crea el archivo `apps/frontend/.env` copiando el ejemplo:

```powershell
Copy-Item apps\frontend\.env.example apps\frontend\.env
```

Contenido del archivo `.env` del frontend:

```env
# URL base de la API del backend (incluye /api)
VITE_API_URL=http://localhost:3000/api

# Nombre de la aplicación
VITE_APP_NAME=Sinergy
```

### Backend

El archivo `apps/backend/.env` ya fue creado con `prisma init`. Édita la variable `DATABASE_URL` con tus credenciales reales:

```env
# Formato: postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_DB
DATABASE_URL="postgresql://postgres:tu_password_aqui@localhost:5432/sinergy_db"

# Puerto del servidor Express
PORT=3000

# Entorno
NODE_ENV=development
```

> [!CAUTION]
> Nunca subas archivos `.env` al repositorio. El `.gitignore` ya los excluye. Antes de hacer un `git add .`, ejecuta `git status` y verifica que no aparecen los `.env`.

---

## 5. Configurar la Base de Datos

Primero, crea la base de datos en PostgreSQL. Puedes hacerlo desde la terminal o desde pgAdmin:

### Opción A — Desde PowerShell (psql)

```powershell
psql -U postgres -c "CREATE DATABASE sinergy_db;"
```

Si pide contraseña, ingresa la que configuraste al instalar PostgreSQL.

### Opción B — Desde pgAdmin

1. Abre pgAdmin y conéctate al servidor local.
2. Haz clic derecho en `Databases` → `Create` → `Database`.
3. Nombre: `sinergy_db`. Guarda.

---

## 6. Ejecutar las Migraciones

Una vez que la base de datos existe y `DATABASE_URL` está correctamente configurado:

```powershell
# Desde la raíz del monorepo
cd apps\backend
npx prisma migrate dev --name init
```

Esto:
1. Lee el `schema.prisma` y genera el SQL de las migraciones.
2. Aplica las migraciones a `sinergy_db`.
3. Genera el cliente TypeScript de Prisma (`@prisma/client`).

Verifica que las tablas fueron creadas:

```powershell
npx prisma studio
```

Esto abre Prisma Studio en `http://localhost:5555`, donde puedes navegar visualmente por las tablas.

> [!IMPORTANT]
> Vuelve a la raíz del monorepo cuando termines: `cd ..\..`

---

## 7. Arrancar el Sistema

### Desarrollo (ambos a la vez — recomendado)

```powershell
# Desde la raíz del monorepo
pnpm dev
```

Frontend y backend se inician en paralelo:
- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:3000`

### Desarrollo (por separado)

```powershell
# Solo el frontend
pnpm dev:frontend

# Solo el backend
pnpm dev:backend
```

### Producción

```powershell
# Compilar ambos proyectos
pnpm build

# El frontend compilado queda en: apps/frontend/dist/
# El backend compilado queda en: apps/backend/dist/

# Iniciar el backend compilado
pnpm --filter @sinergy/backend start
```

---

## 8. Verificar la Instalación

Comprueba que todo funciona antes de empezar a desarrollar:

### Backend

Abre un navegador o usa PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Respuesta esperada:
```json
{ "status": "ok", "message": "Sinergy Backend running", "db": "connected" }
```

### Frontend

Abre `http://localhost:5173` en el navegador. Debe cargar la aplicación sin errores en la consola del navegador (F12).

### Build de verificación

Para confirmar que el código compila sin errores de TypeScript:

```powershell
pnpm --filter @sinergy/backend build
pnpm --filter @sinergy/frontend build
```

Ambos deben completarse sin errores.

---

## 9. Extensiones Recomendadas de VS Code

Instala las siguientes extensiones para una experiencia de desarrollo óptima:

| Extensión | ID | Para qué sirve |
|---|---|---|
| Volar (Vue - Official) | `Vue.volar` | Soporte completo para Vue 3 y TypeScript |
| Prisma | `Prisma.prisma` | Syntax highlighting y autocompletado del schema |
| ESLint | `dbaeumer.vscode-eslint` | Linting en tiempo real |
| Prettier | `esbenp.prettier-vscode` | Formateo automático de código |
| GitLens | `eamodio.gitlens` | Historial de Git integrado en el editor |
| Thunder Client | `rangav.vscode-thunder-client` | Cliente HTTP para probar la API sin salir de VS Code |
| Error Lens | `usernamehw.errorlens` | Muestra los errores TypeScript inline |

Para instalarlas todas de una vez, abre la paleta de comandos (`Ctrl+Shift+P`) y ejecuta:

```
Extensions: Show Recommended Extensions
```

> [!TIP]
> Volar reemplaza a Vetur para Vue 3. Si tienes Vetur instalado, desactívalo para evitar conflictos.

---

## 10. Solución de Problemas Comunes

### `ERR_PNPM_IGNORED_BUILDS` al instalar

**Causa:** pnpm bloquea scripts de compilación nativa por seguridad.
**Solución:** Usa siempre `pnpm install --ignore-scripts`. Los paquetes que lo necesitan ya están en `pnpm.ignoredBuiltDependencies` del `package.json` raíz.

---

### `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Causa:** PostgreSQL no está corriendo.
**Solución en Windows:**
```powershell
# Verificar si el servicio está activo
Get-Service postgresql*

# Iniciarlo si está detenido
Start-Service postgresql-x64-14
```

---

### `PrismaClientInitializationError: Can't reach database server`

**Causa:** La `DATABASE_URL` en `apps/backend/.env` es incorrecta.
**Solución:** Verifica usuario, contraseña, host y nombre de la base de datos. Prueba la conexión con:
```powershell
psql -U postgres -d sinergy_db -c "SELECT 1;"
```

---

### `Command "dev" not found` o `Missing script: dev`

**Causa:** Estás ejecutando `pnpm dev` desde dentro de un workspace (`apps/frontend` o `apps/backend`) en lugar de la raíz.
**Solución:** Siempre ejecuta los scripts globales desde `c:\xampp\htdocs\Sinergy\`.

---

### El frontend compila pero la pantalla está en blanco

**Causa más común:** Error de JavaScript en `main.ts` (plugin mal registrado o importación incorrecta).
**Diagnóstico:** Abre las DevTools del navegador (`F12`) → pestaña `Console`. El error estará ahí.

---

### `vite: command not found` al ejecutar `pnpm dev:frontend`

**Causa:** Las dependencias del frontend no están instaladas.
**Solución:**
```powershell
pnpm install --ignore-scripts --filter @sinergy/frontend
```

---

### `Error: listen EADDRINUSE: address already in use :::3000`

**Causa:** Ya existe una instancia previa del backend u otro proceso ocupando el puerto 3000.
**Diagnóstico y Solución:**
1. Identifica el ID de proceso (`PID`) escuchando en el puerto:
```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess, State
```
2. Finaliza el proceso colgado:
```powershell
taskkill /F /PID <PID>
```
3. Opcionalmente, cambia la variable `PORT` en `apps/backend/.env` si necesitas ejecutar el servidor en un puerto alternativo.

