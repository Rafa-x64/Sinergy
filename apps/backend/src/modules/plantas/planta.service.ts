import prisma from '../../core/prisma'

class PlantaService {
    async obtener(){
        return prisma.planta.findMany()
    }
}

export const plantaService = new PlantaService()
