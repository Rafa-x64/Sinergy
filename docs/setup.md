# Guía de Configuración — Sinergy

Instrucciones paso a paso para instalar, configurar y poner en marcha el sistema desde cero en un entorno local de desarrollo.

## Tabla de Contenidos

- [Requisitos del sistema](#1-requisitos-del-sistema)
- [Clonar el repositorio](#2-clonar-el-repositorio)
- [Instalar dependencias](#3-instalar-dependencias)
- [Configurar variables de entorno](#4-configurar-variables-de-entorno)
- [Configurar y restaurar la base de datos](#5-configurar-y-restaurar-la-base-de-datos)
- [Configurar Prisma, Generar el Cliente y Ejecutar Migraciones](#6-configurar-prisma-generar-el-cliente-y-ejecutar-migraciones)
- [Arrancar el sistema](#7-arrancar-el-sistema)
- [Verificar la instalación](#8-verificar-la-instalación)
- [Procedimiento de Despliegue y Sincronización Limpia con Main](#9-procedimiento-de-despliegue-y-sincronización-limpia-con-main)
- [Extensiones recomendadas de VS Code](#10-extensiones-recomendadas-de-vs-code)
- [Solución de problemas comunes](#11-solución-de-problemas-comunes)

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

Edita `apps/backend/.env` con las credenciales que correspondan a tu entorno.

#### Caso A — Base de datos LOCAL (`localhost`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD="tu_password_local"
DB_NAME=Sinergy_produccion

# Comentar DATABASE_URL: prisma.config.ts la construye automáticamente usando las variables anteriores
# DATABASE_URL="..."

PORT=3000
NODE_ENV=development
```

#### Caso B — Base de datos REMOTA (servidor externo en red, ej: `<IP_SERVIDOR_REMOTO>`)

```env
DB_HOST=<IP_SERVIDOR_REMOTO>
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD="<tu_password_con_especiales>"
DB_NAME=Sinergy_produccion

# En este caso SÍ se debe definir DATABASE_URL con la contraseña codificada en URL:
# Los caracteres especiales se codifican: # → %23   @ → %40   : → %3A
DATABASE_URL="postgresql://postgres:<password_url_encoded>@<IP_SERVIDOR_REMOTO>:5432/Sinergy_produccion?schema=public"

PORT=3000
NODE_ENV=development
```

> [!IMPORTANT]
> Cuando la base es remota, **siempre define `DATABASE_URL` explícitamente** con los caracteres especiales de la contraseña codificados en URL (`encodeURIComponent`). Los más comunes: `#` → `%23`, `@` → `%40`, `:` → `%3A`.
> Cuando la base es local, **comenta o elimina `DATABASE_URL`** y `prisma.config.ts` la construirá automáticamente.

> [!WARNING]
> Si la contraseña contiene `#`, `@` u otros caracteres especiales, envuelve el valor entre comillas dobles en `.env` (ej: `DB_PASSWORD="mi#clave@2026"`). De lo contrario, `dotenv` interpretará `#` como inicio de comentario y truncará la contraseña.

> [!CAUTION]
> Nunca subas archivos `.env` al repositorio. El `.gitignore` ya los excluye. Antes de hacer `git add .`, verifica con `git status` que los `.env` no aparezcan en la lista.

---

## 5. Configurar y Restaurar la Base de Datos

### 5.1 Crear la Base de Datos con Collation Correcta

> [!IMPORTANT]
> **Crear la base de datos con el collation correcto es crítico para evitar corrupción de caracteres acentuados** (ej: `é` aparece como `Ã©`). El servidor PostgreSQL de producción usa `Spanish_Venezuela.1252` como collation regional de Windows. Para garantizar que los acentos y caracteres especiales del español se almacenen y muestren correctamente en UTF-8, la base de datos **debe crearse con `LC_COLLATE='C'`** (collation neutral).

#### Opción A — Desde `psql` (Recomendada)

**En servidor LOCAL:**
```powershell
psql -U postgres -c "CREATE DATABASE Sinergy_produccion ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' TEMPLATE template0;"
```

**En servidor REMOTO (`<IP_SERVIDOR_REMOTO>`):**
```powershell
$env:PGPASSWORD='<tu_password>'; psql -h <IP_SERVIDOR_REMOTO> -p 5432 -U postgres -c "CREATE DATABASE Sinergy_produccion ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' TEMPLATE template0;"
```

#### Opción B — Desde pgAdmin

1. Abre pgAdmin y conéctate al servidor.
2. Haz clic derecho en `Databases` → `Create` → `Database`.
3. Nombre: `Sinergy_produccion`.
4. Pestaña **Definition**: Encoding → `UTF8`, Collation → `C`, Character type → `C`.
5. Guarda.

---

### 5.2 Restaurar el Volcado de Producción

> [!IMPORTANT]
> Los archivos de backup (`.sql`) **no están en el repositorio** por seguridad — contienen datos de producción. Obtén el backup del servidor de backups o del administrador del sistema antes de continuar.

> [!CAUTION]
> **El flag `--set=client_encoding=UTF8` es obligatorio** al restaurar desde Windows. Sin él, `psql` usa la codificación regional del sistema operativo (`WIN1252` en Windows en español), lo que corrompe los caracteres con acento (`á`, `é`, `ó`, `ñ`, etc.) convirtiéndolos en secuencias ilegibles.

#### En servidor LOCAL:
```powershell
$env:PGPASSWORD='tu_password'; psql -h localhost -U postgres -d Sinergy_produccion --set=client_encoding=UTF8 -f C:\ruta\al\backup.sql
```

#### En servidor REMOTO (`<IP_SERVIDOR_REMOTO>`):
```powershell
$env:PGPASSWORD='<tu_password>'; psql -h <IP_SERVIDOR_REMOTO> -p 5432 -U postgres -d Sinergy_produccion --set=client_encoding=UTF8 -f C:\ruta\al\backup.sql
```

#### En Linux (Bash / Fish) — servidor remoto:
```bash
PGPASSWORD='<tu_password>' psql -h <IP_SERVIDOR_REMOTO> -p 5432 -U postgres -d Sinergy_produccion --set=client_encoding=UTF8 -f /ruta/al/backup.sql
```

> [!NOTE]
> Si tras el restore los acentos siguen corruptos en pgAdmin, la causa es que la base fue creada con collation `Spanish_Venezuela.1252`. La única solución en ese caso es:
> 1. Eliminar la base: `DROP DATABASE Sinergy_produccion;`
> 2. Recrearla con `LC_COLLATE='C'` y `TEMPLATE template0` (ver Paso 5.1).
> 3. Volver a ejecutar el restore con `--set=client_encoding=UTF8`.

---

## 6. Configurar Prisma, Generar el Cliente y Ejecutar Migraciones

El backend de Sinergy utiliza **Prisma ORM 7** con el adaptador desacoplado `@prisma/adapter-pg` sobre un pool nativo de `pg` (`node-postgres`), proporcionando máxima velocidad y compatibilidad en entornos Node.js modernos.

### 6.1 Generación del Cliente Prisma (`@prisma/client`)

Cada vez que se clona el proyecto, se instalan dependencias o se modifica `apps/backend/prisma/schema.prisma`, es obligatorio compilar los tipos fuertemente tipados de TypeScript para el cliente:

```powershell
# Desde la raíz del monorepo (Recomendado):
pnpm db:generate

# O navegando directamente al backend:
cd apps\backend
pnpm prisma:generate
```

> [!NOTE]
> El cliente generado se exporta como singleton en `apps/backend/src/core/prisma.ts`, inyectando el adaptador `PrismaPg` y registrando logs de queries en modo desarrollo.

### 6.2 Despliegue de Migraciones en Producción / Staging

Sinergy cuenta con un pipeline de migraciones automatizado y resiliente que detecta si la base de datos es nueva o si fue restaurada de un backup previo:

#### Comando Universal de Despliegue (Recomendado):

Desde la **raíz del monorepo**:

```powershell
pnpm db:deploy
```

O desde `apps/backend`:

```powershell
pnpm prisma:deploy
```

#### ¿Cómo funciona este comando internamente?
1. Carga el `.env` del backend automáticamente.
2. Valida que `DATABASE_URL` esté definida antes de conectar (mensaje de error claro si falta).
3. Ejecuta `prisma migrate deploy --config prisma.config.ts`.
4. **Si la base de datos es nueva (vacía):** Aplica la migración inicial `20260916120000_db_produccion_inicial` y crea la tabla interna `_prisma_migrations`.
5. **Si la base de datos fue restaurada de un volcado (Error P3005):** Prisma detecta que ya existen tablas y aborta por seguridad (`The database schema is not empty`). El script captura el error P3005 y ejecuta automáticamente el **baseline**:
   ```powershell
   npx prisma migrate resolve --applied 20260916120000_db_produccion_inicial --config prisma.config.ts
   ```
   Esto registra la estructura existente en `_prisma_migrations` sin intentar re-crear tablas existentes, garantizando que el despliegue termine en verde y permitiendo que migraciones futuras se apliquen secuencialmente.

#### Resolución Manual de Baseline (Si ejecutas Prisma CLI directo):
Si ejecutas directamente `npx prisma migrate deploy` y recibes el error `P3005`, ejecuta el baseline manualmente desde `apps/backend`:

```powershell
# Siempre incluir --config para que Prisma cargue la URL correctamente:
npx prisma migrate resolve --applied 20260916120000_db_produccion_inicial --config prisma.config.ts
```

Y luego verifica el estado:

```powershell
npx prisma migrate status --config prisma.config.ts
```
Debe devolver: `Database schema is up to date!`.

### 6.3 Exploración Visual con Prisma Studio

Para inspeccionar o insertar datos iniciales en las tablas visualmente desde el navegador:

```powershell
cd apps\backend
npx prisma studio
```

Prisma Studio se iniciará en `http://localhost:5555`.

> [!IMPORTANT]
> Recuerda volver a la raíz del monorepo al finalizar: `cd ..\..`

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

### Producción (Scripts Automatizados)

#### Opción A — Script PowerShell Universal (Recomendado en Windows)

Sinergy incluye un script que arranca automáticamente el backend compilado y el servidor de preview optimizado con proxy inverso configurado:

```powershell
# 1. Compilar ambos proyectos (si no se ha hecho previamente)
pnpm build

# 2. Iniciar con puertos por defecto (Backend: 3080, Frontend: 4173)
.\start-sinergy.ps1

# O especificando los puertos que desees sin recompilar:
.\start-sinergy.ps1 -BackendPort 3000 -FrontendPort 8080

# 3. Detener los servicios de forma segura (sin afectar otros procesos Node del servidor):
.\stop-sinergy.ps1

# O especificando los puertos si se usaron puertos personalizados:
.\stop-sinergy.ps1 -BackendPort 3000 -FrontendPort 8080
```

> [!TIP]
> `start-sinergy.ps1` ejecuta automáticamente `stop-sinergy.ps1` antes de arrancar para garantizar que no queden procesos zombis u ocupando puertos de ejecuciones anteriores.


#### Opción B — Auto-inicio con Windows Task Scheduler (Servidores de Producción)

Para que Sinergy se inicie automáticamente en segundo plano cuando el servidor físico/virtual se encienda (sin requerir que un usuario inicie sesión en Windows):

```powershell
# Ejecutar PowerShell como Administrador:
.\register-autostart.ps1 -BackendPort 3080 -FrontendPort 4173
```

- Para remover la tarea programada si es necesario:
  ```powershell
  Unregister-ScheduledTask -TaskName "Sinergy Production" -Confirm:$false
  ```

#### Opción C — PM2 (Ecosystem)

```powershell
# Iniciar backend con PM2
pm2 start ecosystem.config.cjs

# Guardar lista de procesos para auto-reinicio
pm2 save
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

## 9. Procedimiento de Despliegue y Sincronización Limpia con Main

Cuando necesites actualizar un entorno de desarrollo, staging o producción descartando cualquier modificación local, archivo temporal o conflicto de ramas para dejar el proyecto **exactamente idéntico al estado de la rama `main` en remoto**, sigue este procedimiento ordenado:

> [!CAUTION]
> Los comandos `git reset --hard` y `git clean -fd` destruyen cualquier cambio no comiteado y archivos locales que no estén en el repositorio ni ignorados por `.gitignore`. Asegúrate de tener respaldados tus archivos `.env` antes de ejecutar este proceso.

### Paso 1: Asegurar variables de entorno

Verifica que tus archivos `.env` (`apps/backend/.env` y `apps/frontend/.env`) no estén comprometidos. Dado que están en `.gitignore`, `git reset` no los eliminará, pero es buena práctica mantener una copia de respaldo (`.env.backup`).

### Paso 2: Traer los últimos cambios remotos y forzar reset a `main`

Ejecuta desde la raíz del monorepo:

```powershell
# 1. Obtener todas las referencias remotas
git fetch origin

# 2. Asegurarse de estar en la rama main
git checkout main

# 3. Forzar el árbol de trabajo a coincidir exactamente con origin/main
git reset --hard origin/main

# 4. Eliminar archivos y carpetas huérfanas o no rastreadas (f: force, d: directorios)
git clean -fd
```

> **En Linux (Arch / CachyOS / Ubuntu):**
> ```bash
> git fetch origin && git checkout main && git reset --hard origin/main && git clean -fd
> ```

### Paso 3: Reinstalar dependencias del workspace

```powershell
pnpm install --ignore-scripts
```

### Paso 4: Generar el cliente de Prisma y ejecutar el despliegue de migraciones

```powershell
# Compilar cliente tipado de Prisma
pnpm db:generate

# Ejecutar despliegue de migraciones (resuelve baseline automáticamente si es necesario)
pnpm db:deploy
```

### Paso 5: Compilar artefactos de producción

```powershell
pnpm build
```

El frontend quedará compilado en `apps/frontend/dist` y el backend en `apps/backend/dist`.

### Paso 6: Iniciar los servicios

```powershell
# Para desarrollo:
pnpm dev

# Para producción (backend compilado):
pnpm --filter @sinergy/backend start
```

---

## 10. Extensiones Recomendadas de VS Code

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

## 11. Solución de Problemas Comunes

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

---

### `Authentication failed against the database server, the provided database credentials for '(not available)' are not valid`

**Causa:** 
1. La contraseña en `apps/backend/.env` contiene caracteres especiales (`#`, `@`, etc.) y no está envuelta entre comillas dobles, lo que hace que `dotenv` interprete `#` como comentario y trunque la contraseña.
2. La URI `DATABASE_URL` no tiene los caracteres especiales codificados en formato porcentaje (ej: `%23` para `#`).
3. El usuario o contraseña no coinciden con la instancia de PostgreSQL.

**Diagnóstico y Solución:**
1. Verifica que en `apps/backend/.env` la contraseña esté entre comillas dobles:
```env
DB_PASSWORD="tu#password@completo"
```
2. Comprueba que `DATABASE_URL` use caracteres URL-encoded para la contraseña (`encodeURIComponent`).
3. Comprueba conectividad directa con `psql` para descartar bloqueos de usuario o pg_hba:
```powershell
$env:PGPASSWORD='<tu_password>'; psql -h <IP_SERVIDOR_REMOTO> -p 5432 -U postgres -d Sinergy_produccion -c "SELECT 1;"
```

---

### `Error: P3005 The database schema is not empty` al ejecutar migraciones

**Causa:**
Ocurre al ejecutar `prisma migrate deploy` sobre una base de datos que fue restaurada desde un volcado (`Sinergy_produccion_backup.sql`) o que ya contenía tablas creadas previamente, pero que aún no tiene la tabla de auditoría `_prisma_migrations`. Por seguridad, Prisma se rehúsa a aplicar migraciones DDL sobre esquemas con tablas no registradas para evitar sobrescrituras accidentales.

**Diagnóstico y Solución:**
1. Ejecuta el comando automatizado de despliegue:
   ```powershell
   # Desde la raíz del monorepo:
   pnpm db:deploy
   ```
   El script `apps/backend/scripts/deploy-migrations.js` detectará automáticamente el error `P3005` y aplicará el baseline sin intervención manual.

2. Si deseas resolver el baseline manualmente vía CLI:
   ```powershell
   cd apps\backend
   npx prisma migrate resolve --applied 20260916120000_db_produccion_inicial
   npx prisma migrate deploy
   ```
3. Verifica que el estado de migraciones quede al día:
   ```powershell
   npx prisma migrate status
   # Salida esperada: Database schema is up to date!
   ```


