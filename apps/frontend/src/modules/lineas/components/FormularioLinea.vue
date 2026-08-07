<script setup lang="ts">
import { ref, watch } from 'vue'
import { lineaRules } from '../validations/linea'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import type { RegistrarLineaDTO } from '../lineas.store'

export interface UbicacionSelect {
    id: number
    nombre: string
}

const props = withDefaults(
    defineProps<{
        datosIniciales: Partial<RegistrarLineaDTO>
        cargando: boolean
        textoBoton: string
        ubicaciones: UbicacionSelect[]
    }>(),
    {
        ubicaciones: () => []
    }
)

const emit = defineEmits<{
    (e: 'submit', datos: RegistrarLineaDTO): void
    (e: 'cancelar'): void
}>()

const formRef = ref<VuetifyForm | null>(null)
const formulario = ref<Partial<RegistrarLineaDTO>>({ ...props.datosIniciales })

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
        emit('submit', formulario.value as RegistrarLineaDTO)
    }
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="manejarEnvio">
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="formulario.codigo"
                    :rules="lineaRules?.codigo ?? []"
                    label="Código de la línea"
                    variant="outlined"
                    required
                    :disabled="cargando"
                ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field
                    v-model="formulario.nombre"
                    :rules="lineaRules?.nombre ?? []"
                    label="Nombre de la línea"
                    variant="outlined"
                    required
                    :disabled="cargando"
                ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-select
                    v-model="formulario.ubicacionTecnicaId"
                    :items="ubicaciones"
                    item-title="nombre"
                    item-value="id"
                    label="Ubicación Asociada"
                    variant="outlined"
                    :rules="[v => !!v || 'La ubicación es obligatoria']"
                    :disabled="cargando"
                    required
                ></v-select>
            </v-col>

            <v-col cols="12" md="6">
                <v-switch
                    v-model="formulario.activa"
                    color="success"
                    label="Estado de la Línea (Activa)"
                    hide-details
                    :disabled="cargando"
                ></v-switch>
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
