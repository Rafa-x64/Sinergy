# Guía del Desarrollador Backend — Sinergy

Esta guía es la referencia técnica definitiva para hacer crecer el backend de Sinergy. Está basada exclusivamente en el código real del proyecto. Si sigues cada sección en orden, al final serás capaz de agregar cualquier funcionalidad nueva sin consultar a nadie.

---

## Tabla de Contenidos

- [1. Mapa Arquitectónico](#1-mapa-arquitectónico)
  - [1.1 Estructura de carpetas](#11-estructura-de-carpetas)
  - [1.2 Capa `src/core/` — Infraestructura transversal](#12-capa-srccore--infraestructura-transversal)
  - [1.3 Capa `src/modules/` — Funcionalidades de negocio](#13-capa-srcmodules--funcionalidades-de-negocio)
- [2. El Estándar de Respuesta HTTP](#2-el-estándar-de-respuesta-http)
  - [2.1 `ResponseDTO` — el contrato único](#21-responsedto--el-contrato-único)
  - [2.2 Tabla de códigos de estado usados](#22-tabla-de-códigos-de-estado-usados)
- [3. Las Cuatro Capas del Módulo](#3-las-cuatro-capas-del-módulo)
  - [3.1 `*.schemas.ts` — Contratos de datos (DTOs)](#31-schemasts--contratos-de-datos-dtos)
  - [3.2 `*.service.ts` — Lógica de negocio y acceso a datos](#32-servicets--lógica-de-negocio-y-acceso-a-datos)
  - [3.3 `*.controller.ts` — Recepción HTTP y validación de entradas](#33-controllerts--recepción-http-y-validación-de-entradas)
  - [3.4 `*.routes.ts` — Mapa de endpoints y middlewares](#34-routests--mapa-de-endpoints-y-middlewares)
- [4. Utilidades del Core — Cuándo y Cómo Usarlas](#4-utilidades-del-core--cuándo-y-cómo-usarlas)
  - [4.1 `parsearId` — Validar parámetros de URL](#41-parsearid--validar-parámetros-de-url)
  - [4.2 `validarCodigo` — Validar códigos con formato RegEx](#42-validarcódigo--validar-códigos-con-formato-regex)
  - [4.3 `capitalizarPalabras` y `capitalizar`](#43-capitalizarpalabras-y-capitalizar)
  - [4.4 `constantes.ts` — Expresiones regulares de dominio](#44-constantests--expresiones-regulares-de-dominio)
- [5. Manejo de Errores de Prisma](#5-manejo-de-errores-de-prisma)
  - [5.1 Tabla de errores conocidos](#51-tabla-de-errores-conocidos)
  - [5.2 Patrón de captura en el controlador](#52-patrón-de-captura-en-el-controlador)
- [6. Seguridad y Autenticación](#6-seguridad-y-autenticación)
  - [6.1 El middleware `validarJWT`](#61-el-middleware-validarjwt)
  - [6.2 Acceder al usuario autenticado en el controlador](#62-acceder-al-usuario-autenticado-en-el-controlador)
- [7. Tutorial Completo: Agregar un Módulo Nuevo](#7-tutorial-completo-agregar-un-módulo-nuevo)
  - [7.1 Paso 1 — Modelar en Prisma](#71-paso-1--modelar-en-prisma)
  - [7.2 Paso 2 — Crear los Schemas (DTOs)](#72-paso-2--crear-los-schemas-dtos)
  - [7.3 Paso 3 — Crear el Service](#73-paso-3--crear-el-service)
  - [7.4 Paso 4 — Crear el Controller](#74-paso-4--crear-el-controller)
  - [7.5 Paso 5 — Crear las Routes](#75-paso-5--crear-las-routes)
  - [7.6 Paso 6 — Montar el módulo en `server.ts`](#76-paso-6--montar-el-módulo-en-serverts)
- [8. Tutorial: Agregar un Endpoint a un Módulo Existente](#8-tutorial-agregar-un-endpoint-a-un-módulo-existente)
- [9. El Servidor Express — `server.ts`](#9-el-servidor-express--serverts)
- [10. Solución a Errores Comunes](#10-solución-a-errores-comunes)

---

## 1. Mapa Arquitectónico

### 1.1 Estructura de carpetas

```
apps/backend/
├── prisma/
│   └── schema.prisma          ← Definición de modelos de base de datos
└── src/
    ├── core/                  ← Infraestructura global (no toca negocio)
    │   ├── errors/
    │   │   └── AppError.ts        ← Clase de error tipado con statusCode
    │   ├── middlewares/
    │   │   ├── autenticar.ts      ← validarJWT: verifica el Bearer Token
    │   │   ├── errorHandler.ts    ← Captura global de errores no controlados
    │   │   ├── notFoundHandler.ts ← Respuesta 404 para rutas inexistentes
    │   │   └── refreshToken.ts    ← Lógica de refresco de sesión JWT
    │   ├── security/
    │   │   ├── jwt.ts             ← Firma y verificación de tokens JWT
    │   │   └── hashPassword.ts    ← Hash y comparación de contraseñas
    │   ├── types/
    │   │   ├── response.dto.ts    ← Interfaz ResponseDTO (contrato de respuesta)
    │   │   ├── auth.types.ts      ← Tipo del payload JWT decodificado
    │   │   └── express.d.ts       ← Extensión de tipos de Express (req.usuario)
    │   ├── utils/
    │   │   ├── capitalizar.ts         ← Primera letra en mayúscula
    │   │   ├── capitalizarPalabras.ts ← Capitalizar cada palabra de un string
    │   │   ├── constantes.ts          ← RegEx de dominio (códigos de planta, línea, etc.)
    │   │   ├── parsearId.ts           ← Parsear y validar IDs de URL (string → number|null)
    │   │   └── validarCodigo.ts       ← Validar un string contra una RegEx
    │   ├── prisma.ts          ← Instancia singleton de PrismaClient con driver pg
    │   └── server.ts          ← Configuración Express y montaje de módulos
    └── modules/               ← Funcionalidades de negocio
        ├── auth/
        ├── roles/
        ├── plantas/           ← Módulo de referencia de esta guía
        ├── ubicaciones/
        ├── lineas/
        ├── equipo/
        ├── componentes/
        └── mantenimiento/
```

### 1.2 Capa `src/core/` — Infraestructura transversal

Esta carpeta contiene **únicamente** código transversal a todos los módulos. Nunca pongas lógica de negocio aquí.

| Archivo | Propósito | Se importa en |
|---|---|---|
| `prisma.ts` | Instancia singleton de Prisma. Importar siempre desde aquí. | `*.service.ts` |
| `server.ts` | Configura Express y registra módulos con `app.use()`. | Solo en el montaje de módulos nuevos |
| `middlewares/autenticar.ts` | Verifica el JWT y inyecta `req.usuario`. | `*.routes.ts` de rutas privadas |
| `middlewares/errorHandler.ts` | Captura cualquier `next(error)` y responde en formato estándar. | Se registra al final de `server.ts` |
| `types/response.dto.ts` | Interfaz `ResponseDTO` para tipar las respuestas del controlador. | `*.controller.ts` |
| `utils/parsearId.ts` | Convierte `string` de `req.params.id` en `number \| null`. | `*.controller.ts` en rutas `/:id` |
| `utils/validarCodigo.ts` | Aplica una RegEx sobre un string. | `*.controller.ts` cuando hay formato de código |
| `utils/constantes.ts` | RegEx de los códigos del sistema. | `*.controller.ts` |

### 1.3 Capa `src/modules/` — Funcionalidades de negocio

Cada carpeta dentro de `modules/` representa un dominio de negocio aislado. Un módulo **siempre** tiene exactamente 4 archivos con la convención `<singular>.<capa>.ts`:

```
src/modules/plantas/
├── planta.schemas.ts     ← Interfaces TypeScript (DTOs). Solo tipos, sin lógica.
├── planta.service.ts     ← Consultas a la base de datos con Prisma. Sin validaciones HTTP.
├── planta.controller.ts  ← Recepción HTTP, validaciones nativas y respuesta.
└── planta.routes.ts      ← Definición de endpoints y middlewares.
```

> Para un módulo `proveedores`, los archivos serían: `proveedor.schemas.ts`, `proveedor.service.ts`, `proveedor.controller.ts`, `proveedor.routes.ts`.

---

## 2. El Estándar de Respuesta HTTP

### 2.1 `ResponseDTO` — el contrato único

**Toda respuesta** del backend usa el mismo formato. Definido en `src/core/types/response.dto.ts`:

```typescript
// apps/backend/src/core/types/response.dto.ts
export interface ResponseDTO {
    status: 'ok' | 'error'
    message: string
    data?: Object
}
```

El frontend espera exactamente este formato en todos los endpoints sin excepción.

**Respuesta de éxito:**
```json
{
  "status": "ok",
  "message": "Planta registrada correctamente",
  "data": { "id": 1, "codigo": "1000-EXT", "nombre": "Extrusión", "activa": true }
}
```

**Respuesta de error de validación:**
```json
{
  "status": "error",
  "message": "El código de la planta es inválido o no cumple con el formato requerido"
}
```

### 2.2 Tabla de códigos de estado usados

| Situación | Código HTTP | `status` |
|---|---|---|
| Recurso encontrado / operación exitosa | `200 OK` | `"ok"` |
| Recurso creado exitosamente | `201 Created` | `"ok"` |
| Datos de entrada inválidos o faltantes | `400 Bad Request` | `"error"` |
| Token ausente, inválido o expirado | `401 Unauthorized` | `"error"` |
| Sin permisos para la acción | `403 Forbidden` | `"error"` |
| Recurso no encontrado (Prisma `P2025`) | `404 Not Found` | `"error"` |
| Conflicto de unicidad (Prisma `P2002`) | `409 Conflict` | `"error"` |
| Dependencia de clave foránea (Prisma `P2003`) | `409 Conflict` | `"error"` |
| Error inesperado del servidor | `500 Internal Server Error` | `"error"` |

---

## 3. Las Cuatro Capas del Módulo

### 3.1 `*.schemas.ts` — Contratos de datos (DTOs)

Define **únicamente interfaces TypeScript**. Sin lógica, sin funciones, sin clases. Su propósito es establecer el contrato de los datos que entran y salen del módulo.

**Patrón real del proyecto (`planta.schemas.ts`):**
```typescript
// apps/backend/src/modules/plantas/planta.schemas.ts

// DTO de creación: campos obligatorios del recurso
export interface RegistrarPlantaDTO {
  codigo: string;
  nombre: string;
  activa?: boolean;        // opcional: el controller asigna `true` por defecto
}

// DTO de edición: todos los campos son opcionales (usuario envía solo lo que cambia)
export interface EditarPlantaDTO {
  codigo?: string;
  nombre?: string;
  activa?: boolean;
}

// Para rutas con parámetros de URL como /editar/:id
export interface Params {
  id: string;              // Express siempre entrega los params como string
}
```

**Reglas:**
- Solo exporta interfaces. Ninguna función, ninguna clase.
- El DTO de creación tiene los campos obligatorios tal como los requiere la base de datos.
- El DTO de edición es una versión `Partial` del de creación.
- Si el módulo tiene filtros de consulta (ej. `?activo=true`), agrega `interface Filtros<Modulo>`.
- Si el módulo tiene entidades relacionadas, define interfaces de respuesta con joins (ej. `EquipoConTipo`).

---

### 3.2 `*.service.ts` — Lógica de negocio y acceso a datos

El servicio es una clase que encapsula **todas las consultas a Prisma**. No valida entradas de HTTP (eso es trabajo del controlador). No construye respuestas HTTP. Solo recibe datos ya validados y opera sobre la base de datos.

**Patrón real del proyecto (`planta.service.ts`):**
```typescript
// apps/backend/src/modules/plantas/planta.service.ts
import prisma from '../../core/prisma'
import { RegistrarPlantaDTO, EditarPlantaDTO } from './planta.schemas'

class PlantaService {

    // Lectura: retorna todos los registros
    async obtener() {
        return prisma.planta.findMany()
    }

    // Escritura: crea un registro con los datos ya validados
    async crearPlanta(datos: RegistrarPlantaDTO) {
        return prisma.planta.create({
            data: datos
        })
    }

    // Escritura: actualiza solo los campos presentes en `datos`
    async editarPlanta(datos: EditarPlantaDTO, id: number) {
        return prisma.planta.update({
            where: { id },
            data: datos
        })
    }

    // Escritura: eliminación suave (soft delete), no borra el registro
    async eliminarPlanta(id: number) {
        return prisma.planta.update({
            where: { id },
            data: { activa: false }
        })
    }
}

// Exportar una instancia singleton (no la clase)
export const plantaService = new PlantaService()
```

**Reglas:**
- Exporta siempre una instancia singleton al final: `export const xService = new XService()`.
- Los errores de Prisma se capturan en el **controlador**, no aquí. El servicio los deja propagar.
- Usa el modelo correcto de Prisma (en minúscula, singular): `prisma.planta`, `prisma.equipo`, etc.
- Para eliminaciones, el patrón del proyecto es **soft delete**: `update({ data: { activa: false } })`.
- Si necesitas relaciones, usa `include` o `select` en la consulta: `prisma.equipo.findMany({ include: { planta: true } })`.

---

### 3.3 `*.controller.ts` — Recepción HTTP y validación de entradas

El controlador es el archivo más extenso. Sus responsabilidades en orden:

1. Extraer datos del `req` (body, params, query).
2. Validar esos datos de forma nativa (TypeScript + utilidades de `core/utils`).
3. Transformar/sanitizar los datos (mayúsculas, capitalización, trim).
4. Llamar al servicio con datos ya limpios.
5. Responder con el `ResponseDTO` apropiado.
6. Capturar errores de Prisma conocidos y responder con el código HTTP correcto.
7. Para errores desconocidos, delegar al manejador global con `next(error)`.

**Patrón real del proyecto — método `registrarPlanta`:**
```typescript
// apps/backend/src/modules/plantas/planta.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client'
import { plantaService } from './planta.service'
import { ResponseDTO } from '../../core/types/response.dto';
import { RegistrarPlantaDTO, EditarPlantaDTO } from './planta.schemas';
import { capitalizarPalabras } from '../../core/utils/capitalizarPalabras'
import { parsearId } from '../../core/utils/parsearId'
import { FORMATO_CODIGO_PLANTA } from '../../core/utils/constantes'
import { validarCodigo } from '../../core/utils/validarCodigo'

export const plantaController = {

    async verPlantas(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
        try {
            const plantas = await plantaService.obtener()
            if (plantas.length === 0) {
                return res.status(404).json({ status: 'error', message: 'no hay plantas registradas' })
            }
            return res.status(200).json({ status: 'ok', message: 'listado de plantas', data: plantas })
        } catch (error) {
            next(error)
        }
    },

    async registrarPlanta(req: Request<{}, {}, RegistrarPlantaDTO>, res: Response<ResponseDTO>, next: NextFunction) {
        try {
            const { codigo, nombre, activa } = req.body

            // VALIDACIÓN 1: Formato de código con RegEx de dominio
            if (!validarCodigo(codigo, FORMATO_CODIGO_PLANTA)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'El código de la planta es inválido o no cumple con el formato requerido. Ej: "1000-EXT"'
                })
            }

            // VALIDACIÓN 2: Tipo y presencia del campo
            if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
                return res.status(400).json({ status: 'error', message: 'El código de la planta es requerido y debe ser texto' })
            }

            // VALIDACIÓN 3: Longitud máxima
            if (codigo.trim().length > 50) {
                return res.status(400).json({ status: 'error', message: 'El código no puede superar los 50 caracteres' })
            }

            if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
                return res.status(400).json({ status: 'error', message: 'El nombre de la planta es requerido y debe ser texto' })
            }

            if (nombre.trim().length > 255) {
                return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
            }

            // VALIDACIÓN 4: Tipo correcto para booleanos
            if (activa !== undefined && typeof activa !== 'boolean') {
                return res.status(400).json({ status: 'error', message: 'El estado activo debe ser un valor booleano' })
            }

            // SANITIZACIÓN: construir el objeto limpio para el servicio
            const nuevaPlanta: RegistrarPlantaDTO = {
                codigo: codigo.trim().toUpperCase(),           // Normalizar a mayúsculas
                nombre: capitalizarPalabras(nombre.trim()),    // Capitalizar cada palabra
                activa: activa !== undefined ? activa : true   // Valor por defecto
            }

            const plantaRegistrada = await plantaService.crearPlanta(nuevaPlanta)

            return res.status(201).json({
                status: 'ok',
                message: 'Planta registrada correctamente',
                data: plantaRegistrada
            })

        } catch (error: unknown) {
            // CAPTURA DE ERRORES PRISMA CONOCIDOS
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const target = (error.meta?.target as string[]) || []
                const campo = target.includes('codigo') ? 'código'
                            : target.includes('nombre') ? 'nombre'
                            : 'código o nombre'

                return res.status(409).json({
                    status: 'error',
                    message: `Ya existe una planta con ese ${campo}`
                })
            }

            // Errores desconocidos → manejador global
            next(error)
        }
    },

    async actualizarPlanta(req: Request<any, {}, EditarPlantaDTO>, res: Response<ResponseDTO>, next: NextFunction) {
        try {
            const id = parsearId(req.params.id)

            if (id === null) {
                return res.status(400).json({ status: 'error', message: 'El ID proporcionado debe ser un número válido' })
            }

            if (Object.keys(req.body).length === 0) {
                return res.status(400).json({ status: 'error', message: 'Debe proporcionar al menos un campo para actualizar' })
            }

            const { codigo, nombre, activa } = req.body
            const datosActualizados: EditarPlantaDTO = {}

            if (codigo !== undefined) {
                if (!validarCodigo(codigo, FORMATO_CODIGO_PLANTA)) {
                    return res.status(400).json({ status: 'error', message: 'El código de la planta es inválido' })
                }
                if (codigo.trim().length > 50) {
                    return res.status(400).json({ status: 'error', message: 'El código no puede superar los 50 caracteres' })
                }
                datosActualizados.codigo = codigo.trim().toUpperCase()
            }

            if (nombre !== undefined) {
                if (typeof nombre !== 'string' || !nombre.trim()) {
                    return res.status(400).json({ status: 'error', message: 'El nombre de la planta es inválido' })
                }
                if (nombre.trim().length > 255) {
                    return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
                }
                datosActualizados.nombre = capitalizarPalabras(nombre.trim())
            }

            if (activa !== undefined) {
                if (typeof activa !== 'boolean') {
                    return res.status(400).json({ status: 'error', message: 'El estado activo debe ser un valor booleano' })
                }
                datosActualizados.activa = activa
            }

            const plantaActualizada = await plantaService.editarPlanta(datosActualizados, id)

            return res.status(200).json({
                status: 'ok',
                message: 'Planta actualizada correctamente',
                data: plantaActualizada
            })

        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    return res.status(404).json({ status: 'error', message: `La planta con ID ${req.params.id} no existe` })
                }
                if (error.code === 'P2002') {
                    const target = (error.meta?.target as string[]) || []
                    const campo = target.includes('codigo') ? 'código' : target.includes('nombre') ? 'nombre' : 'campo'
                    return res.status(409).json({ status: 'error', message: `Ya existe otra planta con ese ${campo}` })
                }
            }
            next(error)
        }
    },

    async eliminarPlanta(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
        try {
            const id = parsearId(req.params.id)

            if (id === null) {
                return res.status(400).json({ status: 'error', message: 'El ID proporcionado debe ser un número válido' })
            }

            const plantaEliminada = await plantaService.eliminarPlanta(id)

            return res.status(200).json({
                status: 'ok',
                message: 'Planta eliminada correctamente',
                data: plantaEliminada
            })

        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    return res.status(404).json({ status: 'error', message: `La planta con ID ${req.params.id} no existe` })
                }
                if (error.code === 'P2003') {
                    return res.status(409).json({
                        status: 'error',
                        message: 'No se puede eliminar la planta porque tiene líneas o ubicaciones asociadas. Desactívala en su lugar.'
                    })
                }
            }
            next(error)
        }
    },
}
```

**Reglas del controlador:**
- Exporta un **objeto literal** con métodos `async`, no una clase.
- Tipado explícito de `req`: `Request<Params, {}, BodyDTO>`.
- El orden de validaciones es: formato con RegEx → tipo/presencia → longitud → tipo booleano.
- Siempre `return res.status(...).json(...)` (sin el `return`, Express puede enviar doble respuesta).
- El bloque `catch` captura errores de Prisma antes de llamar `next(error)`.
- Nunca capturar un error y no responder ni delegar: bloque `catch` vacío está prohibido.

---

### 3.4 `*.routes.ts` — Mapa de endpoints y middlewares

El archivo de rutas mapea verbos HTTP a métodos del controlador y aplica middlewares. Es el archivo más corto del módulo.

**Patrón real del proyecto (`planta.routes.ts`):**
```typescript
// apps/backend/src/modules/plantas/planta.routes.ts
import { Router } from 'express'
import { plantaController } from './planta.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

// Normalización de trailing slash: registrar con y sin "/" final
// Evita errores 404 cuando el frontend llama a /listar/ en vez de /listar
router.get(['/listar', '/listar/'], validarJWT, plantaController.verPlantas)
router.post(['/crear', '/crear/'], validarJWT, plantaController.registrarPlanta)
router.patch('/editar/:id', validarJWT, plantaController.actualizarPlanta)
router.delete('/eliminar/:id', validarJWT, plantaController.eliminarPlanta)

export default router
```

**Convención de nombres de endpoints:**
| Operación | Verbo | Endpoint |
|---|---|---|
| Listar todos | `GET` | `/listar` |
| Crear | `POST` | `/crear` |
| Editar por ID | `PATCH` | `/editar/:id` |
| Eliminar por ID | `DELETE` | `/eliminar/:id` |
| Buscar por ID | `GET` | `/buscar/:id` |
| Sub-recurso (ej. tipos de equipo) | `POST` | `/tipo/crear` |

> El módulo `equipo` tiene rutas de sub-recursos en el mismo router: `router.post(['/tipo/crear', '/tipo/crear/'], ...)`. Esto es válido cuando los sub-recursos están estrechamente ligados al módulo padre.

---

## 4. Utilidades del Core — Cuándo y Cómo Usarlas

### 4.1 `parsearId` — Validar parámetros de URL

Úsala **siempre** que el endpoint reciba un `:id` como parámetro de URL. Los `req.params` en Express son siempre `string`.

```typescript
import { parsearId } from '../../core/utils/parsearId'

const id = parsearId(req.params.id)

if (id === null) {
    return res.status(400).json({ status: 'error', message: 'El ID proporcionado debe ser un número válido' })
}
// A partir de aquí, `id` es de tipo `number`
```

**Implementación:**
```typescript
export function parsearId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return Number.isNaN(id) ? null : id
}
```

Esto protege contra ataques donde el cliente envía `'abc'`, `'null'`, o `' '` como ID.

### 4.2 `validarCodigo` — Validar códigos con formato RegEx

Úsala cuando el campo `codigo` debe cumplir un formato específico.

```typescript
import { validarCodigo } from '../../core/utils/validarCodigo'
import { FORMATO_CODIGO_PLANTA } from '../../core/utils/constantes'

if (!validarCodigo(codigo, FORMATO_CODIGO_PLANTA)) {
    return res.status(400).json({ status: 'error', message: 'Formato de código inválido' })
}
```

**Implementación:**
```typescript
export function validarCodigo(texto: string, regex: RegExp): boolean {
    if (!texto || typeof texto !== 'string') return false
    return regex.test(texto.trim())
}
```

### 4.3 `capitalizarPalabras` y `capitalizar`

Úsalas para sanitizar campos de texto antes de guardar en la base de datos.

```typescript
import { capitalizarPalabras } from '../../core/utils/capitalizarPalabras'

// "planta de extrusión" → "Planta De Extrusión"
nombre: capitalizarPalabras(nombre.trim())

// Para un solo token:
import { capitalizar } from '../../core/utils/capitalizar'
// "extrusión" → "Extrusión"
nombre: capitalizar(nombre.trim())
```

### 4.4 `constantes.ts` — Expresiones regulares de dominio

Define aquí las RegEx de formatos de código del sistema. Cuando agregues un módulo con código propio, añade su constante aquí.

```typescript
// apps/backend/src/core/utils/constantes.ts
export const FORMATO_CODIGO_PLANTA  = /^1000-[A-ZÁÉÍÓÚÑ]{3}$/
export const REGEX_CODIGO_UBICACION = /^\d{4}-[A-Z]{3}-[A-Z]{4}$/
export const REGEX_CODIGO_LINEA     = /^\d{4}-[A-Z]{3}-[A-Z]{4}-[A-Z0-9]{4}$/

// Para un nuevo módulo con código propio, agregar:
// export const FORMATO_CODIGO_PROVEEDOR = /^PROV-\d{4}$/
```

---

## 5. Manejo de Errores de Prisma

### 5.1 Tabla de errores conocidos

| Código Prisma | Cuándo ocurre | Código HTTP | Qué responder |
|---|---|---|---|
| `P2002` | Violación de restricción `@unique` (valor duplicado) | `409 Conflict` | `"Ya existe un [recurso] con ese [campo]"` |
| `P2025` | Registro no encontrado en `update` o `delete` | `404 Not Found` | `"El [recurso] con ID X no existe"` |
| `P2003` | Violación de clave foránea (el registro tiene dependencias) | `409 Conflict` | `"No se puede eliminar el [recurso] porque tiene [dependencias]"` |

Para `P2002`, Prisma incluye en `error.meta.target` el array de campos que violaron la unicidad. Úsalo para dar un mensaje específico.

### 5.2 Patrón de captura en el controlador

```typescript
} catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {

        if (error.code === 'P2025') {
            return res.status(404).json({
                status: 'error',
                message: `La planta con ID ${req.params.id} no existe`
            })
        }

        if (error.code === 'P2002') {
            const target = (error.meta?.target as string[]) || []
            const campo = target.includes('codigo') ? 'código'
                        : target.includes('nombre') ? 'nombre'
                        : 'campo'

            return res.status(409).json({
                status: 'error',
                message: `Ya existe una planta con ese ${campo}`
            })
        }

        if (error.code === 'P2003') {
            return res.status(409).json({
                status: 'error',
                message: 'No se puede eliminar porque tiene registros dependientes'
            })
        }
    }

    // Cualquier error no reconocido → errorHandler global (responde 500)
    next(error)
}
```

---

## 6. Seguridad y Autenticación

### 6.1 El middleware `validarJWT`

`validarJWT` protege las rutas privadas. Extrae el Bearer Token del header `Authorization`, lo verifica con la clave secreta y si es válido, inyecta el payload en `req.usuario`. Si el token no existe, está malformado o expiró, lanza un `AppError(401)` que el `errorHandler` convierte en respuesta HTTP.

```typescript
// apps/backend/src/core/middlewares/autenticar.ts
export function validarJWT(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No se proporcionó un token de autenticación', 401)
    }

    const token = authHeader.slice(7)
    const payload = verificarAccessToken(token)

    req.usuario = payload   // disponible en el controlador como req.usuario
    next()
  } catch (error) {
    next(error)
  }
}
```

**Regla:** Aplica `validarJWT` a **todas** las rutas que requieran sesión activa. Nunca a `/auth/login` ni `/auth/refresh`.

### 6.2 Acceder al usuario autenticado en el controlador

Después de que `validarJWT` procesa la petición, el controlador puede acceder al usuario autenticado:

```typescript
async crearRecurso(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
        const usuarioId = req.usuario?.id       // ID del usuario que hace la petición
        const rolesUsuario = req.usuario?.roles  // Roles del usuario
        // ...
    }
}
```

El tipo de `req.usuario` está declarado en `src/core/types/express.d.ts` y definido en `src/core/types/auth.types.ts`.

---

## 7. Tutorial Completo: Agregar un Módulo Nuevo

Ejemplo: crear el módulo `proveedores` desde cero.

### 7.1 Paso 1 — Modelar en Prisma

Edita `apps/backend/prisma/schema.prisma`:

```prisma
model Proveedor {
  id            Int       @id @default(autoincrement())
  codigo        String    @unique @db.VarChar(20)
  nombre        String    @db.VarChar(255)
  contacto      String?   @db.VarChar(150)
  activo        Boolean   @default(true)
  creadoEn      DateTime  @default(now())  @map("creado_en")
  actualizadoEn DateTime  @updatedAt       @map("actualizado_en")

  @@map("proveedores")
}
```

Ejecuta la migración:
```powershell
pnpm --filter @sinergy/backend exec prisma migrate dev --name agregar_tabla_proveedores
```

Si solo quieres verificar sin migrar (desarrollo sin control de versiones):
```powershell
pnpm --filter @sinergy/backend exec prisma db push
```

### 7.2 Paso 2 — Crear los Schemas (DTOs)

Crea `apps/backend/src/modules/proveedores/proveedor.schemas.ts`:

```typescript
export interface RegistrarProveedorDTO {
  codigo: string;
  nombre: string;
  contacto?: string | null;
  activo?: boolean;
}

export interface EditarProveedorDTO {
  nombre?: string;
  contacto?: string | null;
  activo?: boolean;
}
```

### 7.3 Paso 3 — Crear el Service

Crea `apps/backend/src/modules/proveedores/proveedor.service.ts`:

```typescript
import prisma from '../../core/prisma'
import { RegistrarProveedorDTO, EditarProveedorDTO } from './proveedor.schemas'

class ProveedorService {

    async obtener() {
        return prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } })
    }

    async crearProveedor(datos: RegistrarProveedorDTO) {
        return prisma.proveedor.create({ data: datos })
    }

    async editarProveedor(datos: EditarProveedorDTO, id: number) {
        return prisma.proveedor.update({ where: { id }, data: datos })
    }

    async eliminarProveedor(id: number) {
        return prisma.proveedor.update({ where: { id }, data: { activo: false } })
    }
}

export const proveedorService = new ProveedorService()
```

### 7.4 Paso 4 — Crear el Controller

Crea `apps/backend/src/modules/proveedores/proveedor.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client'
import { proveedorService } from './proveedor.service'
import { ResponseDTO } from '../../core/types/response.dto';
import { RegistrarProveedorDTO, EditarProveedorDTO } from './proveedor.schemas';
import { capitalizarPalabras } from '../../core/utils/capitalizarPalabras'
import { parsearId } from '../../core/utils/parsearId'

export const proveedorController = {

    async verProveedores(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
        try {
            const proveedores = await proveedorService.obtener()
            if (proveedores.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No hay proveedores registrados' })
            }
            return res.status(200).json({ status: 'ok', message: 'Listado de proveedores', data: proveedores })
        } catch (error) {
            next(error)
        }
    },

    async registrarProveedor(req: Request<{}, {}, RegistrarProveedorDTO>, res: Response<ResponseDTO>, next: NextFunction) {
        try {
            const { codigo, nombre, contacto, activo } = req.body

            if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
                return res.status(400).json({ status: 'error', message: 'El código del proveedor es requerido' })
            }
            if (codigo.trim().length > 20) {
                return res.status(400).json({ status: 'error', message: 'El código no puede superar los 20 caracteres' })
            }
            if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
                return res.status(400).json({ status: 'error', message: 'El nombre del proveedor es requerido' })
            }
            if (nombre.trim().length > 255) {
                return res.status(400).json({ status: 'error', message: 'El nombre no puede superar los 255 caracteres' })
            }
            if (activo !== undefined && typeof activo !== 'boolean') {
                return res.status(400).json({ status: 'error', message: 'El campo activo debe ser un booleano' })
            }

            const nuevoProveedor: RegistrarProveedorDTO = {
                codigo: codigo.trim().toUpperCase(),
                nombre: capitalizarPalabras(nombre.trim()),
                contacto: contacto?.trim() ?? null,
                activo: activo !== undefined ? activo : true
            }

            const proveedorCreado = await proveedorService.crearProveedor(nuevoProveedor)

            return res.status(201).json({
                status: 'ok',
                message: 'Proveedor registrado correctamente',
                data: proveedorCreado
            })

        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return res.status(409).json({ status: 'error', message: 'Ya existe un proveedor con ese código' })
            }
            next(error)
        }
    },

    async actualizarProveedor(req: Request<any, {}, EditarProveedorDTO>, res: Response<ResponseDTO>, next: NextFunction) {
        try {
            const id = parsearId(req.params.id)
            if (id === null) {
                return res.status(400).json({ status: 'error', message: 'El ID proporcionado debe ser un número válido' })
            }
            if (Object.keys(req.body).length === 0) {
                return res.status(400).json({ status: 'error', message: 'Debe proporcionar al menos un campo para actualizar' })
            }

            const { nombre, contacto, activo } = req.body
            const datosActualizados: EditarProveedorDTO = {}

            if (nombre !== undefined) {
                if (typeof nombre !== 'string' || !nombre.trim()) {
                    return res.status(400).json({ status: 'error', message: 'El nombre del proveedor es inválido' })
                }
                datosActualizados.nombre = capitalizarPalabras(nombre.trim())
            }
            if (contacto !== undefined) {
                datosActualizados.contacto = contacto?.trim() ?? null
            }
            if (activo !== undefined) {
                if (typeof activo !== 'boolean') {
                    return res.status(400).json({ status: 'error', message: 'El campo activo debe ser un booleano' })
                }
                datosActualizados.activo = activo
            }

            const proveedorActualizado = await proveedorService.editarProveedor(datosActualizados, id)

            return res.status(200).json({ status: 'ok', message: 'Proveedor actualizado correctamente', data: proveedorActualizado })

        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return res.status(404).json({ status: 'error', message: `El proveedor con ID ${req.params.id} no existe` })
            }
            next(error)
        }
    },

    async eliminarProveedor(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
        try {
            const id = parsearId(req.params.id)
            if (id === null) {
                return res.status(400).json({ status: 'error', message: 'El ID proporcionado debe ser un número válido' })
            }

            const proveedorEliminado = await proveedorService.eliminarProveedor(id)

            return res.status(200).json({ status: 'ok', message: 'Proveedor desactivado correctamente', data: proveedorEliminado })

        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return res.status(404).json({ status: 'error', message: `El proveedor con ID ${req.params.id} no existe` })
            }
            next(error)
        }
    }
}
```

### 7.5 Paso 5 — Crear las Routes

Crea `apps/backend/src/modules/proveedores/proveedor.routes.ts`:

```typescript
import { Router } from 'express'
import { proveedorController } from './proveedor.controller'
import { validarJWT } from '../../core/middlewares/autenticar'

const router = Router()

router.get(['/listar', '/listar/'], validarJWT, proveedorController.verProveedores)
router.post(['/crear', '/crear/'], validarJWT, proveedorController.registrarProveedor)
router.patch('/editar/:id', validarJWT, proveedorController.actualizarProveedor)
router.delete('/eliminar/:id', validarJWT, proveedorController.eliminarProveedor)

export default router
```

### 7.6 Paso 6 — Montar el módulo en `server.ts`

Edita `apps/backend/src/core/server.ts`. Agrega exactamente dos líneas:

```typescript
// 1. Import al inicio del archivo, junto a los demás imports de módulos:
import proveedorRoutes from '../modules/proveedores/proveedor.routes'

// 2. Registro de rutas en el bloque de módulos (antes de los handlers globales):
app.use('/api/proveedores', proveedorRoutes)
```

Verifica que el módulo compila sin errores:
```powershell
pnpm --filter @sinergy/backend build
```

El módulo está activo. Los endpoints disponibles son:
- `GET  /api/proveedores/listar`
- `POST /api/proveedores/crear`
- `PATCH /api/proveedores/editar/:id`
- `DELETE /api/proveedores/eliminar/:id`

---

## 8. Tutorial: Agregar un Endpoint a un Módulo Existente

Si el módulo ya existe y solo necesitas una ruta nueva, el proceso es más corto. Ejemplo: buscar una planta por su código.

**Paso 1 — Agregar el método en el service:**
```typescript
// planta.service.ts
async buscarPorCodigo(codigo: string) {
    return prisma.planta.findUnique({ where: { codigo } })
}
```

**Paso 2 — Agregar el método en el controller:**
```typescript
// planta.controller.ts (dentro del objeto plantaController)
async buscarPorCodigo(req: Request, res: Response<ResponseDTO>, next: NextFunction) {
    try {
        const { codigo } = req.params

        if (!codigo || typeof codigo !== 'string') {
            return res.status(400).json({ status: 'error', message: 'El código es requerido' })
        }

        const planta = await plantaService.buscarPorCodigo(codigo.toUpperCase())

        if (!planta) {
            return res.status(404).json({ status: 'error', message: `No existe una planta con el código ${codigo}` })
        }

        return res.status(200).json({ status: 'ok', message: 'Planta encontrada', data: planta })
    } catch (error) {
        next(error)
    }
},
```

**Paso 3 — Agregar la ruta en el router:**
```typescript
// planta.routes.ts
router.get('/buscar/:codigo', validarJWT, plantaController.buscarPorCodigo)
```

No necesitas tocar `server.ts` porque el módulo ya está montado.

---

## 9. El Servidor Express — `server.ts`

El orden de middlewares en `server.ts` es crítico. No cambiarlo.

```typescript
// apps/backend/src/core/server.ts

// ─── 1. Seguridad y parseo (SIEMPRE primero) ─────────────────────────────────
app.use(helmet())           // Headers de seguridad HTTP
app.use(cors({ ... }))      // Control de orígenes permitidos (credentials: true para cookies)
app.use(express.json())     // Parsear body JSON
app.use(cookieParser())     // Parsear cookies (necesario para el refresh token)

// ─── 2. Rutas de diagnóstico (no requieren auth) ─────────────────────────────
app.get('/', ...)
app.get('/api/health', ...)

// ─── 3. Módulos de funcionalidades ───────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/usuarios', authRoutes)
app.use('/api/roles', rolesRoutes)
app.use('/api/equipos', equipoRoutes)
app.use('/api/plantas', plantaRoutes)
app.use('/api/ubicaciones', ubicacionRoutes)
app.use('/api/lineas', lineaRoutes)
app.use('/api/componentes', componenteRoutes)
app.use('/api/mantenimiento', mantenimientoRoutes)
// → Aquí se agregan los nuevos módulos

// ─── 4. Handlers globales (SIEMPRE al final, en este orden) ──────────────────
app.use(notFoundHandler)    // ← 404 para rutas no definidas
app.use(errorHandler)       // ← 500 (o el statusCode del AppError) para next(error)
```

> Si el `errorHandler` no está **al final**, los errores de los módulos no llegarán a él.

---

## 10. Solución a Errores Comunes

**Error: `Cannot read properties of undefined (reading 'id')` en `req.usuario`**

El middleware `validarJWT` no está aplicado en la ruta. Verifica que en `*.routes.ts` el método tenga `validarJWT` como segundo argumento:
```typescript
router.get('/listar', validarJWT, controller.metodo)   // Correcto
router.get('/listar', controller.metodo)               // Sin auth → req.usuario es undefined
```

---

**Error: `PrismaClientInitializationError` al ejecutar una consulta**

El cliente de Prisma no tiene los tipos del schema actual. Ejecuta:
```powershell
pnpm --filter @sinergy/backend exec prisma generate
```

---

**Error: `Property 'usuario' does not exist on type 'Request'`**

El archivo `src/core/types/express.d.ts` no está siendo incluido en la compilación. Verifica que `tsconfig.json` incluya la carpeta `src` en `include`:
```json
{ "include": ["src/**/*"] }
```

---

**El endpoint responde 404 aunque la URL parece correcta**

El trailing slash puede ser el problema. Si el frontend llama `/listar/` y la ruta solo está registrada como `/listar`, Express devuelve 404. Usa siempre el array de rutas:
```typescript
router.get(['/listar', '/listar/'], validarJWT, controller.metodo)
```

---

**La respuesta llega al frontend pero `data` es `undefined`**

El controlador responde con `status: 'ok'` pero sin incluir `data`. Asegúrate de incluirlo:
```typescript
// Incorrecto:
return res.status(200).json({ status: 'ok', message: 'ok' })

// Correcto:
return res.status(200).json({ status: 'ok', message: 'ok', data: resultado })
```

---

**Error: `P1001 - Can't reach database server`**

El servidor de PostgreSQL no está corriendo o `DATABASE_URL` en `.env` es incorrecta. Verifica la cadena de conexión y que el servicio esté activo.

---

**El módulo no responde aunque está en `server.ts`**

Verifica que el import y el `app.use()` estén antes de los handlers globales (`notFoundHandler` y `errorHandler`). Si el módulo se agrega después del `notFoundHandler`, todas sus rutas responderán 404.
