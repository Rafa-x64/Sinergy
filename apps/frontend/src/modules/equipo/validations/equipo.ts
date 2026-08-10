type Rule = (value: string | number | null | undefined) => boolean | string

export interface EquipoRules {
    codigo: Rule[]
    nombre: Rule[]
    tipoEquipoId: Rule[]
    serial: Rule[]
    marca: Rule[]
    modelo: Rule[]
}

export interface TipoEquipoRules {
    nombre: Rule[]
}

export const equipoRules: EquipoRules = {
    codigo: [
        (v) => !!v || 'El código del equipo es obligatorio.',
        (v) => (v ? String(v).trim().length >= 2 : false) || 'El código debe tener al menos 2 caracteres.',
        (v) => (v ? String(v).length <= 100 : false) || 'El código no puede superar los 100 caracteres.'
    ],
    nombre: [
        (v) => !!v || 'El nombre del equipo es obligatorio.',
        (v) => (v ? String(v).trim().length >= 3 : false) || 'El nombre debe tener al menos 3 caracteres.',
        (v) => (v ? String(v).length <= 255 : false) || 'El nombre no puede superar los 255 caracteres.'
    ],
    tipoEquipoId: [
        (v) => !!v || 'El tipo de equipo es obligatorio.'
    ],
    serial: [
        (v) => !v || String(v).length <= 100 || 'El serial no puede superar los 100 caracteres.'
    ],
    marca: [
        (v) => !v || String(v).length <= 100 || 'La marca no puede superar los 100 caracteres.'
    ],
    modelo: [
        (v) => !v || String(v).length <= 100 || 'El modelo no puede superar los 100 caracteres.'
    ]
}

export const tipoEquipoRules: TipoEquipoRules = {
    nombre: [
        (v) => !!v || 'El nombre del tipo es obligatorio.',
        (v) => (v ? String(v).trim().length >= 2 : false) || 'El nombre debe tener al menos 2 caracteres.',
        (v) => (v ? String(v).length <= 50 : false) || 'El nombre no puede superar los 50 caracteres.'
    ]
}
