export const loginRules = {
    email: [
        (value: string): boolean | string => {
            if(!value) return 'el correo electronico es obligatorio';
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if(!regex.test(value))return 'el correo electronico no es valido'
            return true
        }
    ],
    password: [
        (value: string): boolean | string => {
            if(!value) return 'la contraseña es obligatoria'
            if(value.length < 6) return 'la contraseña debe tener al menos 6 caracteres'
            return true
        }
    ]
}
