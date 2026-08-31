import prisma from '../../core/prisma'
import { RegistrarPlantaDTO, EditarPlantaDTO } from './planta.schemas'

class PlantaService {
    async obtener(plantaId?: number){
        if (plantaId !== undefined) {
            return prisma.planta.findMany({ where: { id: plantaId } })
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
