const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export type ValidationRule = (value: unknown) => boolean | string

export interface UsuarioRules {
    nombre: ValidationRule[]
    apellido: ValidationRule[]
    email: ValidationRule[]
    nombreUsuario: ValidationRule[]
    password: (esEdicion?: boolean) => ValidationRule[]
    rolId: ValidationRule[]
}

export const usuarioRules: UsuarioRules = {
    nombre: [
        (v) => (typeof v === 'string' && v.trim().length > 0) || 'El nombre es requerido'
    ],
    apellido: [
        (v) => (typeof v === 'string' && v.trim().length > 0) || 'El apellido es requerido'
    ],
    email: [
        (v) => (typeof v === 'string' && v.trim().length > 0) || 'El correo electrónico es requerido',
        (v) => (typeof v === 'string' && REGEX_EMAIL.test(v.trim())) || 'El formato del correo electrónico no es válido'
    ],
    nombreUsuario: [
        (v) => (typeof v === 'string' && v.trim().length > 0) || 'El nombre de usuario es requerido'
    ],
    password: (esEdicion = false) => [
        (v) => {
            if (esEdicion && (!v || (typeof v === 'string' && v.trim() === ''))) {
                return true
            }
            if (typeof v !== 'string' || v.length < 6) {
                return 'La contraseña debe tener al menos 6 caracteres'
            }
            return true
        }
    ],
    rolId: [
        (v) => (typeof v === 'number' && Number.isInteger(v) && v > 0) || 'El campo rol es requerido'
    ]
}
