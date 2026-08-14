<script setup lang="ts">
const porps = defineProps<{
    titulo: string,
    mensaje: string,
    color?: string,
    icono?: string
}>()
</script>
<template>
    <v-row class="mb-0 pb-0 px-2">
        <v-col cols="12" class="d-flex justify-space-between align-center flex-wrap ga-3">
            <div>
                <h1 class="text-h5 font-weight-bold d-flex align-center ga-2">
                    <v-icon v-if="icono" :color="color">{{ icono }}</v-icon>
                    {{ titulo }}
                </h1>
                <p class="text-body-2 text-grey-darken-1 mb-0">
                    Panel de visualizacion de {{  mensaje }}
                </p>
            </div>
        </v-col>
    </v-row>
</template>
<style scoped></style>
