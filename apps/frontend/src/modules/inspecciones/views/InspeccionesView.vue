<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useInspeccionesStore, type Inspeccion } from '../inspecciones.store'
import { useAuthStore } from '../../auth/auth.store'

const inspeccionesStore = useInspeccionesStore()
const authStore = useAuthStore()

const filtroEstado = ref<string>('TODAS')
const busqueda = ref<string>('')
const modalDetalle = ref(false)
const modalNueva = ref(false)
const inspeccionSeleccionada = ref<Inspeccion | null>(null)

// Formulario nueva inspección
const formNueva = ref({
    codigoInspeccion: '',
    tipoInspeccion: 'VARIABLES_CRITICAS',
    equipoId: 1,
    observacionesGenerales: '',
    variableId: 1,
    valorNumerico: null as number | null,
    estadoComponente: true
})

const esAdmin = computed(() => authStore.roles.some(r => r.toLowerCase().includes('admin')))
const esSupervisor = computed(() => authStore.roles.some(r => r.toLowerCase().includes('supervisor')))

onMounted(async () => {
    if (authStore.accessToken) {
        await inspeccionesStore.cargarInspecciones(authStore.accessToken)
    }
})

const inspeccionesFiltradas = computed(() => {
    let lista = inspeccionesStore.inspecciones

    if (filtroEstado.value !== 'TODAS') {
        lista = lista.filter(i => i.estadoInspeccion === filtroEstado.value)
    }

    if (busqueda.value.trim()) {
        const q = busqueda.value.toLowerCase()
        lista = lista.filter(i =>
            i.codigoInspeccion.toLowerCase().includes(q) ||
            i.tipoInspeccion.toLowerCase().includes(q) ||
            (i.equipo && i.equipo.nombre.toLowerCase().includes(q)) ||
            (i.elaboradoPor && `${i.elaboradoPor.nombre} ${i.elaboradoPor.apellido}`.toLowerCase().includes(q))
        )
    }

    return lista
})

const pendientesCount = computed(() =>
    inspeccionesStore.inspecciones.filter(i => i.estadoInspeccion === 'PENDIENTE').length
)

function abrirDetalle(item: Inspeccion): void {
    inspeccionSeleccionada.value = item
    modalDetalle.value = true
}

async function procesarAprobacion(item: Inspeccion, aprobado: boolean): Promise<void> {
    if (!authStore.accessToken || !authStore.usuario?.sub) return

    const nuevoEstado = aprobado ? 'APROBADO' : 'RECHAZADO'
    const exito = await inspeccionesStore.actualizarEstado(
        item.id,
        nuevoEstado,
        authStore.usuario.sub,
        authStore.accessToken
    )

    if (exito) {
        if (inspeccionSeleccionada.value?.id === item.id) {
            modalDetalle.value = false
        }
        await inspeccionesStore.cargarInspecciones(authStore.accessToken)
    }
}

async function guardarNuevaInspeccion(): Promise<void> {
    if (!authStore.accessToken) return
    if (!formNueva.value.codigoInspeccion.trim()) return

    const payload = {
        codigoInspeccion: formNueva.value.codigoInspeccion.trim().toUpperCase(),
        tipoInspeccion: formNueva.value.tipoInspeccion,
        equipoId: Number(formNueva.value.equipoId),
        observacionesGenerales: formNueva.value.observacionesGenerales,
        detalles: [
            {
                variableId: Number(formNueva.value.variableId),
                valorNumerico: formNueva.value.valorNumerico ? Number(formNueva.value.valorNumerico) : null,
                estadoComponente: formNueva.value.estadoComponente
            }
        ]
    }

    const exito = await inspeccionesStore.crearInspeccion(payload, authStore.accessToken)
    if (exito) {
        modalNueva.value = false
        formNueva.value = {
            codigoInspeccion: '',
            tipoInspeccion: 'VARIABLES_CRITICAS',
            equipoId: 1,
            observacionesGenerales: '',
            variableId: 1,
            valorNumerico: null,
            estadoComponente: true
        }
        await inspeccionesStore.cargarInspecciones(authStore.accessToken)
    }
}

function obtenerColorEstado(estado: string): string {
    switch (estado) {
        case 'PENDIENTE': return 'warning'
        case 'APROBADO': return 'success'
        case 'RECHAZADO': return 'error'
        default: return 'grey'
    }
}

