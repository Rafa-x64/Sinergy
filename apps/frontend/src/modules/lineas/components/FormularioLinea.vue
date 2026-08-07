<script setup lang="ts">
import { ref, watch } from 'vue'
import { ubicacionRules } from '../validations/linea'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import type { RegistrarUbicacionDTO } from '../lineas.store'

// Definimos una interfaz local mínima para las plantas que necesita el select
export interface PlantaSelect {
    id: number
    nombre: string
}

const props = defineProps<{
    datosIniciales: Partial<RegistrarUbicacionDTO>
    cargando: boolean
    textoBoton: string
    plantas: PlantaSelect[] // Nueva prop inyectada por el padre
}>()

const emit = defineEmits<{
    (e: 'submit', datos: RegistrarUbicacionDTO): void
    (e: 'cancelar'): void
}>()

const formRef = ref<VuetifyForm | null>(null)
const formulario = ref<Partial<RegistrarUbicacionDTO>>({ ...props.datosIniciales })

watch(() => props.datosIniciales, (nuevosDatos) => {
    formulario.value = { ...nuevosDatos }
}, { deep: true })

const manejarEnvio = async () => {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()

    if (valid) {
        emit('submit', formulario.value as RegistrarUbicacionDTO)
    }
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="manejarEnvio">
        <v-row>
            <!-- Campos existentes -->
            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.codigo" :rules="ubicacionRules.codigo" label="Código de la Ubicacion"
                    variant="outlined" required :disabled="cargando"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.nombre" :rules="ubicacionRules.nombre" label="Nombre de la Ubicacion"
                    variant="outlined" required :disabled="cargando"></v-text-field>
            </v-col>

            <!-- Nuevo selector de Plantas -->
            <v-col cols="12" md="6">
                <v-select v-model="formulario.plantaId" :items="plantas" item-title="nombre" item-value="id"
                    label="Planta Asociada" variant="outlined" :rules="[v => !!v || 'La planta es obligatoria']"
                    :disabled="cargando" required></v-select>
            </v-col>

            <v-col cols="12" md="6">
                <v-switch v-model="formulario.activa" color="success" label="Estado de la Ubicacion (Activa)"
                    hide-details :disabled="cargando"></v-switch>
            </v-col>
            <v-col cols="12">
                <v-textarea v-model="formulario.descripcion" :rules="ubicacionRules.descripcion"
                    label="Descripción de la Ubicación" variant="outlined" :disabled="cargando" rows="3"></v-textarea>
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
