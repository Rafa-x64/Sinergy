import prisma from '../../core/prisma'
import { EditarTipoDTO, RegistrarTipoDTO } from './equipo.schemas'

class EquipoService {
    async obtenerEquipos (){
        return prisma.equipo.findMany()
    }

    async crearTipo(tipo: RegistrarTipoDTO){
        return prisma.tipoEquipo.create({
            data: tipo
        })
    }

    async obtenerTipos(){
        return prisma.tipoEquipo.findMany()
    }

    async editarTipo(datos: EditarTipoDTO, id: number){
        return prisma.tipoEquipo.update({
            where: { id },
            data: datos
        })
    }

    async eliminarTipo(id: number){
        return prisma.tipoEquipo.delete({
            where: { id }
        })
    }

    async buscarTipoId(id: number){
        return prisma.tipoEquipo.findUnique({
            where: { id }
        })
    }
}

export const equipoService = new EquipoService()
