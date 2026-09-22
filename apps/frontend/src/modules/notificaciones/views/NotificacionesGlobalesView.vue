<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNotificationStore } from '../notificaciones.store'
import { useAuthStore } from '../../auth/auth.store'

const notificationStore = useNotificationStore()
const authStore = useAuthStore()

const filtroCategoria = ref<string>('TODAS')
const busqueda = ref<string>('')

onMounted(async () => {
    if (authStore.accessToken) {
        await notificationStore.cargarNotificacionesGlobales(authStore.accessToken)
        notificationStore.conectarWebSocket(authStore.accessToken)
    }
})

const notificacionesFiltradas = computed(() => {
    let lista = notificationStore.globalNotifications

    if (filtroCategoria.value !== 'TODAS') {
        lista = lista.filter(n => n.categoria === filtroCategoria.value)
    }

    if (busqueda.value.trim()) {
        const q = busqueda.value.toLowerCase()
        lista = lista.filter(n =>
            n.titulo.toLowerCase().includes(q) ||
            n.mensaje.toLowerCase().includes(q) ||
            (n.entidadAfectada && n.entidadAfectada.toLowerCase().includes(q))
        )
    }

    return lista
})

function obtenerColorCategoria(cat: string): string {
    switch (cat) {
        case 'INSPECCION_PENDIENTE': return 'warning'
        case 'INSPECCION_APROBADA': return 'success'
        case 'INSPECCION_RECHAZADA': return 'error'
        case 'AUDITORIA_SISTEMA': return 'info'
        default: return 'primary'
    }
}

function obtenerIconoCategoria(cat: string): string {
    switch (cat) {
        case 'INSPECCION_PENDIENTE': return 'mdi-clock-alert'
        case 'INSPECCION_APROBADA': return 'mdi-check-decagram'
        case 'INSPECCION_RECHAZADA': return 'mdi-close-octagon'
        case 'AUDITORIA_SISTEMA': return 'mdi-shield-check'
        default: return 'mdi-information'
    }
}

async function recargar(): Promise<void> {
    if (authStore.accessToken) {
        await notificationStore.cargarNotificacionesGlobales(authStore.accessToken)
    }
}
</script>

<template>
    <v-container fluid class="pa-2 pa-sm-4 pa-md-6">
        <!-- Encabezado -->
        <v-row class="mb-4">
            <v-col cols="12" class="d-flex justify-space-between align-center flex-wrap ga-3">
                <div>
                    <h1 class="text-h5 font-weight-bold d-flex align-center ga-2">
                        <v-icon color="primary">mdi-shield-account</v-icon>
                        Panel de Auditoría y Notificaciones Globales
                    </h1>
                    <p class="text-body-2 text-grey-darken-1 mb-0">
                        Supervisión en tiempo real de todas las actividades e inspecciones registradas en Sinergy.
                    </p>
                </div>
                <div class="d-flex ga-2">
                    <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="recargar" :loading="notificationStore.isLoading">
                        Actualizar
                    </v-btn>
                </div>
            </v-col>
        </v-row>

        <!-- Filtros y Búsqueda -->
        <v-card class="mb-6 rounded-lg elevation-2">
            <v-card-text class="pa-4">
                <v-row density="compact" align="center">
                    <v-col cols="12" md="4">
                        <v-text-field v-model="busqueda" placeholder="Buscar por título, mensaje o entidad..."
                            prepend-inner-icon="mdi-magnify" hide-details variant="outlined" density="compact" />
                    </v-col>
                    <v-col cols="12" md="8" class="d-flex justify-md-end flex-wrap ga-2">
                        <v-chip-group v-model="filtroCategoria" mandatory color="primary">
                            <v-chip value="TODAS" filter variant="tonal">Todas</v-chip>
                            <v-chip value="INSPECCION_PENDIENTE" filter variant="tonal" color="warning">Pendientes</v-chip>
                            <v-chip value="INSPECCION_APROBADA" filter variant="tonal" color="success">Aprobadas</v-chip>
                            <v-chip value="INSPECCION_RECHAZADA" filter variant="tonal" color="error">Rechazadas</v-chip>
                            <v-chip value="AUDITORIA_SISTEMA" filter variant="tonal" color="info">Auditoría Sistema</v-chip>
                        </v-chip-group>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Lista / Timeline de Auditoría Global -->
        <v-card class="rounded-lg elevation-2">
            <v-card-title class="text-subtitle-1 font-weight-bold border-b py-3 px-4 d-flex justify-space-between align-center">
                <span>Historial de Actividades ({{ notificacionesFiltradas.length }})</span>
                <v-chip size="small" :color="notificationStore.isConnected ? 'success' : 'grey'" variant="flat">
                    WebSocket: {{ notificationStore.isConnected ? 'Conectado (En vivo)' : 'Desconectado' }}
                </v-chip>
            </v-card-title>

            <v-card-text class="pa-0">
                <v-progress-linear v-if="notificationStore.isLoading" indeterminate color="primary" />

                <div v-if="notificacionesFiltradas.length === 0" class="text-center text-grey py-12">
                    <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-text-box-remove-outline</v-icon>
                    <div class="text-body-1 font-weight-medium">No se encontraron eventos de auditoría.</div>
                </div>

                <v-list v-else lines="three" density="compact" class="pa-0">
                    <v-list-item v-for="notif in notificacionesFiltradas" :key="notif.id" class="border-b py-3 px-4">
                        <template v-slot:prepend>
                            <v-avatar size="40" :color="obtenerColorCategoria(notif.categoria)" variant="tonal" class="mr-3">
                                <v-icon size="22">{{ obtenerIconoCategoria(notif.categoria) }}</v-icon>
                            </v-avatar>
                        </template>

                        <v-list-item-title class="font-weight-bold text-subtitle-2 d-flex align-center ga-2">
                            <span>{{ notif.titulo }}</span>
                            <v-chip size="x-small" :color="obtenerColorCategoria(notif.categoria)" variant="flat">
                                {{ notif.categoria }}
                            </v-chip>
                            <v-chip v-if="notif.entidadAfectada" size="x-small" color="grey-darken-1" variant="outlined">
                                Entidad: {{ notif.entidadAfectada }} #{{ notif.entidadId || 'N/A' }}
                            </v-chip>
                        </v-list-item-title>

                        <v-list-item-subtitle class="text-body-2 mt-1 text-grey-darken-3" style="white-space: normal;">
                            {{ notif.mensaje }}
                        </v-list-item-subtitle>

                        <template v-slot:append>
                            <div class="text-caption text-grey text-right">
                                <div class="font-weight-bold">
                                    {{ new Date(notif.creadoEn).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) }}
                                </div>
                                <div>
                                    {{ new Date(notif.creadoEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}
                                </div>
                            </div>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-card>
    </v-container>
</template>
