export const registroRules = {
    codigo: [
        (value: string): boolean | string => {
            if(!value) return 'El codigo de la planta es obligatorio';
            return true;
        }
    ],
    nombre: [
        (value: string): boolean | string => {
            if(!value) return 'El nombre de la planta es obligatorio';
            return true;
        }
    ],
    activa: [
        (value: boolean): boolean | string => {
            if(!value) return 'Estado de planta indefinido';
            return true;
        }
    ]
}

