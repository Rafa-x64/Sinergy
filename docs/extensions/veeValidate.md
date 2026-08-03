# VeeValidate + Yup en Sinergy - Guía Completa y Tutorial de Uso

VeeValidate 4 junto con Yup es el estándar seleccionado para la gestión de formularios y validaciones complejas de entrada en el cliente. Permite mantener lógica de validación declarativa, reactiva y desacoplada de la interfaz.

---

## 1. Instalación de Paquetes

```powershell
# En el frontend (apps/frontend)
pnpm --filter @sinergy/frontend add vee-validate@4.12.4 yup@1.4.0
```

---

## 2. Definición de Esquemas Yup (`src/schemas/`)

Siempre se debe definir el esquema de validación Yup en un archivo desacoplado dentro de `apps/frontend/src/schemas/`.

```typescript
// apps/frontend/src/schemas/inspeccionSchema.ts
import * as yup from 'yup'

export const inspeccionSchema = yup.object({
  equipoId: yup
    .number()
    .required('Debe seleccionar un equipo')
    .positive('ID de equipo no válido'),
  temperatura: yup
    .number()
    .typeError('La temperatura debe ser un número')
    .required('La temperatura es obligatoria')
    .min(-50, 'Temperatura mínima -50°C')
    .max(200, 'Temperatura máxima 200°C'),
  presion: yup
    .number()
    .typeError('La presión debe ser un número')
    .required('La presión es obligatoria')
    .min(0, 'La presión no puede ser negativa'),
  observaciones: yup
    .string()
    .max(500, 'Máximo 500 caracteres')
    .nullable()
})

export type InspeccionFormValues = yup.InferType<typeof inspeccionSchema>
```

---

## 3. Integración con Vue 3 `<script setup>` y Vuetify 3

VeeValidate expone los composables `useForm` y `useField`. Estos se vinculan directamente a los componentes de Vuetify 3 usando la prop `:error-messages`:

```vue
<!-- apps/frontend/src/views/NuevaInspeccionView.vue -->
<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { inspeccionSchema, type InspeccionFormValues } from '@/schemas/inspeccionSchema'
import { useNotifications } from '@/composables/useNotifications'

const { notifySuccess, notifyError } = useNotifications()

// 1. Inicializar Formulario con Esquema Yup
const { handleSubmit, errors, isSubmitting, resetForm } = useForm<InspeccionFormValues>({
  validationSchema: inspeccionSchema,
  initialValues: {
    equipoId: undefined,
    temperatura: 25,
    presion: 1,
    observaciones: ''
  }
})

// 2. Definir Campos Reactivos
const { value: equipoId } = useField<number>('equipoId')
const { value: temperatura } = useField<number>('temperatura')
const { value: presion } = useField<number>('presion')
const { value: observaciones } = useField<string>('observaciones')

// 3. Handler de Envió (Solo se ejecuta si el formulario es válido)
const onSubmit = handleSubmit(async (values) => {
  try {
    console.log('Datos válidos enviados:', values)
    notifySuccess('Inspección registrada con éxito')
    resetForm()
  } catch (error) {
    notifyError('Error al guardar la inspección')
  }
})
</script>

<template>
  <v-card elevation="2" max-width="600" class="mx-auto pa-4">
    <v-card-title class="d-flex align-center gap-2">
      <v-icon icon="mdi-clipboard-plus-outline" color="primary" />
      Nueva Inspección Técnica
    </v-card-title>

    <v-card-text>
      <v-form @submit.prevent="onSubmit">
        <!-- Campo Equipo ID -->
        <v-text-field
          v-model.number="equipoId"
          label="ID de Equipo"
          type="number"
          variant="outlined"
          :error-messages="errors.equipoId"
          prepend-inner-icon="mdi-engine"
          class="mb-2"
        />

        <!-- Campo Temperatura -->
        <v-text-field
          v-model.number="temperatura"
          label="Temperatura (°C)"
          type="number"
          variant="outlined"
          :error-messages="errors.temperatura"
          prepend-inner-icon="mdi-thermometer"
          class="mb-2"
        />

        <!-- Campo Presión -->
        <v-text-field
          v-model.number="presion"
          label="Presión (Bar)"
          type="number"
          variant="outlined"
          :error-messages="errors.presion"
          prepend-inner-icon="mdi-gauge"
          class="mb-2"
        />

        <!-- Campo Observaciones -->
        <v-textarea
          v-model="observaciones"
          label="Observaciones"
          variant="outlined"
          rows="3"
          :error-messages="errors.observaciones"
          prepend-inner-icon="mdi-comment-text-outline"
          class="mb-2"
        />

        <div class="d-flex justify-end gap-2 mt-4">
          <v-btn variant="text" @click="resetForm()">Limpiar</v-btn>
          <v-btn
            type="submit"
            color="primary"
            :loading="isSubmitting"
            prepend-icon="mdi-content-save"
          >
            Guardar Inspección
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>
```

---

## 4. Validaciones Asíncronas (Ejemplo: Código Único)

Yup permite validaciones asíncronas para consultar APIs antes de enviar el formulario:

```typescript
import * as yup from 'yup'
import http from '@/utils/http'

export const equipoSchema = yup.object({
  codigo: yup
    .string()
    .required('El código es obligatorio')
    .test('codigo-unico', 'Este código de equipo ya existe', async (value) => {
      if (!value) return true
      try {
        const { data } = await http.get(`/equipos/validar-codigo?codigo=${value}`)
        return data.disponible // Retorna true si está libre
      } catch {
        return false
      }
    })
})
```
