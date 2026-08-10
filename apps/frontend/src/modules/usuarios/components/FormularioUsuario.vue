<script setup lang="ts">
import { ref, watch } from 'vue'
import { usuarioRules } from '../validations/usuario'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import type { RegistrarUsuarioDTO } from '../usuarios.store'
import type { Rol } from '../../auth/roles.store'

const props = withDefaults(
    defineProps<{
        datosIniciales: Partial<RegistrarUsuarioDTO>
        cargando: boolean
        textoBoton: string
        roles: Rol[]
        esEdicion?: boolean
    }>(),
    {
        roles: () => [],
        esEdicion: false
    }
)

const emit = defineEmits<{
    (e: 'submit', datos: RegistrarUsuarioDTO): void
    (e: 'cancelar'): void
}>()

const formRef = ref<VuetifyForm | null>(null)
const formulario = ref<Partial<RegistrarUsuarioDTO>>({ ...props.datosIniciales })

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
        emit('submit', formulario.value as RegistrarUsuarioDTO)
    }
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="manejarEnvio">
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="formulario.nombre"
                    :rules="usuarioRules.nombre"
                    label="Nombre"
                    variant="outlined"
                    :disabled="cargando"
                    required
                ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field
                    v-model="formulario.apellido"
                    :rules="usuarioRules.apellido"
                    label="Apellido"
                    variant="outlined"
                    :disabled="cargando"
                    required
                ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field
                    v-model="formulario.email"
                    :rules="usuarioRules.email"
                    label="Correo Electrónico"
                    type="email"
                    variant="outlined"
                    :disabled="cargando"
                    required
                ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field
                    v-model="formulario.nombreUsuario"
                    :rules="usuarioRules.nombreUsuario"
                    label="Nombre de Usuario"
                    variant="outlined"
                    :disabled="cargando"
                    required
                ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field
                    v-model="formulario.password"
                    :rules="usuarioRules.password(esEdicion)"
                    label="Contraseña"
                    type="password"
                    variant="outlined"
                    :disabled="cargando"
                    :hint="esEdicion ? 'Dejar en blanco para mantener la contraseña actual' : ''"
                    persistent-hint
                ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-select
                    v-model="formulario.rolId"
                    :items="roles"
                    item-title="nombre"
                    item-value="id"
                    label="Rol Asignado"
                    variant="outlined"
                    :rules="usuarioRules.rolId"
                    :disabled="cargando"
                    required
                ></v-select>
            </v-col>

            <v-col cols="12" md="6">
                <v-switch
                    v-model="formulario.activo"
                    color="success"
                    label="Usuario Activo"
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
