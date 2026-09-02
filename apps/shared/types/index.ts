export interface ApiResponse<T = undefined> {
  status: 'ok' | 'error'
  message?: string
  data?: T
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number
    pagina: number
    porPagina: number
    totalPaginas: number
  }
}

export interface UsuarioAutenticado {
  id: number
  nombre: string
  apellido: string
  email: string
  roles: string[]
}

// tipo de control de filtro
export type TipoControlFiltro = 'text' | 'select' | 'date' | 'boolean';

// interfaz para los selects
export interface OpcionSelect<T = string | number> {
  titulo: string;
  valor: T;
}

// configuracion inicial para los campos del filtro generico
export interface ConfiguracionCampoFiltro<TKey extends string = string> {
  key: TKey; // identificador unico del campo
  nombre: string; // contenido del label
  tipo: TipoControlFiltro; // que tipo de control es?
  placeholder?: string;
  valorDefault?: string | number | boolean | null; // valor preestablecido
  opciones?: OpcionSelect[]; // Se asume el default <string | number>
  inhabilitado?: boolean;
  retrasoMs?: number; // pequeño retraso para no saturar con peticiones
  ancho?: number; // tamaño en columnas de 1-12
}

export type ContenidoFiltro = Record<string, string | number | boolean>;
