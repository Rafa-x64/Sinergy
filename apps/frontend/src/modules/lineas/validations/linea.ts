const REGEX_CODIGO_LINEA = /^\d{4}-[A-Z]{3}-[A-Z]{4}-[A-Z0-9]{4}$/

type ValidationRule = (value: string | null | undefined) => boolean | string;

interface LineaRules {
    codigo: ValidationRule[];
    nombre: ValidationRule[];
}

export const lineaRules: LineaRules = {
    codigo: [
        (v) => !!v || 'El código es obligatorio.',
        (v) => REGEX_CODIGO_LINEA.test(v || '') || 'Formato inválido. Ejemplo esperado: 1234-ABC-DEFG-HIJK.'
    ],
    nombre: [
        (v) => !!v || 'El nombre es obligatorio.',
        (v) => (v ? v.trim().length >= 3 : false) || 'El nombre debe tener al menos 3 caracteres.',
        (v) => (v ? v.length <= 255 : false) || 'El nombre no debe exceder los 255 caracteres.'
    ],
};
