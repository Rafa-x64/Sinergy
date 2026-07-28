import { z } from 'zod'

/**
 * Schema para POST /api/auth/login.
 * Normaliza email con trim y toLowerCase antes de la consulta a BD.
 */
export const loginSchema = z.object({
  email: z
    .string({ message: 'El email es requerido' })
    .trim()
    .toLowerCase()
    .email('El formato del email no es válido'),
  password: z
    .string({ message: 'La contraseña es requerida' })
    .min(1, 'La contraseña es requerida'),
})

/**
 * Schema para POST /api/auth/crear.
 */
export const crearUsuarioSchema = z.object({
  nombre: z
    .string({ message: 'El nombre es requerido' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100),
  apellido: z
    .string({ message: 'El apellido es requerido' })
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100),
  email: z
    .string({ message: 'El email es requerido' })
    .trim()
    .toLowerCase()
    .email('El formato del email no es válido')
    .max(150),
  password: z
    .string({ message: 'La contraseña es requerida' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  activo: z.boolean().optional().default(true),
})

/**
 * Schema para PATCH /api/auth/editar/:id.
 */
export const actualizarUsuarioSchema = crearUsuarioSchema
  .partial()
  .omit({ activo: true })
  .extend({
    activo: z.boolean().optional(),
  })

export type LoginDTO = z.infer<typeof loginSchema>
export type CrearUsuarioDTO = z.infer<typeof crearUsuarioSchema>
export type ActualizarUsuarioDTO = z.infer<typeof actualizarUsuarioSchema>
