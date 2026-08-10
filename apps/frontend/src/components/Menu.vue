<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import SinergyChip from './SinergyChip.vue'
import { useAuthStore } from '../modules/auth/auth.store'

const authStore = useAuthStore()
const router = useRouter()

const { ocultarLayout } = defineProps<{
    ocultarLayout: boolean
}>()

const isDesktop = useMediaQuery('(min-width: 960px)')

interface ModuloItem {
    title: string
    icon: string
    to: string
    roles?: string[]
}

const modulos: ModuloItem[] = [
    { title: 'Principal', icon: 'mdi-view-dashboard', to: '/dashboard' },
    { title: 'Montacargas', icon: 'mdi-forklift', to: '/montacargas' },
    { title: 'Compresor', icon: 'mdi-car-turbocharger', to: '/compresor' },
    { title: 'Generador', icon: 'mdi-generator-mobile', to: '/generador' },
    { title: 'Chiller', icon: 'mdi-snowflake', to: '/chiller' },
    { title: 'Equipos', icon: 'mdi-engine', to: '/equipos' },
    { title: 'Inspecciones', icon: 'mdi-clipboard-check', to: '/inspecciones' },
    { title: 'Usuarios', icon: 'mdi-account-group', to: '/usuarios', roles: ['Administrador', 'Admin'] },
    { title: 'Plantas', icon: 'mdi-factory', to: '/plantas', roles: ['Administrador', 'Admin', 'Supervisor'] },
    { title: 'Ubicaciones Técnicas', icon: 'mdi-map-marker-radius', to: '/ubicaciones', roles: ['Administrador', 'Admin', 'Supervisor'] },
    { title: 'Líneas Operativas', icon: 'mdi-chart-timeline', to: '/lineas', roles: ['Administrador', 'Admin', 'Supervisor'] },
    { title: 'Roles', icon: 'mdi-account-key', to: '/roles', roles: ['Administrador', 'Admin'] },
    { title: 'Configuración', icon: 'mdi-cog', to: '/configuracion', roles: ['Administrador', 'Admin'] },
]

const modulosVisibles = computed(() => {
    return modulos.filter((item) => authStore.tieneRol(item.roles))
})

const cerrarSesion = async (): Promise<void> => {
    try {
        const respuesta = await authStore.apiFetch('/auth/logout', {
            method: "POST"
        })

        if (!respuesta.ok) {
            throw new Error("Error al comunicarse con el servidor")
        }

        const data = await respuesta.json()
        console.log("Servidor:", data.message)

        authStore.cerrarSesion()

        await router.push({ name: 'login' })

    } catch (error: unknown) {
        console.error("Fallo durante el cierre de sesión: ", error)
    }
}
</script>

<template>
    <!-- App Bar móvil -->
    <v-app-bar app v-if="!ocultarLayout && !isDesktop">
        <v-menu>
            <template v-slot:activator="{ props }">
                <v-btn v-bind="props" text>
                    <v-icon start>mdi-view-dashboard</v-icon>
                    Módulos
                    <v-icon end>mdi-menu-down</v-icon>
                </v-btn>
            </template>
            <v-list>
                <v-list-item v-for="modulo in modulosVisibles" :key="modulo.title" :to="modulo.to" :prepend-icon="modulo.icon"
                    :title="modulo.title" />
                <v-list-item @click="cerrarSesion()" title="Cerrar Sesión" prepend-icon="mdi-logout-variant" />
            </v-list>
        </v-menu>
        <v-spacer></v-spacer>
        <v-btn icon>
            <v-badge color="error" content="3">
                <v-icon>mdi-bell</v-icon>
            </v-badge>
        </v-btn>
        <v-btn icon>
            <v-icon>mdi-account</v-icon>
        </v-btn>
    </v-app-bar>

    <!-- Drawer desktop -->
    <v-navigation-drawer permanent :width="250" v-if="!ocultarLayout && isDesktop">
        <v-list-item class="py-2">
            <SinergyChip />
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item v-for="modulo in modulosVisibles" :key="modulo.icon" link :to="modulo.to" :title="modulo.title"
            :prepend-icon="modulo.icon" />
        <v-list-item @click="cerrarSesion()" title="Cerrar Sesión" prepend-icon="mdi-logout-variant" />
        <template v-slot:append>
            <v-divider></v-divider>
            <v-list density="compact" nav>
                <v-list-item prepend-icon="mdi-account-circle" :title="authStore.usuario?.email || 'Usuario'" :subtitle="authStore.roles.length > 0 ? authStore.roles.join(', ') : 'Sin Rol'" />
            </v-list>
            <v-list-item>
                <v-footer class="text-secondary d-flex flex-row justify-content-around">
                    <span>
                        2026 — Sinergy
                        <v-icon>mdi-vuetify</v-icon>
                    </span>
                </v-footer>
            </v-list-item>
        </template>
    </v-navigation-drawer>
</template>
