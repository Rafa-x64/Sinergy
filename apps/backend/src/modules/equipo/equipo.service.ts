import prisma from '../../core/prisma'

class EquipoService {
    async leer (){
        return prisma.equipo.findMany()
    }
}

export const equipoService = new EquipoService()
