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

export interface RegistrarTipoEquipoDTO{
    nombre: string
    descripcion: string
}

export interface RegistrarUbicacionTecnicaDTO{
    nombre: string
    descripcion: string
}

export interface RegistrarUbicacionTecnicaDTO{
    nombre: string
    descripcion: string
}
