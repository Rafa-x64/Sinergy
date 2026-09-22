<script setup lang="ts">
defineProps<{
    titulo: string,
    mensaje: string,
    color?: string,
    icono?: string
}>()
</script>

<template>
    <div class="header-view-wrapper d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center mb-4 gap-3">
        <div class="d-flex align-center gap-3">
            <v-avatar v-if="icono" :color="color || 'primary'" variant="tonal" size="44" class="flex-shrink-0">
                <v-icon :color="color || 'primary'" size="26">{{ icono }}</v-icon>
            </v-avatar>
            <div>
                <h1 class="text-h5 font-weight-bold mb-0">
                    {{ titulo }}
                </h1>
                <p class="text-caption text-medium-emphasis mb-0 mt-1">
                    {{ mensaje }}
                </p>
            </div>
        </div>

        <div v-if="$slots.default" class="d-flex align-center gap-2 flex-wrap">
            <slot />
        </div>
    </div>
</template>

<style scoped>
.header-view-wrapper {
    width: 100%;
}
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
