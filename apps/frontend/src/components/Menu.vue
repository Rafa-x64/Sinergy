<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
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

watch(
    () => authStore.accessToken,
    (nuevoToken) => {
        if (nuevoToken) {
            notificationStore.cargarNotificaciones(nuevoToken)
            notificationStore.conectarWebSocket(nuevoToken)
            if (authStore.esAdmin) {
                notificationStore.cargarNotificacionesGlobales(nuevoToken)
            }
        } else {
            notificationStore.desconectarWebSocket()
        }
    },
    { immediate: true }
)

onUnmounted(() => {
    notificationStore.desconectarWebSocket()
})

interface ModuloItem {
    title: string
    icon: string
    color?: string,
    to: string
    roles?: string[]
}

const ROLES_ADMIN = ['Administrador del Sistema']
const ROLES_ADMIN_SUPERVISOR = ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento']
const ROLES_TODOS = ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento', 'Técnico de Mantenimiento']

const modulos: ModuloItem[] = [
    { title: 'Principal', icon: 'mdi-view-dashboard', color: 'info', to: '/dashboard' },
    { title: 'Equipos', icon: 'mdi-engine', color: 'safety-orange', to: '/equipos', roles: ROLES_TODOS },
    { title: 'Montacargas', icon: 'mdi-forklift', color: 'safety-orange-light', to: '/montacargas', roles: ROLES_TODOS },
    { title: 'Compresor', icon: 'mdi-car-turbocharger', color: 'safety-orange-light', to: '/compresor', roles: ROLES_TODOS },
    { title: 'Generador', icon: 'mdi-generator-mobile', color: 'safety-orange-light', to: '/generador', roles: ROLES_TODOS },
    { title: 'Chiller', icon: 'mdi-snowflake', color: 'safety-orange-light', to: '/chiller', roles: ROLES_TODOS },
    { title: 'Componentes', icon: 'mdi-view-grid', color: 'success', to: '/componentes', roles: ROLES_TODOS },
    { title: 'Variables', icon: 'mdi-variable-box', color: 'primary', to: '/variables', roles: ROLES_TODOS },
    { title: 'Inspecciones', icon: 'mdi-clipboard-check', color: '#5cb85c', to: '/inspecciones', roles: ROLES_TODOS },
    { title: 'Lubricación', icon: 'mdi-oil', color: 'amber-darken-2', to: '/lubricacion', roles: ROLES_TODOS },
    { title: 'Reportes Lubricación', icon: 'mdi-chart-box-outline', color: 'amber', to: '/lubricacion/reportes', roles: ROLES_TODOS },
    { title: 'Auditoría Global', icon: 'mdi-shield-account', color: 'primary-dark', to: '/notificaciones-globales', roles: ROLES_ADMIN },
    { title: 'Plantas', icon: 'mdi-factory', color: 'text-principal', to: '/plantas', roles: ROLES_ADMIN_SUPERVISOR },
    { title: 'Ubicaciones Técnicas', icon: 'mdi-map-marker-radius', color: '#f7474a', to: '/ubicaciones', roles: ROLES_ADMIN_SUPERVISOR },
    { title: 'Usuarios', icon: 'mdi-account-group', color: 'purple', to: '/usuarios', roles: ROLES_ADMIN },
    { title: 'Roles', icon: 'mdi-account-key', color: 'purple-light', to: '/roles', roles: ROLES_ADMIN },
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
                <v-list-item v-for="modulo in modulosVisibles" :key="modulo.title" :color="modulo.color" :to="modulo.to"
                    :prepend-icon="modulo.icon" :title="modulo.title" />
                <v-list-item @click="cerrarSesion()" title="Cerrar Sesión" prepend-icon="mdi-logout-variant"
                    class="logout" />
            </v-list>
        </v-menu>

        <v-spacer></v-spacer>

        <NotificationBell v-if="authStore.accessToken" :user-token="authStore.accessToken" color="warning" />

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
        <v-list-item v-for="modulo in modulosVisibles" :color="modulo.color" :key="modulo.icon" link :to="modulo.to"
            :title="modulo.title" :prepend-icon="modulo.icon" />
        <v-list-item @click="cerrarSesion()" title="Cerrar Sesión" prepend-icon="mdi-logout-variant" class="logout" />

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
                <v-footer class="text-secondary d-flex flex-row justify-content-around mx-5 fw-bold">
                    <span>
                        2026
                    </span>
                    <span>
                        —
                    </span>
                    <span class="text-primary fw-bold">
                        Sinergy
                        <v-icon color="#42B883">mdi-vuetify</v-icon>
                    </span>
                </v-footer>
            </v-list-item>
        </template>
    </v-navigation-drawer>
</template>
<style scoped>
.logout {
    transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logout:hover {
    background-color: v-bind('$vuetify.theme.current.colors["error"]');
    color: v-bind('$vuetify.theme.current.colors["secondary-light"]');
}

.logout:hover :deep(.v-icon) {
    color: v-bind('$vuetify.theme.current.colors["secondary-light"]') !important;
}

.logout :deep(.v-icon) {
    transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
