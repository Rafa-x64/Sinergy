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
    return prisma.componente.create({
      data: datos,
      include: INCLUDE_COMPONENTE_RELACIONES
    })
  }

  async obtenerComponentes(filtros: FiltrosComponente) {
    const where: Prisma.ComponenteWhereInput = {}

    if (filtros.equipoId !== undefined) {
      where.equipoId = filtros.equipoId
    }

    where.activo = filtros.activo !== undefined ? filtros.activo : true

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
