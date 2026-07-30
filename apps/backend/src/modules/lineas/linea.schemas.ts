export interface RegistrarLineaDTO {
  codigo: string;
  nombre: string;
  plantaId: number;
}

export interface EditarLineaDTO {
  codigo?: string;
  nombre?: string;
  plantaId?: number;
  activa?: boolean;
}

export interface ParamsLinea {
  id: string;
}

export interface QueryLinea {
  plantaId?: string;
  activa?: string;
}
