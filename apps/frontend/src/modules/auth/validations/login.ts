export const loginRules = {
    nombreUsuario: [
        (value: string): boolean | string => {
            if (!value) return 'El nombre de usuario es obligatorio'
            if (value.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres'
            if (value.length > 20) return 'El nombre de usuario no puede tener más de 20 caracteres'
            if (/\s/.test(value)) return 'No puede contener espacios'
            return true
        }
    ],
    password: [
        (value: string): boolean | string => {
            if (!value) return 'La contraseña es obligatoria'
            if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
            return true
        }
    ]
}
