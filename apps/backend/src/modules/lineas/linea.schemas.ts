export interface RegistrarLineaDTO {
  codigo: string;
  nombre: string;
  ubicacionTecnicaId: number;
}

export interface EditarLineaDTO {
  codigo?: string;
  nombre?: string;
  ubicacionTecnicaId?: number;
  activa?: boolean;
}

export interface ParamsLinea {
  id: string;
}

export interface QueryLinea {
  ubicacionTecnicaId?: string;
  activa?: string;
}
