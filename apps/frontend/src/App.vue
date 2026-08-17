<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import Menu from './components/Menu.vue'
import ThemeToggle from './components/ThemeToggle.vue'

const route = useRoute()
const ocultarLayout = computed(() => !!route.meta.hideLayout)
</script>

<template>
  <v-app>
    <Menu :ocultarLayout="ocultarLayout" />

    <v-main>
      <RouterView />
      <v-footer v-if="!ocultarLayout">
        <ThemeToggle></ThemeToggle>
      </v-footer>
    </v-main>
  </v-app>
</template>

<style>
/* Asegurar que las notificaciones Toast siempre aparezcan por encima de los modales de Vuetify */
.Vue-Toastification__container {
  z-index: 999999 !important;
}

.Vue-Toastification__toast {
  font-family: inherit !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
}
</style>