function generarCodigoAutomatico(): void {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    formNueva.value.codigoInspeccion = `INSP-${randomNum}`
}
</script>

<template>
    <v-container fluid class="pa-6">
        <!-- Encabezado y resumen -->
        <v-row class="mb-4">
            <v-col cols="12" class="d-flex justify-space-between align-center flex-wrap ga-3">
                <div>
                    <h1 class="text-h5 font-weight-bold d-flex align-center ga-2">
                        <v-icon color="primary">mdi-clipboard-check-outline</v-icon>
                        Gestión de Inspecciones Técnicas
                    </h1>
                    <p class="text-body-2 text-grey-darken-1 mb-0">
                        Panel operativo de registro y validación jerárquica (Técnicos -> Supervisores -> Admin).
                    </p>
                </div>
                <div class="d-flex ga-2">
                    <v-btn color="primary" prepend-icon="mdi-plus-circle" @click="modalNueva = true; generarCodigoAutomatico()">
                        Registrar Inspección
                    </v-btn>
                </div>
            </v-col>
        </v-row>

        <!-- Tarjetas de resumen para Supervisor/Admin -->
        <v-row v-if="esSupervisor || esAdmin" class="mb-4">
            <v-col cols="12" sm="4">
                <v-card class="pa-4 border-start border-warning border-4 rounded-lg elevation-2">
                    <div class="d-flex justify-space-between align-center">
                        <div>
                            <div class="text-caption text-grey font-weight-bold">PENDIENTES DE REVISIÓN</div>
                            <div class="text-h4 font-weight-bold text-warning">{{ pendientesCount }}</div>
                        </div>
                        <v-avatar color="warning" variant="tonal" size="48">
                            <v-icon size="28">mdi-clock-alert</v-icon>
                        </v-avatar>
                    </div>
                </v-card>
            </v-col>
            <v-col cols="12" sm="4">
                <v-card class="pa-4 border-start border-success border-4 rounded-lg elevation-2">
                    <div class="d-flex justify-space-between align-center">
                        <div>
                            <div class="text-caption text-grey font-weight-bold">INSPECCIONES APROBADAS</div>
                            <div class="text-h4 font-weight-bold text-success">
                                {{ inspeccionesStore.inspecciones.filter(i => i.estadoInspeccion === 'APROBADO').length }}
                            </div>
                        </div>
                        <v-avatar color="success" variant="tonal" size="48">
                            <v-icon size="28">mdi-check-decagram</v-icon>
                        </v-avatar>
                    </div>
                </v-card>
            </v-col>
            <v-col cols="12" sm="4">
                <v-card class="pa-4 border-start border-error border-4 rounded-lg elevation-2">
                    <div class="d-flex justify-space-between align-center">
                        <div>
                            <div class="text-caption text-grey font-weight-bold">RECHAZADAS</div>
                            <div class="text-h4 font-weight-bold text-error">
                                {{ inspeccionesStore.inspecciones.filter(i => i.estadoInspeccion === 'RECHAZADO').length }}
                            </div>
                        </div>
                        <v-avatar color="error" variant="tonal" size="48">
                            <v-icon size="28">mdi-close-octagon</v-icon>
                        </v-avatar>
                    </div>
                </v-card>
            </v-col>
        </v-row>

        <!-- Filtros de Estado -->
        <v-card class="mb-6 rounded-lg elevation-2">
            <v-card-text class="pa-4">
                <v-row density="compact" align="center">
                    <v-col cols="12" md="4">
                        <v-text-field v-model="busqueda" placeholder="Buscar por código, equipo o técnico..."
                            prepend-inner-icon="mdi-magnify" hide-details variant="outlined" density="compact" />
                    </v-col>
                    <v-col cols="12" md="8" class="d-flex justify-md-end flex-wrap ga-2">
                        <v-chip-group v-model="filtroEstado" mandatory color="primary">
                            <v-chip value="TODAS" filter variant="tonal">Todas</v-chip>
                            <v-chip value="PENDIENTE" filter variant="tonal" color="warning">
                                Pendientes ({{ pendientesCount }})
                            </v-chip>
                            <v-chip value="APROBADO" filter variant="tonal" color="success">Aprobadas</v-chip>
                            <v-chip value="RECHAZADO" filter variant="tonal" color="error">Rechazadas</v-chip>
                        </v-chip-group>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Tabla / Tarjetas de Inspecciones -->
        <v-card class="rounded-lg elevation-2">
            <v-card-title class="text-subtitle-1 font-weight-bold border-b py-3 px-4 d-flex justify-space-between align-center">
                <span>Listado de Inspecciones ({{ inspeccionesFiltradas.length }})</span>
                <v-btn icon size="small" variant="text" @click="authStore.accessToken && inspeccionesStore.cargarInspecciones(authStore.accessToken)">
                    <v-icon>mdi-refresh</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text class="pa-0">
                <v-progress-linear v-if="inspeccionesStore.isLoading" indeterminate color="primary" />

                <div v-if="inspeccionesFiltradas.length === 0" class="text-center text-grey py-12">
                    <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-clipboard-text-outline</v-icon>
                    <div class="text-body-1 font-weight-medium">No se encontraron inspecciones registrados.</div>
                </div>

                <v-table v-else hover class="text-body-2">
                    <thead>
                        <tr>
                            <th class="text-left font-weight-bold">Código</th>
                            <th class="text-left font-weight-bold">Tipo</th>
                            <th class="text-left font-weight-bold">Equipo</th>
                            <th class="text-left font-weight-bold">Elaborado por (Técnico)</th>
                            <th class="text-left font-weight-bold">Fecha</th>
                            <th class="text-center font-weight-bold">Estado</th>
                            <th class="text-center font-weight-bold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in inspeccionesFiltradas" :key="item.id">
                            <td class="font-weight-bold text-primary">{{ item.codigoInspeccion }}</td>
                            <td>
                                <v-chip size="x-small" variant="outlined">{{ item.tipoInspeccion }}</v-chip>
                            </td>
                            <td>{{ item.equipo?.nombre || `Equipo #${item.equipoId}` }}</td>
                            <td>
                                {{ item.elaboradoPor ? `${item.elaboradoPor.nombre} ${item.elaboradoPor.apellido}` : `Usuario #${item.elaboradoPorId}` }}
                            </td>
                            <td>{{ new Date(item.fechaRegistro).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</td>
                            <td class="text-center">
                                <v-chip size="small" :color="obtenerColorEstado(item.estadoInspeccion)" variant="flat" class="font-weight-bold">
                                    {{ item.estadoInspeccion }}
                                </v-chip>
                            </td>
                            <td class="text-center">
                                <div class="d-flex justify-center ga-1">
                                    <v-btn icon size="x-small" color="info" variant="text" @click="abrirDetalle(item)" title="Ver Detalle">
                                        <v-icon size="20">mdi-eye</v-icon>
                                    </v-btn>

                                    <!-- Acciones de Aprobación para Supervisor y Admin -->
                                    <template v-if="(esSupervisor || esAdmin) && item.estadoInspeccion === 'PENDIENTE'">
                                        <v-btn icon size="x-small" color="success" variant="tonal" @click="procesarAprobacion(item, true)" title="Aprobar Inspección">
                                            <v-icon size="18">mdi-check</v-icon>
                                        </v-btn>
                                        <v-btn icon size="x-small" color="error" variant="tonal" @click="procesarAprobacion(item, false)" title="Rechazar Inspección">
                                            <v-icon size="18">mdi-close</v-icon>
                                        </v-btn>
                                    </template>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card>

        <!-- Modal de Detalle de Inspección -->
        <v-dialog v-model="modalDetalle" max-width="600">
            <v-card v-if="inspeccionSeleccionada" class="rounded-lg">
                <v-card-title class="text-h6 font-weight-bold bg-primary text-white py-3 px-4 d-flex justify-space-between align-center">
                    <span>Inspección {{ inspeccionSeleccionada.codigoInspeccion }}</span>
                    <v-btn icon color="white" variant="text" size="small" @click="modalDetalle = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                <v-card-text class="pa-4">
                    <v-list density="compact" class="pa-0">
                        <v-list-item>
                            <template v-slot:subtitle>Estado</template>
                            <v-chip size="small" :color="obtenerColorEstado(inspeccionSeleccionada.estadoInspeccion)" variant="flat" class="font-weight-bold mt-1">
                                {{ inspeccionSeleccionada.estadoInspeccion }}
                            </v-chip>
                        </v-list-item>
                        <v-list-item>
                            <template v-slot:subtitle>Elaborado Por (Técnico)</template>
                            <div class="font-weight-bold">
                                {{ inspeccionSeleccionada.elaboradoPor ? `${inspeccionSeleccionada.elaboradoPor.nombre} ${inspeccionSeleccionada.elaboradoPor.apellido} (${inspeccionSeleccionada.elaboradoPor.email})` : `ID #${inspeccionSeleccionada.elaboradoPorId}` }}
                            </div>
                        </v-list-item>
                        <v-list-item v-if="inspeccionSeleccionada.revisadoPor">
                            <template v-slot:subtitle>Revisado / Evaluado Por (Supervisor)</template>
                            <div class="font-weight-bold">
                                {{ `${inspeccionSeleccionada.revisadoPor.nombre} ${inspeccionSeleccionada.revisadoPor.apellido}` }}
                            </div>
                        </v-list-item>
                        <v-list-item>
                            <template v-slot:subtitle>Observaciones Generales</template>
                            <div>{{ inspeccionSeleccionada.observacionesGenerales || 'Sin observaciones registradas' }}</div>
                        </v-list-item>
                    </v-list>

                    <v-divider class="my-3"></v-divider>

                    <div class="text-subtitle-2 font-weight-bold mb-2">Variables de Inspección Medidas</div>
                    <v-card variant="outlined" class="rounded-lg pa-3">
                        <div v-if="!inspeccionSeleccionada.detalles || inspeccionSeleccionada.detalles.length === 0" class="text-grey text-caption">
                            No se registraron lecturas detalladas.
                        </div>
                        <div v-else v-for="det in inspeccionSeleccionada.detalles" :key="det.id" class="d-flex justify-space-between py-1 border-b text-body-2">
                            <span>Variable #{{ det.variableId }}:</span>
                            <span class="font-weight-bold">
                                {{ det.valorNumerico !== null ? det.valorNumerico : (det.valorSeleccion || 'N/A') }}
                            </span>
                        </div>
                    </v-card>
                </v-card-text>
                <v-card-actions class="bg-grey-lighten-4 py-3 px-4 d-flex justify-space-between">
                    <div class="d-flex ga-2" v-if="(esSupervisor || esAdmin) && inspeccionSeleccionada.estadoInspeccion === 'PENDIENTE'">
                        <v-btn color="success" variant="flat" size="small" prepend-icon="mdi-check" @click="procesarAprobacion(inspeccionSeleccionada, true)">
                            Aprobar
                        </v-btn>
                        <v-btn color="error" variant="flat" size="small" prepend-icon="mdi-close" @click="procesarAprobacion(inspeccionSeleccionada, false)">
                            Rechazar
                        </v-btn>
                    </div>
                    <v-spacer v-else></v-spacer>
                    <v-btn variant="outlined" color="grey-darken-1" size="small" @click="modalDetalle = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Modal de Registrar Nueva Inspección (Técnico) -->
        <v-dialog v-model="modalNueva" max-width="500">
            <v-card class="rounded-lg">
                <v-card-title class="text-h6 font-weight-bold bg-primary text-white py-3 px-4">
                    Registrar Nueva Inspección Técnica
                </v-card-title>
                <v-card-text class="pa-4">
                    <v-form @submit.prevent="guardarNuevaInspeccion">
                        <v-text-field v-model="formNueva.codigoInspeccion" label="Código de Inspección" variant="outlined" density="compact" class="mb-3" required />
                        <v-select v-model="formNueva.tipoInspeccion" :items="['VARIABLES_CRITICAS', 'MONTACARGAS', 'COMPRESOR', 'GENERADOR', 'CHILLER']" label="Tipo de Inspección" variant="outlined" density="compact" class="mb-3" required />
                        <v-text-field v-model.number="formNueva.equipoId" label="ID de Equipo" type="number" variant="outlined" density="compact" class="mb-3" required />
                        <v-text-field v-model.number="formNueva.valorNumerico" label="Lectura Numérica Medida" type="number" variant="outlined" density="compact" class="mb-3" />
                        <v-textarea v-model="formNueva.observacionesGenerales" label="Observaciones del Técnico" variant="outlined" density="compact" rows="2" class="mb-3" />
                    </v-form>
                </v-card-text>
                <v-card-actions class="bg-grey-lighten-4 py-3 px-4 justify-end ga-2">
                    <v-btn variant="text" color="grey" @click="modalNueva = false">Cancelar</v-btn>
                    <v-btn color="primary" variant="flat" @click="guardarNuevaInspeccion" :loading="inspeccionesStore.isLoading">
                        Enviar Inspección
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-container>
</template>
