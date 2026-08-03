<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import ThemeToggle from './components/ThemeToggle.vue'

const route = useRoute()
const ocultarLayout = computed(() => !!route.meta.hideLayout)
</script>

<template>
  <v-app>
    <v-app-bar v-if="!ocultarLayout" flat density="compact" color="background">
      <v-app-bar-title>Panel de Operaciones</v-app-bar-title>
      <v-spacer></v-spacer>
      <ThemeToggle />
    </v-app-bar>

    <v-navigation-drawer v-if="!ocultarLayout" permanent>
    </v-navigation-drawer>

    <v-main>
      <RouterView />
    </v-main>

    <v-footer v-if="!ocultarLayout">
    </v-footer>
  </v-app>
</template>

<style scoped></style>
