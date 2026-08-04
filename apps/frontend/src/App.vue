<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import Menu from './components/Menu.vue'

const route = useRoute()
const ocultarLayout = computed(() => !!route.meta.hideLayout)
</script>

<template>
  <v-app>
    <Menu :ocultarLayout="ocultarLayout" />

    <v-main>
      <RouterView />
    </v-main>

    <v-footer v-if="!ocultarLayout">
      <!-- Footer -->
    </v-footer>
  </v-app>
</template>
