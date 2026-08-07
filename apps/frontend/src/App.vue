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
