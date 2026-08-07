export interface RegistrarUbicacionDTO {
    codigo: string;
    nombre: string;
    descripcion?: string;
    plantaId: number;
}

export interface EditarUbicacionDTO {
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    plantaId?: number;
    activa?:boolean
}

export interface ParamsUbicacion {
    id: string;
}

export interface QueryUbicacion {
    plantaId?: string;
}
