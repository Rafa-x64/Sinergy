<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../notificaciones.store'
import type { Notification, NotificationType } from '../notificaciones.store'
import { useAuthStore } from '../../auth/auth.store'

const props = defineProps<{
    userToken: string
}>()

const notificationStore = useNotificationStore()
const authStore = useAuthStore()
const router = useRouter()
const menuAbierto = ref(false)

const esAdmin = computed(() => authStore.roles.some(r => r.toLowerCase().includes('admin')))

function obtenerColorBorder(tipo: NotificationType): string {
    switch (tipo) {
        case 'ERROR': return 'error'
        case 'WARNING': return 'warning'
        case 'ALERT': return 'amber-darken-2'
        case 'SUCCESS': return 'success'
        default: return 'info'
    }
}

function obtenerIconoTipo(tipo: NotificationType): string {
    switch (tipo) {
        case 'ERROR': return 'mdi-alert-circle'
        case 'WARNING': return 'mdi-clock-outline'
        case 'ALERT': return 'mdi-bell-ring'
        case 'SUCCESS': return 'mdi-check-circle'
        default: return 'mdi-information'
    }
}

async function manejarClickNotificacion(notif: Notification): Promise<void> {
    await notificationStore.marcarComoLeida(notif.id, props.userToken)

    if (notif.entidadAfectada === 'INSPECCION') {
        menuAbierto.value = false
        router.push('/inspecciones')
    }
}

async function marcarTodasLeidas(): Promise<void> {
    await notificationStore.marcarTodasComoLeidas(props.userToken)
}

function irAPanelGlobal(): void {
    menuAbierto.value = false
    router.push('/notificaciones-globales')
}
</script>

<template>
    <v-menu v-model="menuAbierto" :close-on-content-click="false" location="bottom end">

        <!-- Disparador: Botón de la Campana -->
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn icon v-bind="activatorProps" variant="text" class="position-relative">
                <v-badge :color="notificationStore.unreadCount > 0 ? 'error' : 'transparent'"
                    :content="notificationStore.unreadCount" :model-value="notificationStore.unreadCount > 0"
                    offset-x="4" offset-y="4">
                    <v-icon size="24" color="warning">mdi-bell</v-icon>
                </v-badge>
            </v-btn>
        </template>

        <!-- Contenido del Panel Desplegable -->
        <v-card min-width="340" max-width="420" max-height="500" class="overflow-y-auto rounded-lg elevation-8">
            <div class="text-subtitle-2 d-flex justify-space-between align-center bg-blue-grey-lighten-5 py-3 px-4 font-weight-bold">
                <div class="d-flex align-center ga-2">
                    <v-icon color="primary" size="small">mdi-bell</v-icon>
                    <span>Notificaciones</span>
                </div>
                <div class="d-flex align-center ga-2">
                    <v-chip size="x-small" :color="notificationStore.isConnected ? 'success' : 'grey'" variant="flat">
                        {{ notificationStore.isConnected ? 'En vivo' : 'Desconectado' }}
                    </v-chip>
                    <v-btn v-if="notificationStore.unreadCount > 0" size="x-small" variant="text" color="primary"
                        @click="marcarTodasLeidas">
                        Leídas
                    </v-btn>
                </div>
            </div>

            <v-divider></v-divider>

            <v-card-text v-if="notificationStore.notifications.length === 0"
                class="text-center text-body-2 text-grey py-8">
                <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-bell-off-outline</v-icon>
                <div>No tienes notificaciones registradas.</div>
            </v-card-text>

            <v-list v-else lines="three" density="compact" class="pa-0">
                <v-list-item v-for="notif in notificationStore.notifications" :key="notif.id"
                    @click="manejarClickNotificacion(notif)"
                    :class="['border-b', notif.leido ? 'bg-white opacity-70' : 'bg-blue-50']"
                    class="py-2">
                    <template v-slot:prepend>
                        <v-avatar size="32" :color="obtenerColorBorder(notif.tipo)" variant="tonal" class="mr-2">
                            <v-icon size="18">{{ obtenerIconoTipo(notif.tipo) }}</v-icon>
                        </v-avatar>
                    </template>

                    <v-list-item-title class="font-weight-bold text-caption d-flex justify-space-between">
                        <span>{{ notif.titulo }}</span>
                        <span v-if="!notif.leido" class="text-caption text-primary font-weight-bold">• Nuevo</span>
                    </v-list-item-title>

                    <v-list-item-subtitle class="text-caption mt-1" style="white-space: normal;">
                        {{ notif.mensaje }}
                    </v-list-item-subtitle>

                    <template v-slot:append>
                        <span class="text-caption text-grey align-self-start mt-1" style="font-size: 0.7rem !important;">
                            {{ new Date(notif.creadoEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                        </span>
                    </template>
                </v-list-item>
            </v-list>

            <v-divider v-if="esAdmin"></v-divider>

            <!-- Acceso al Panel Global para Admin -->
            <v-card-actions v-if="esAdmin" class="bg-grey-lighten-4 py-2 px-3">
                <v-btn block color="primary" variant="tonal" size="small" @click="irAPanelGlobal" prepend-icon="mdi-shield-account">
                    Panel Global de Auditoría (Admin)
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-menu>
</template>
