# Prisma ORM en Sinergy - Guía Completa y Tutorial de Uso

Prisma es el ORM (Object-Relational Mapping) oficial seleccionado para el backend de Sinergy. Proporciona un cliente TypeScript con tipado estricto generado automáticamente a partir del esquema de base de datos (`schema.prisma`), garantizando autocompletado y seguridad de tipos en tiempo de compilación.

---

## 1. Arquitectura y Ubicación en el Proyecto

En la arquitectura por módulos de Sinergy, Prisma vive **exclusivamente en el backend** (`apps/backend/`).

- **Ubicación del esquema:** `apps/backend/prisma/schema.prisma`
- **Ubicación del Singleton del Cliente:** `apps/backend/src/core/prisma.ts`
- **Consumo:** Los servicios (`<modulo>.service.ts`) o repositorios de la capa de infraestructura consumen la instancia singleton de PrismaClient. **El frontend nunca se comunica directamente con Prisma; interactúa exclusivamente a través de los endpoints REST del backend.**

---

## 2. Instalación y Configuración Inicial

### Paso 1: Instalación de Dependencias

Desde la raíz del monorepo, instalamos `@prisma/client` como dependencia de producción y `prisma` como dependencia de desarrollo en el paquete backend:

```powershell
# Instalar en el backend
pnpm --filter @sinergy/backend add @prisma/client
pnpm --filter @sinergy/backend add --save-dev prisma
```

### Paso 2: Inicialización

Ejecuta este comando dentro de la carpeta `apps/backend/`:

```powershell
npx prisma init --datasource-provider postgresql
```

Esto creará la siguiente estructura:

```text
apps/backend/
├── prisma/
│   └── schema.prisma    ← Archivo principal de modelado de datos
└── .env                 ← Configuración de la URL de conexión
```

### Paso 3: Configurar la URL de la Base de Datos

Asegúrate de definir la variable `DATABASE_URL` en el archivo `apps/backend/.env`:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/sinergy_db?schema=public"
```

---

## 3. Modelado de Datos (`prisma/schema.prisma`)

El archivo `schema.prisma` define la fuente de verdad de la base de datos PostgreSQL. Se divide en tres bloques principales:

```prisma
// 1. Configuración del Generador del Cliente TypeScript
generator client {
  provider = "prisma-client-js"
}

// 2. Configuración del Conector de Base de Datos
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 3. Enums (Tipos enumerados nativos de Postgres)
enum RolUsuario {
  ADMIN
  SUPERVISOR
  TECNICO
}

enum EstadoEquipo {
  OPERATIVO
  MANTENIMIENTO
  CRITICO
  FUERA_DE_SERVICIO
}

// 4. Modelos de Entidades

model Planta {
  id        Int       @id @default(autoincrement())
  nombre    String    @unique @db.VarChar(100)
  ubicacion String?   @db.VarChar(255)
  activa    Boolean   @default(true)
  equipos   Equipo[]
  creadoEn  DateTime  @default(now())
  actualizadoEn DateTime @updatedAt

  @@map("plantas") // Nombre de la tabla física en PostgreSQL
}

model Equipo {
  id           Int           @id @default(autoincrement())
  codigo       String        @unique @db.VarChar(50)
  nombre       String        @db.VarChar(150)
  estado       EstadoEquipo  @default(OPERATIVO)
  plantaId     Int
  planta       Planta        @relation(fields: [plantaId], references: [id], onDelete: Cascade)
  inspecciones Inspeccion[]
  creadoEn     DateTime      @default(now())

  @@index([plantaId])
  @@map("equipos")
}

model Usuario {
  id           Int          @id @default(autoincrement())
  email        String       @unique @db.VarChar(150)
  password     String       @db.VarChar(255)
  nombre       String       @db.VarChar(100)
  rol          RolUsuario   @default(TECNICO)
  activo       Boolean      @default(true)
  inspecciones Inspeccion[]
  creadoEn     DateTime     @default(now())

  @@map("usuarios")
}

model Inspeccion {
  id          Int      @id @default(autoincrement())
  equipoId    Int
  equipo      Equipo   @relation(fields: [equipoId], references: [id])
  usuarioId   Int
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])
  observaciones String? @db.Text
  datosJson   Json     // Almacena lecturas dinámicas (presión, temperatura, etc.)
  realizadaEn DateTime @default(now())

  @@index([equipoId])
  @@index([usuarioId])
  @@index([realizadaEn])
  @@map("inspecciones")
}
```

---

## 4. Flujo de Trabajo y Comandos CLI

| Comando | Entorno | Propósito |
|---|---|---|
| `npx prisma migrate dev --name <nombre>` | Desarrollo | Crea una nueva migración SQL, la aplica a la BD y regenera `@prisma/client`. |
| `npx prisma migrate deploy` | Producción | Aplica migraciones pendientes sin modificar ni resetear datos. |
| `npx prisma generate` | Ambas | Regenera los tipos de TypeScript del cliente manualmente. |
| `npx prisma studio` | Desarrollo | Abre un panel web visual (port 5555) para explorar y editar registros. |
| `npx prisma db push` | Prototipado | Sincroniza el schema con la BD sin crear archivos de migración. |

> [!WARNING]
> Nunca ejecutes `npx prisma migrate dev` en servidores de producción. Ese comando resetea la base de datos si detecta deriva de esquema. En producción usa **siempre** `npx prisma migrate deploy`.

---

## 5. El Patrón Singleton (`apps/backend/src/core/prisma.ts`)

En entornos de desarrollo con Hot Reload (Vite / tsx), crear múltiples instancias de `PrismaClient` agotará el estanque de conexiones de PostgreSQL. Para evitarlo, se utiliza un Singleton global:

```typescript
// apps/backend/src/core/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

