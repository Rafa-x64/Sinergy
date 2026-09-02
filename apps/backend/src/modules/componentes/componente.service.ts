import prisma from '../../core/prisma'
import { RegistrarComponenteDTO, EditarComponenteDTO, FiltrosComponente } from './componente.schemas'
import { Prisma } from '@prisma/client'

const INCLUDE_COMPONENTE_RELACIONES: Prisma.ComponenteInclude = {
  equipo: {
    select: {
      id: true,
      nombre: true,
      codigo: true
    }
  }
}

class ComponenteService {

  async crearComponente(datos: RegistrarComponenteDTO) {
    return prisma.$transaction(async (tx) => {
      const componente = await tx.componente.create({
        data: datos,
        include: INCLUDE_COMPONENTE_RELACIONES
      })

      // Consultar el equipo para obtener su tipo de equipo
      const equipo = await tx.equipo.findUnique({
        where: { id: datos.equipoId },
        select: { tipoEquipoId: true }
      })

      if (equipo?.tipoEquipoId) {
        // Obtener las variables de plantilla activas para este tipo de equipo
        const plantillas = await tx.plantillaVariable.findMany({
          where: { tipoEquipoId: equipo.tipoEquipoId, activa: true },
          include: { opcionesSeleccion: true },
          orderBy: { ordenPosicion: 'asc' }
        })

        // Instanciar únicamente las variables de plantilla asignadas a este componente (o globales)
        const plantillasAplicables = plantillas.filter(
          p => !p.nombreComponente || p.nombreComponente.trim().toUpperCase() === componente.nombre.trim().toUpperCase()
        )

        for (const p of plantillasAplicables) {
          const nuevaVar = await tx.variable.create({
            data: {
              componenteId: componente.id,
              plantillaId: p.id,
              nombre: p.nombre,
              tipoEvaluacion: p.tipoEvaluacion,
              unidad: p.unidad,
              valorMinimo: p.valorMinimo,
              valorMaximo: p.valorMaximo,
              ordenPosicion: p.ordenPosicion,
              activa: true
            }
          })

          if (p.tipoEvaluacion === 'SELECCION' && p.opcionesSeleccion.length > 0) {
            await tx.opcionSeleccion.createMany({
              data: p.opcionesSeleccion.map((o) => ({
                variableId: nuevaVar.id,
                clave: o.clave,
                etiqueta: o.etiqueta,
                ordenPosicion: o.ordenPosicion
              }))
            })
          }
        }
      }

      return componente
    })
  }

  async obtenerComponentes(filtros: FiltrosComponente) {
    const where: Prisma.ComponenteWhereInput = {}

    if (filtros.equipoId !== undefined) {
      where.equipoId = filtros.equipoId
    }

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo
    }

    if (filtros.nombre) {
      where.nombre = { contains: filtros.nombre, mode: 'insensitive' }
    }

    if (filtros.descripcion) {
      where.descripcion = { contains: filtros.descripcion, mode: 'insensitive' }
    }

    if (filtros.busqueda) {
      where.OR = [
        { nombre: { contains: filtros.busqueda, mode: 'insensitive' } },
        { descripcion: { contains: filtros.busqueda, mode: 'insensitive' } }
      ]
    }

    return prisma.componente.findMany({
      where,
      include: INCLUDE_COMPONENTE_RELACIONES,
      orderBy: [
        { ordenPosicion: 'asc' },
        { creadoEn: 'asc' }
      ]
    })
  }

  async buscarPorId(id: number) {
    return prisma.componente.findFirst({
      where: {
        id,
        activo: true
      },
      include: INCLUDE_COMPONENTE_RELACIONES
    })
  }

  async editarComponente(id: number, datos: EditarComponenteDTO) {
    return prisma.componente.update({
      where: { id },
      data: datos,
      include: INCLUDE_COMPONENTE_RELACIONES
    })
  }

  async eliminarComponente(id: number) {
    return prisma.componente.update({
      where: { id },
      data: {
        activo: false
      },
      include: INCLUDE_COMPONENTE_RELACIONES
    })
  }

  async existeComponente(id: number): Promise<boolean> {
    const conteo = await prisma.componente.count({
      where: { id, activo: true }
    })
    return conteo > 0
  }
}

export const componenteService = new ComponenteService()
