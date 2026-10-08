import prisma from '../../core/prisma'
import { RegistrarPlantaDTO, EditarPlantaDTO } from './planta.schemas'

class PlantaService {
    async obtener(plantaId?: number, plantasIds?: number[]){
        if (plantaId !== undefined) {
            return prisma.planta.findMany({ where: { id: plantaId } })
        }
        if (plantasIds && plantasIds.length > 0) {
            return prisma.planta.findMany({ where: { id: { in: plantasIds } } })
        }
        return prisma.planta.findMany()
    }
    async crearPlanta(datos: RegistrarPlantaDTO) {
        return prisma.planta.create({
            data: datos
        })
    }

    async editarPlanta(datos: EditarPlantaDTO, id: number) {
        return prisma.planta.update({
            where: { id },
            data: datos
        })
    }

    async eliminarPlanta(id: number) {
        return prisma.planta.update({
            where: { id },
            data:{
                activa: false
            }
        })
    }
}

export const plantaService = new PlantaService()
