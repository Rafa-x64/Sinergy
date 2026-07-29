//equipos
export interface RegistrarEquipoDTO{
    codigo: string
    nombre: string
    serial: string
    marca: string
    modelo: string
    estadoOperativo: 'OPERATIVO' | 'INOPERATIVO'
    observacion: string
    creadoEn: Date
    actualizadoEn: Date
    lineaId: number
    tipoEquipoId: number
}
//params
export interface Params{
    id: string
}
//tipos
export interface RegistrarTipoDTO{
    nombre: string
    descripcion?: string
}

export interface EditarTipoDTO{
    nombre?: string,
    descripcion?: string
}
