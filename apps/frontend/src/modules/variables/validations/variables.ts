type Rule = (value: string | number | null | undefined) => boolean | string

export const variableRules = {
  nombre: [
    (v: string | null | undefined) => !!v || 'El nombre es obligatorio.',
    (v: string | null | undefined) => (v ? String(v).trim().length >= 3 : false) || 'El nombre debe tener al menos 3 caracteres.',
    (v: string | null | undefined) => (v ? String(v).length <= 255 : false) || 'El nombre no puede superar los 255 caracteres.'
  ],
  tipoEvaluacion: [
    (v: string | null | undefined) => !!v || 'El tipo de evaluación es obligatorio.'
  ],
  unidad: [
    (v: string | null | undefined) => !v || String(v).trim().length <= 20 || 'La unidad no puede superar los 20 caracteres.'
  ],
  opcionesTexto: [
    (v: string | null | undefined) => !!v && v.trim().length > 0 || 'Debes ingresar al menos una opción de selección (CLAVE: Etiqueta).',
    (v: string | null | undefined) => {
      if (!v || !v.trim()) return true
      const lineas = v.split('\n').filter((l) => l.trim().length > 0)
      if (lineas.length === 0) return 'Debes definir al menos una opción.'
      const invalidas = lineas.some((l) => !l.includes(':') && l.trim().length === 0)
      return !invalidas || 'Cada opción debe tener el formato CLAVE: Etiqueta (ej. N: Normal)'
    }
  ]
}

export const jerarquiaRules = {
  codigo: [
    (v: string | null | undefined) => !!v || 'El código es obligatorio.',
    (v: string | null | undefined) => (v ? String(v).trim().length >= 2 : false) || 'El código debe tener al menos 2 caracteres.',
    (v: string | null | undefined) => (v ? String(v).length <= 100 : false) || 'El código no puede superar los 100 caracteres.'
  ],
  nombre: [
    (v: string | null | undefined) => !!v || 'El nombre es obligatorio.',
    (v: string | null | undefined) => (v ? String(v).trim().length >= 3 : false) || 'El nombre debe tener al menos 3 caracteres.',
    (v: string | null | undefined) => (v ? String(v).length <= 255 : false) || 'El nombre no puede superar los 255 caracteres.'
  ],
  nombreComponente: [
    (v: string | null | undefined) => !!v || 'El nombre del componente es obligatorio.',
    (v: string | null | undefined) => (v ? String(v).trim().length >= 2 : false) || 'El nombre debe tener al menos 2 caracteres.',
    (v: string | null | undefined) => (v ? String(v).length <= 255 : false) || 'El nombre no puede superar los 255 caracteres.'
  ],
  tipoEquipoId: [
    (v: number | null | undefined) => !!v || 'Debes seleccionar el tipo de equipo.'
  ]
}
