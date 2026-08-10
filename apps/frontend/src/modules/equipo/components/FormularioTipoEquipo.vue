<script setup lang="ts">
import { ref, watch } from 'vue'
import { tipoEquipoRules } from '../validations/equipo'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import type { RegistrarTipoEquipoDTO } from '../equipo.store'

const props = defineProps<{
    datosIniciales: Partial<RegistrarTipoEquipoDTO>
    cargando: boolean
    textoBoton: string
}>()

const emit = defineEmits<{
    (e: 'submit', datos: RegistrarTipoEquipoDTO): void
    (e: 'cancelar'): void
}>()

const formRef = ref<VuetifyForm | null>(null)
const formulario = ref<Partial<RegistrarTipoEquipoDTO>>({ ...props.datosIniciales })

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
    if (valid) {
        emit('submit', formulario.value as RegistrarTipoEquipoDTO)
    }
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="manejarEnvio">
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="formulario.nombre"
                    :rules="tipoEquipoRules.nombre"
                    label="Nombre del Tipo"
                    variant="outlined"
                    :disabled="cargando"
                    required
                />
            </v-col>

            <v-col cols="12" md="6">
                <v-textarea
                    v-model="formulario.descripcion"
                    label="Descripción (opcional)"
                    variant="outlined"
                    rows="2"
                    auto-grow
                    :disabled="cargando"
                />
            </v-col>
        </v-row>

        <v-card-actions class="px-0 mt-4">
            <v-spacer />
            <v-btn color="grey" variant="text" class="mr-2" @click="emit('cancelar')" :disabled="cargando">
                Cancelar
            </v-btn>
            <v-btn type="submit" color="primary" variant="flat" :loading="cargando" :disabled="cargando">
                {{ textoBoton }}
            </v-btn>
        </v-card-actions>
    </v-form>
</template>
