import prisma from '../../core/prisma'
import { RegistrarInspeccionDTO, EditarEstadoInspeccionDTO, FiltrosInspeccion } from './inspeccion.schemas'
import { Prisma } from '@prisma/client'

// BigInt no es serializable por JSON.stringify de forma nativa.
// Esta función convierte recursivamente todos los BigInt a string antes de responder al cliente.
export function serializarBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  )
}

// Proyección estándar que incluye las relaciones necesarias para la vista de detalle
const INCLUDE_INSPECCION_RELACIONES: Prisma.InspeccionInclude = {
  equipo: {
    select: { id: true, codigo: true, nombre: true }
  },
  elaboradoPor: {
    select: { id: true, nombre: true, apellido: true, email: true }
  },
  revisadoPor: {
    select: { id: true, nombre: true, apellido: true }
  },
  aprobadoPor: {
    select: { id: true, nombre: true, apellido: true }
  },
  detalles: {
    include: {
      variable: {
        select: {
          id: true,
          nombre: true,
          tipoEvaluacion: true,
          unidad: true,
          valorMinimo: true,
          valorMaximo: true
        }
      }
    }
  }
}

class InspeccionService {

  // Persiste la inspección y todos sus detalles en una sola operación atómica de Prisma
  async crearInspeccion(datos: RegistrarInspeccionDTO, elaboradoPorId: number) {
    const inspeccion = await prisma.inspeccion.create({
      data: {
        codigoInspeccion: datos.codigoInspeccion,
        tipoInspeccion: datos.tipoInspeccion,
        equipoId: datos.equipoId,
        elaboradoPorId,
        origenDatos: datos.origenDatos ?? 'ONLINE',
        observacionesGenerales: datos.observacionesGenerales ?? null,
        detalles: {
          // createMany es más eficiente que N inserciones individuales
          createMany: {
            data: datos.detalles.map(d => ({
              variableId: d.variableId,
              valorNumerico: d.valorNumerico ?? null,
              valorSeleccion: d.valorSeleccion ?? null,
              observaciones: d.observaciones ?? null,
              estadoComponente: d.estadoComponente ?? true
            }))
          }
        }
      },
      include: INCLUDE_INSPECCION_RELACIONES
    })

    return serializarBigInt(inspeccion)
  }

  async obtenerInspecciones(filtros: FiltrosInspeccion) {
    const where: Prisma.InspeccionWhereInput = {}

    if (filtros.equipoId !== undefined) {
      where.equipoId = filtros.equipoId
    }

    if (filtros.tipoInspeccion !== undefined) {
      where.tipoInspeccion = filtros.tipoInspeccion
    }

    if (filtros.estadoInspeccion !== undefined) {
      where.estadoInspeccion = filtros.estadoInspeccion
    }

    if (filtros.elaboradoPorId !== undefined) {
      where.elaboradoPorId = filtros.elaboradoPorId
    }

    const inspecciones = await prisma.inspeccion.findMany({
      where,
      include: INCLUDE_INSPECCION_RELACIONES,
      orderBy: { fechaRegistro: 'desc' }
    })

    return serializarBigInt(inspecciones)
  }

  async buscarPorId(id: bigint) {
    const inspeccion = await prisma.inspeccion.findUnique({
      where: { id },
      include: INCLUDE_INSPECCION_RELACIONES
    })

    return inspeccion ? serializarBigInt(inspeccion) : null
  }

  async actualizarEstado(id: bigint, datos: EditarEstadoInspeccionDTO) {
    const inspeccion = await prisma.inspeccion.update({
      where: { id },
      data: {
        estadoInspeccion: datos.estadoInspeccion,
        revisadoPorId: datos.revisadoPorId ?? undefined,
        aprobadoPorId: datos.aprobadoPorId ?? undefined
      },
      include: INCLUDE_INSPECCION_RELACIONES
    })

    return serializarBigInt(inspeccion)
  }

  async eliminarInspeccion(id: bigint) {
    // Eliminación física — la inspección en BORRADOR puede descartarse completamente
    const inspeccion = await prisma.inspeccion.delete({
      where: { id },
      include: INCLUDE_INSPECCION_RELACIONES
    })

    return serializarBigInt(inspeccion)
  }

  async existeInspeccion(id: bigint): Promise<boolean> {
    const conteo = await prisma.inspeccion.count({ where: { id } })
    return conteo > 0
  }

  async existeEquipo(equipoId: number): Promise<boolean> {
    const conteo = await prisma.equipo.count({ where: { id: equipoId } })
    return conteo > 0
  }
}

export const inspeccionService = new InspeccionService()