---

## 6. Tutorial Completo de Consultas (CRUD Avanzado)

### A. Crear Registros (Create)

#### 1. Crear un solo registro:
```typescript
import prisma from '../core/prisma'

async function crearPlanta() {
  const nuevaPlanta = await prisma.planta.create({
    data: {
      nombre: 'Planta Extrusión Norte',
      ubicacion: 'Nave Industrial A1'
    }
  })
  return nuevaPlanta
}
```

#### 2. Crear registro con relaciones anidadas (Nested Create):
```typescript
async function crearPlantaConEquipos() {
  const planta = await prisma.planta.create({
    data: {
      nombre: 'Planta Inyección Sur',
      equipos: {
        create: [
          { codigo: 'INJ-01', nombre: 'Prensa Hidráulica 50T' },
          { codigo: 'INJ-02', nombre: 'Compresor de Enfriamiento' }
        ]
      }
    },
    include: {
      equipos: true
    }
  })
  return planta
}
```

---

### B. Leer / Consultar Registros (Read)

#### 1. Buscar por Clave Primaria o Campo Único:
```typescript
async function obtenerUsuario(id: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true
      // No seleccionamos 'password' por seguridad
    }
  })
  return usuario
}
```

#### 2. Búsqueda con Filtros, Ordenamiento y Paginación:
```typescript
async function listarEquiposCriticos(page = 1, pageSize = 10) {
  const skip = (page - 1) * pageSize

  const [total, equipos] = await Promise.all([
    prisma.equipo.count({
      where: { estado: 'CRITICO' }
    }),
    prisma.equipo.findMany({
      where: {
        estado: 'CRITICO',
        nombre: { contains: 'Compresor', mode: 'insensitive' } // Búsqueda Case-Insensitive
      },
      include: {
        planta: {
          select: { nombre: true }
        }
      },
      orderBy: { creadoEn: 'desc' },
      skip,
      take: pageSize
    })
  ])

  return { total, page, pageSize, data: equipos }
}
```

---

### C. Actualizar Registros (Update)

#### 1. Actualizar por ID:
```typescript
async function cambiarEstadoEquipo(equipoId: number, nuevoEstado: EstadoEquipo) {
  const equipoActualizado = await prisma.equipo.update({
    where: { id: equipoId },
    data: { estado: nuevoEstado }
  })
  return equipoActualizado
}
```

#### 2. Actualizar o Crear (Upsert):
```typescript
async function guardarOActualizarPlanta(nombre: string, ubicacion: string) {
  const planta = await prisma.planta.upsert({
    where: { nombre },
    update: { ubicacion },
    create: { nombre, ubicacion }
  })
  return planta
}
```

---

### D. Eliminar Registros (Delete & Soft Delete)

#### 1. Eliminación Física (Hard Delete):
```typescript
async function eliminarInspeccion(id: number) {
  await prisma.inspeccion.delete({
    where: { id }
  })
}
```

#### 2. Eliminación Lógica Recomendada (Soft Delete):
```typescript
async function desactivarUsuario(id: number) {
  await prisma.usuario.update({
    where: { id },
    data: { activo: false }
  })
}
```

---

### E. Transacciones Atómicas (Transactions)

Cuando necesitas garantizar que múltiples operaciones se completen con éxito o se reviertan totalmente en caso de fallo:

```typescript
async function registrarInspeccionYActualizarEquipo(
  equipoId: number,
  usuarioId: number,
  datosJson: Record<string, unknown>,
  estadoEquipo: EstadoEquipo
) {
  // Transacción interactiva
  return await prisma.$transaction(async (tx) => {
    // 1. Crear registro de inspección
    const inspeccion = await tx.inspeccion.create({
      data: {
        equipoId,
        usuarioId,
        datosJson
      }
    })

    // 2. Actualizar estado del equipo
    const equipo = await tx.equipo.update({
      where: { id: equipoId },
      data: { estado: estadoEquipo }
    })

    return { inspeccion, equipo }
  })
}
```

---

## 7. Integración en el Backend por Módulos (`src/modules/<modulo>/`)

Así interactúa Prisma dentro de la estructura de servicios de Sinergy:

```typescript
// apps/backend/src/modules/equipos/equipos.service.ts
import prisma from '../../core/prisma'
import type { EstadoEquipo } from '@prisma/client'

export class EquiposService {
  async obtenerTodosPorPlanta(plantaId: number) {
    return prisma.equipo.findMany({
      where: { plantaId },
      include: {
        _count: {
          select: { inspecciones: true }
        }
      }
    })
  }

  async cambiarEstado(id: number, estado: EstadoEquipo) {
    const equipoExiste = await prisma.equipo.findUnique({ where: { id } })
    if (!equipoExiste) {
      throw new Error('El equipo especificado no existe')
    }

    return prisma.equipo.update({
      where: { id },
      data: { estado }
    })
  }
}
```

---

## 8. Manejo Explícito de Errores con Prisma

Prisma lanza excepciones tipadas como `PrismaClientKnownRequestError`. Se deben capturar de forma limpia en los controladores o middlewares globales:

```typescript
import { Prisma } from '@prisma/client'

function manejarErrorPrisma(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Violación de restricción única (Unique constraint failed)
    if (error.code === 'P2002') {
      return { status: 400, message: 'Ya existe un registro con esos datos únicos.' }
    }
    // P2025: Registro no encontrado
    if (error.code === 'P2025') {
      return { status: 404, message: 'El registro solicitado no fue encontrado.' }
    }
  }
  return { status: 500, message: 'Error interno del servidor.' }
}
```
