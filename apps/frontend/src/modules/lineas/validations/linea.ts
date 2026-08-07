const REGEX_CODIGO_UBICACION = /^\d{4}-[A-Z]{3}-[A-Z]{4}$/

type ValidationRule = (value: string | null | undefined) => boolean | string;

interface UbicacionRules {
    codigo: ValidationRule[];
    nombre: ValidationRule[];
    descripcion: ValidationRule[];
}

export const ubicacionRules: UbicacionRules = {
    codigo: [
        (v) => !!v || 'El código es obligatorio.',
        (v) => REGEX_CODIGO_UBICACION.test(v || '') || 'Formato inválido. Ejemplo esperado: 1234-ABC-WXYZ.'
    ],
    nombre: [
        (v) => !!v || 'El nombre es obligatorio.',
        (v) => (v ? v.trim().length >= 3 : false) || 'El nombre debe tener al menos 3 caracteres.',
        (v) => (v ? v.length <= 255 : false) || 'El nombre no debe exceder los 255 caracteres.'
    ],
    descripcion: [
        (v) => {
            if (!v || v.trim() === '') return true;
            return v.length <= 1000 || 'La descripción no debe exceder los 1000 caracteres.';
        }
    ]
};
