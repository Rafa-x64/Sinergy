export const loginRules = {
    email: [
        (value: string): boolean | string => {
            if(!value) return 'El correo electronico es obligatorio';
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if(!regex.test(value))return 'El correo electronico no es valido'
            return true
        }
    ],
    password: [
        (value: string): boolean | string => {
            if(!value) return 'La contraseña es obligatoria'
            if(value.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
            return true
        }
    ]
}
