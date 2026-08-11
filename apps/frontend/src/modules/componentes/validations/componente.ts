export const componenteRules = {
    nombre: [
        (value: string): boolean | string => {
            if (!value) return 'El nombre del componente es obligatorio'
            if (value.length >= 255) return 'El nombre del componente es demasiado largo'
            return true
        }
    ],
    equipoId: [
        (value: number): boolean | string => {
            if(Number.isNaN(value)) return 'El identificador del equipo debe ser de tipo numerico'
            if(value <= 0) return 'El identificador del equipo debe ser un numero entero positivo mayor a 0'
            return true
        }
    ],
    ordenPosicion: [
        (value: number): boolean | string => {
            if(Number.isNaN(value)) return 'El orden de posicion debe ser de tipo numerico'
            if(value <= 0) return 'El orden de posicion debe ser un numero entero positivo mayor a 0'
            return true
        }
    ],
}
