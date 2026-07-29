export interface RegistrarPlantaDTO {
  codigo: string;
  nombre: string;
  activa?: boolean;
}

export interface EditarPlantaDTO {
  codigo?: string;
  nombre?: string;
  activa?: boolean;
}

export interface Params {
  id: string;
}
