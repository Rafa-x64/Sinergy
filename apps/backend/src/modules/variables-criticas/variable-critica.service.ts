import prisma from '../../core/prisma'
import { RegistrarVariableDTO, EditarVariableDTO, FiltrosVariable } from './variable-critica.schemas'
import { Prisma } from '@prisma/client'

// Proyección estándar reutilizada en todas las respuestas del servicio
const INCLUDE_VARIABLE_RELACIONES: Prisma.VariableInclude = {
  componente: {
    select: {
      id: true,
      nombre: true,
      equipoId: true
    }
  },
  opcionesSeleccion: {
    orderBy: { ordenPosicion: 'asc' }
  }
}

class VariableCriticaService {

  async crearVariable(datos: RegistrarVariableDTO) {
    const { opciones, ...camposVariable } = datos

    return prisma.variable.create({
      data: {
        ...camposVariable,
        // Si se enviaron opciones (tipo SELECCION), se crean en la misma transacción atómica
        ...(opciones && opciones.length > 0
          ? {
              opcionesSeleccion: {
                createMany: {
                  data: opciones.map(o => ({
                    clave: o.clave.trim().toUpperCase(),
                    etiqueta: o.etiqueta.trim(),
                    ordenPosicion: o.ordenPosicion ?? 0
                  }))
                }
              }
            }
          : {})
      },
      include: INCLUDE_VARIABLE_RELACIONES
    })
  }

  async obtenerVariables(filtros: FiltrosVariable) {
    const where: Prisma.VariableWhereInput = {}

    if (filtros.componenteId !== undefined) {
      where.componenteId = filtros.componenteId
    }

    if (filtros.tipoEvaluacion !== undefined) {
      where.tipoEvaluacion = filtros.tipoEvaluacion
    }

    // Por defecto solo devuelve variables activas si no se especifica el filtro
    where.activa = filtros.activa !== undefined ? filtros.activa : true

    return prisma.variable.findMany({
      where,
      include: INCLUDE_VARIABLE_RELACIONES,
      orderBy: [
        { ordenPosicion: 'asc' },
        { creadoEn: 'asc' }
      ]
    })
  }

  async buscarPorId(id: number) {
    return prisma.variable.findFirst({
      where: {
        id,
        activa: true
      },
      include: INCLUDE_VARIABLE_RELACIONES
    })
  }

  async editarVariable(id: number, datos: EditarVariableDTO) {
    return prisma.variable.update({
      where: { id },
      data: datos,
      include: INCLUDE_VARIABLE_RELACIONES
    })
  }

  // Borrado lógico: se marca activa = false para preservar historial en InspeccionDetalle
  async eliminarVariable(id: number) {
    return prisma.variable.update({
      where: { id },
      data: { activa: false },
      include: INCLUDE_VARIABLE_RELACIONES
    })
  }

  async existeVariable(id: number): Promise<boolean> {
    const conteo = await prisma.variable.count({
      where: { id, activa: true }
    })
    return conteo > 0
  }

  async existeComponente(componenteId: number): Promise<boolean> {
    const conteo = await prisma.componente.count({
      where: { id: componenteId, activo: true }
    })
    return conteo > 0
  }
}

export const variableCriticaService = new VariableCriticaService()
