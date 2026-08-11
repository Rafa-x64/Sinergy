<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { componenteRules } from '../validations/componente'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import type { RegistrarComponenteDTO } from '../componente.store'
import type { Equipo } from '../../equipo/equipo.store'
import BuscadorEquipo from './BuscadorEquipo.vue'

const props = defineProps<{
    datosIniciales: Partial<RegistrarComponenteDTO>
    cargando: boolean
    textoBoton: string
    equipos: Equipo[]
}>()

const emit = defineEmits<{
    (e: 'submit', datos: RegistrarComponenteDTO): void
    (e: 'cancelar'): void
}>()

const toast = useToast()
const formRef = ref<VuetifyForm | null>(null)
const formulario = ref<Partial<RegistrarComponenteDTO>>({ ...props.datosIniciales })

watch(
    () => props.datosIniciales,
    (nuevosDatos) => {
        formulario.value = { ...nuevosDatos }
    },
    { deep: true }
)

const manejarEnvio = async (): Promise<void> => {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()

    if (!formulario.value.equipoId) {
        toast.warning('Debe seleccionar un equipo antes de continuar')
        return
    }

    if (!valid) {
        toast.warning('Por favor, complete todos los campos obligatorios')
        return
    }

    emit('submit', formulario.value as RegistrarComponenteDTO)
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="manejarEnvio">
        <v-row>
            <v-col cols="12" md="6">
                <BuscadorEquipo v-model="formulario.equipoId" :equipos="equipos" :disabled="cargando" />
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.nombre" :rules="componenteRules.nombre" label="Nombre de Componente"
                    variant="outlined" required :disabled="cargando"></v-text-field>
            </v-col>

            <v-col cols="12">
                <v-textarea v-model="formulario.descripcion" label="Descripción del Componente" variant="outlined"
                    :disabled="cargando"></v-textarea>
            </v-col>

            <v-col cols="12" md="6">
                <v-switch v-model="formulario.activo" color="success" label="Estado del componente (Activo)"
                    hide-details :disabled="cargando"></v-switch>
            </v-col>

            <v-col cols="12" md="6">
                <v-number-input v-model="formulario.ordenPosicion" label="Orden de posición del componente"
                    variant="outlined" :disabled="cargando" :min="0"></v-number-input>
            </v-col>
        </v-row>

        <v-card-actions class="px-0 mt-6">
            <v-spacer></v-spacer>
            <v-btn color="grey" variant="text" class="mr-2" @click="emit('cancelar')" :disabled="cargando">
                Cancelar
            </v-btn>
            <v-btn type="submit" color="primary" variant="flat" class="mr-2" :loading="cargando" :disabled="cargando">
                {{ textoBoton }}
            </v-btn>
        </v-card-actions>
    </v-form>
</template>

<style scoped></style>
