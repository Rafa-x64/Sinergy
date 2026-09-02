<script setup lang="ts" generic="TKey extends string">
import { reactive, ref, onUnmounted, watch } from 'vue'
import type { ConfiguracionCampoFiltro, ContenidoFiltro } from '../../../shared/types'

export interface Props<TKey extends string = string> {
    config: ConfiguracionCampoFiltro<TKey>[]
    loading?: boolean
}

export interface Emits {
    (e: 'cambiar-filtro', cargaUtil: ContenidoFiltro): void
    (e: 'refrescar-filtro'): void
}

const props = withDefaults(defineProps<Props<TKey>>(), {
    loading: false,
})

const emits = defineEmits<Emits>()

const estadoFiltro = reactive<Record<string, string | number | boolean | null>>({})
const temporizadorRetraso = ref<ReturnType<typeof setTimeout> | null>(null)

const inicializarEstado = (): void => {
    props.config.forEach((campo) => {
        if (!(campo.key in estadoFiltro)) {
            estadoFiltro[campo.key] = campo.valorDefault ?? null
        }
    })
}

inicializarEstado()

watch(
    () => props.config,
    () => {
        props.config.forEach((campo) => {
            if (!(campo.key in estadoFiltro)) {
                estadoFiltro[campo.key] = campo.valorDefault ?? null
            }
        })
    },
    { deep: true }
)

const construirCargaLimpia = (): ContenidoFiltro => {
    const cargaLimpia: ContenidoFiltro = {}

    Object.keys(estadoFiltro).forEach((key) => {
        const valor = estadoFiltro[key]
        if (valor !== null && valor !== undefined && valor !== '') {
            cargaLimpia[key] = valor
        }
    })

    return cargaLimpia
}

const cambiarEmit = (): void => {
    emits('cambiar-filtro', construirCargaLimpia())
}

// Los campos de texto disparan solo al presionar Enter.
// Los selects y fechas disparan al cambiar valor (comportamiento esperado para controles discretos).
const manejarEnter = (): void => {
    cambiarEmit()
}

const manejarClear = (): void => {
    cambiarEmit()
}

const reestablecerFiltro = (): void => {
    if (temporizadorRetraso.value) {
        clearTimeout(temporizadorRetraso.value)
    }
    props.config.forEach((campo) => {
        estadoFiltro[campo.key] = campo.valorDefault ?? null
    })
    emits('refrescar-filtro')
    cambiarEmit()
}

onUnmounted(() => {
    if (temporizadorRetraso.value) {
        clearTimeout(temporizadorRetraso.value)
    }
})
</script>
<template>

    <v-card class="mb-3 pa-2" elevation="1">
        <v-row dense align="center">
            <v-col v-for="campo in props.config" :key="campo.key" cols="4" :sm="campo.ancho || 3">
                <v-text-field v-if="campo.tipo === 'text'" v-model="estadoFiltro[campo.key]" :label="campo.nombre"
                    :placeholder="campo.placeholder" :disabled="campo.inhabilitado || props.loading" variant="outlined"
                    density="compact" hide-details clearable class="filtro-campo"
                    @keydown.enter="manejarEnter"
                    @click:clear="manejarClear">
                </v-text-field>

                <v-select v-else-if="campo.tipo === 'select'" v-model="estadoFiltro[campo.key]" :label="campo.nombre"
                    :items="campo.opciones" item-title="titulo" item-value="valor"
                    :disabled="campo.inhabilitado || props.loading" variant="outlined" density="compact" hide-details
                    clearable class="filtro-campo" @update:model-value="cambiarEmit">
                </v-select>

                <v-text-field v-if="campo.tipo === 'date'" v-model="estadoFiltro[campo.key]" type="date"
                    :label="campo.nombre" :disabled="campo.inhabilitado || props.loading" variant="outlined"
                    density="compact" hide-details class="filtro-campo" @update:model-value="cambiarEmit">
                </v-text-field>

                <v-checkbox v-else-if="campo.tipo === 'boolean'" v-model="estadoFiltro[campo.key]" :label="campo.nombre"
                    :disabled="campo.inhabilitado || props.loading" density="compact" hide-details
                    @update:model-value="cambiarEmit" />
            </v-col>
            <v-col cols="12" class="d-flex justify-end ga-2 mt-1">
                <v-btn color="error" variant="outlined" size="x-small" :disabled="props.loading" @click="reestablecerFiltro">
                    Limpiar Filtros
                </v-btn>

                <slot name="actions" />
            </v-col>
        </v-row>
    </v-card>

</template>
<style scoped>
.filtro-campo :deep(.v-field__input) {
    font-size: 0.78rem;
    min-height: 32px;
    padding-top: 4px;
    padding-bottom: 4px;
}

.filtro-campo :deep(.v-label) {
    font-size: 0.78rem;
}

.filtro-campo :deep(.v-field) {
    --v-field-padding-top: 4px;
    --v-field-padding-bottom: 4px;
}
</style>
