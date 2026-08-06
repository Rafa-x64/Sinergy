<script setup lang="ts">
import { ref, watch } from 'vue'
import { registroRules } from '../validations/registro.ts'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import type { RegistrarPlantaDTO } from '../plantas.store'

// 1. Props: Lo que el componente padre nos envía (equivalente a los parámetros de una función en JS)
const props = defineProps<{
    datosIniciales: Partial<RegistrarPlantaDTO>
    cargando: boolean
    textoBoton: string
}>()

// 2. Emits: Los eventos que este componente dispara hacia el padre (equivalente a un callback)
const emit = defineEmits<{
    (e: 'submit', datos: RegistrarPlantaDTO): void
    (e: 'cancelar'): void
}>()

const formRef = ref<VuetifyForm | null>(null)
const formulario = ref<Partial<RegistrarPlantaDTO>>({ ...props.datosIniciales })

// Si los datos iniciales cambian (ej. el usuario selecciona otra planta), actualizamos el formulario local
watch(() => props.datosIniciales, (nuevosDatos) => {
    formulario.value = { ...nuevosDatos }
}, { deep: true })

const manejarEnvio = async () => {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()

    if (valid) {
        // Si es válido, emitimos el evento con los datos hacia arriba.
        // Obligamos mediante type assertion a que cumpla la interfaz DTO
        emit('submit', formulario.value as RegistrarPlantaDTO)
    }
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="manejarEnvio">
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.codigo" :rules="registroRules.codigo" label="Código de la Planta" variant="outlined" required :disabled="cargando"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.nombre" :rules="registroRules.nombre" label="Nombre de la Planta" variant="outlined" required :disabled="cargando"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-switch v-model="formulario.activa" color="success" label="Estado de la Planta (Activa)" hide-details :disabled="cargando"></v-switch>
            </v-col>
        </v-row>
        <v-card-actions class="px-0 mt-6">
            <v-spacer></v-spacer>
            <v-btn color="grey" variant="text" class="mr-2" @click="emit('cancelar')" :disabled="cargando">
                Cancelar
            </v-btn>
            <v-btn type="submit" color="primary" variant="flat" :loading="cargando" :disabled="cargando">
                {{ textoBoton }}
            </v-btn>
        </v-card-actions>
    </v-form>
</template>
