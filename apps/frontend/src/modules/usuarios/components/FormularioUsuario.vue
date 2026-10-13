<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usuarioRules } from '../validations/usuario'
import type { VuetifyForm } from '../../../core/types/vuetifyForm'
import type { RegistrarUsuarioDTO } from '../usuarios.store'
import type { Rol } from '../../auth/roles.store'
import type { Planta } from '../../plantas/plantas.store'

interface SupervisorOption {
    id: number
    nombre: string
    apellido: string
}

const props = withDefaults(
    defineProps<{
        datosIniciales: Partial<RegistrarUsuarioDTO>
        cargando: boolean
        textoBoton: string
        roles: Rol[]
        plantas: Planta[]
        supervisores: SupervisorOption[]
        esEdicion?: boolean
    }>(),
    {
        roles: () => [],
        plantas: () => [],
        supervisores: () => [],
        esEdicion: false
    }
)

const emit = defineEmits<{
    (e: 'submit', datos: RegistrarUsuarioDTO): void
    (e: 'cancelar'): void
}>()

const formRef = ref<VuetifyForm | null>(null)
const formulario = ref<Partial<RegistrarUsuarioDTO>>({ ...props.datosIniciales })
const plantasSeleccionadas = ref<number[]>([])

const rolSeleccionado = computed<Rol | undefined>(() =>
    props.roles.find((r) => r.id === formulario.value.rolId)
)

const esRolAdmin = computed<boolean>(() => {
    const nombre = (rolSeleccionado.value?.nombre || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
    return nombre.includes('ADMINISTRADOR')
})

const esSupervisorObligatorio = computed<boolean>(() => {
    if (!rolSeleccionado.value) return false
    const nombre = (rolSeleccionado.value.nombre || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
    return (
        (rolSeleccionado.value.requiereSupervisor &&
            !nombre.includes('SUPERVISOR') &&
            !nombre.includes('ADMINISTRADOR')) ||
        nombre.includes('TECNICO')
    )
})

watch(
    () => props.datosIniciales,
    (nuevosDatos) => {
        formulario.value = { ...nuevosDatos }
        if (nuevosDatos.plantasIds && nuevosDatos.plantasIds.length > 0) {
            plantasSeleccionadas.value = [...nuevosDatos.plantasIds]
        } else if (nuevosDatos.plantaId) {
            plantasSeleccionadas.value = [nuevosDatos.plantaId]
        } else {
            plantasSeleccionadas.value = []
        }
    },
    { deep: true, immediate: true }
)

const manejarEnvio = async (): Promise<void> => {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()

    if (valid) {
        const payload: RegistrarUsuarioDTO = {
            ...(formulario.value as RegistrarUsuarioDTO),
            plantasIds: plantasSeleccionadas.value,
            plantaId: plantasSeleccionadas.value[0] ?? null
        }
        emit('submit', payload)
    }
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="manejarEnvio">
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.nombre" :rules="usuarioRules.nombre" label="Nombre" variant="outlined"
                    :disabled="cargando" required></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.apellido" :rules="usuarioRules.apellido" label="Apellido"
                    variant="outlined" :disabled="cargando" required></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.email" :rules="usuarioRules.email" label="Correo Electrónico"
                    type="email" variant="outlined" :disabled="cargando" required></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.nombreUsuario" :rules="usuarioRules.nombreUsuario"
                    label="Nombre de Usuario" variant="outlined" :disabled="cargando" required></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field v-model="formulario.password" :rules="usuarioRules.password(esEdicion)" label="Contraseña"
                    type="password" variant="outlined" :disabled="cargando"
                    :hint="esEdicion ? 'Dejar en blanco para mantener la contraseña actual' : ''"
                    persistent-hint></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
                <v-select v-model="formulario.rolId" :items="roles" item-title="nombre" item-value="id"
                    label="Rol Asignado" variant="outlined" :rules="usuarioRules.rolId" :disabled="cargando"
                    required></v-select>
            </v-col>

            <v-col cols="12" md="6">
                <v-select
                    v-model="plantasSeleccionadas"
                    :items="plantas"
                    item-title="nombre"
                    item-value="id"
                    label="Plantas Asignadas (Multi-planta)"
                    variant="outlined"
                    multiple
                    chips
                    closable-chips
                    clearable
                    :disabled="cargando"
                    :hint="esRolAdmin ? 'Dejar vacío para acceso global a todas las plantas' : 'Selecciona una o más plantas a las que tendrá acceso el usuario'"
                    persistent-hint
                ></v-select>
            </v-col>

            <v-col cols="12" md="6">
                <v-select
                    v-model="formulario.supervisorId"
                    :items="supervisores"
                    :item-title="(item: SupervisorOption) => `${item.nombre} ${item.apellido}`"
                    item-value="id"
                    label="Supervisor Asignado"
                    variant="outlined"
                    clearable
                    :disabled="cargando"
                    :rules="esSupervisorObligatorio ? [(v: number | null | undefined) => (v !== null && v !== undefined) || 'Debe asignar un supervisor'] : []"
                    :hint="esSupervisorObligatorio ? 'Obligatorio para técnicos' : 'Opcional (puede ser supervisado por otro supervisor o administrador)'"
                    persistent-hint
                ></v-select>
            </v-col>

            <v-col cols="12" md="6">
                <v-switch v-model="formulario.activo" color="success" label="Usuario Activo" hide-details
                    :disabled="cargando"></v-switch>
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
