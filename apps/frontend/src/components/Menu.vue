<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import SinergyChip from './SinergyChip.vue'
import { useAuthStore } from '../modules/auth/auth.store'
import { useNotificationStore } from '../modules/notificaciones/notificaciones.store'
import NotificationBell from '../modules/notificaciones/components/NotificationBell.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()

const { ocultarLayout } = defineProps<{
    ocultarLayout: boolean
}>()

const isDesktop = useMediaQuery('(min-width: 960px)')

onMounted(() => {
    const token = authStore.accessToken

    if (token) {
        notificationStore.cargarNotificaciones(token)
        notificationStore.conectarWebSocket(token)
    }
})

onUnmounted(() => {
    notificationStore.desconectarWebSocket()
})

interface ModuloItem {
    title: string
    icon: string
    to: string
    roles?: string[]
}

const ROLES_ADMIN = ['Administrador del Sistema']
const ROLES_ADMIN_SUPERVISOR = ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento']
const ROLES_TODOS = ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento', 'Técnico de Mantenimiento']

const modulos: ModuloItem[] = [
    { title: 'Principal', icon: 'mdi-view-dashboard', to: '/dashboard' },
    { title: 'Equipos', icon: 'mdi-engine', to: '/equipos', roles: ROLES_ADMIN_SUPERVISOR },
    { title: 'Montacargas', icon: 'mdi-forklift', to: '/montacargas', roles: ROLES_TODOS },
    { title: 'Compresor', icon: 'mdi-car-turbocharger', to: '/compresor', roles: ROLES_TODOS },
    { title: 'Generador', icon: 'mdi-generator-mobile', to: '/generador', roles: ROLES_TODOS },
    { title: 'Chiller', icon: 'mdi-snowflake', to: '/chiller', roles: ROLES_TODOS },
    { title: 'Componentes', icon: 'mdi-view-grid', to: '/componentes', roles: ROLES_ADMIN_SUPERVISOR },
    { title: 'Variables', icon: 'mdi-variable-box', to: '/variables', roles: ROLES_ADMIN_SUPERVISOR },
    { title: 'Inspecciones', icon: 'mdi-clipboard-check', to: '/inspecciones', roles: ROLES_TODOS },
    { title: 'Auditoría Global', icon: 'mdi-shield-account', to: '/notificaciones-globales', roles: ROLES_ADMIN },
    { title: 'Plantas', icon: 'mdi-factory', to: '/plantas', roles: ROLES_ADMIN_SUPERVISOR },
    { title: 'Ubicaciones Técnicas', icon: 'mdi-map-marker-radius', to: '/ubicaciones', roles: ROLES_ADMIN_SUPERVISOR },
    { title: 'Líneas Operativas', icon: 'mdi-chart-timeline', to: '/lineas', roles: ROLES_ADMIN_SUPERVISOR },
    { title: 'Usuarios', icon: 'mdi-account-group', to: '/usuarios', roles: ROLES_ADMIN_SUPERVISOR },
    { title: 'Roles', icon: 'mdi-account-key', to: '/roles', roles: ROLES_ADMIN },
]

const modulosVisibles = computed(() => {
    return modulos.filter((item) => authStore.tieneRol(item.roles))
})

const cerrarSesion = async (): Promise<void> => {
    try {
        notificationStore.desconectarWebSocket()
        const respuesta = await authStore.apiFetch('/auth/logout', { method: "POST" })

        if (!respuesta.ok) throw new Error("Error al comunicarse con el servidor")

        authStore.cerrarSesion()
        await router.push({ name: 'login' })

    } catch (error: unknown) {
        console.error("Fallo durante el cierre de sesión: ", error)
    }
}
</script>

<template>
    <!-- App Bar MÓVIL -->
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
                <v-list-item v-for="modulo in modulosVisibles" :key="modulo.title" :to="modulo.to"
                    :prepend-icon="modulo.icon" :title="modulo.title" />
                <v-list-item @click="cerrarSesion()" title="Cerrar Sesión" prepend-icon="mdi-logout-variant" />
            </v-list>
        </v-menu>

        <v-spacer></v-spacer>

        <NotificationBell v-if="authStore.accessToken" :user-token="authStore.accessToken" />

        <v-btn icon>
            <v-icon>mdi-account</v-icon>
        </v-btn>
    </v-app-bar>

    <!-- Drawer DESKTOP (Laptop) -->
    <v-navigation-drawer permanent :width="300" v-if="!ocultarLayout && isDesktop">
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
                <v-list-item prepend-icon="mdi-account-circle" :title="authStore.usuario?.email || 'Usuario'"
                    :subtitle="authStore.roles.length > 0 ? authStore.roles.join(', ') : 'Sin Rol'">
                    <template v-slot:append>
                        <NotificationBell v-if="authStore.accessToken" :user-token="authStore.accessToken" />
                    </template>
                </v-list-item>
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
