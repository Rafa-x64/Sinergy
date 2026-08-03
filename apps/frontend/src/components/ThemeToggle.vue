<template>
  <v-btn
    :icon="themeIcon"
    @click="toggleTheme"
    variant="text"
    size="small"
    :title="themeName"
  >
    <v-icon>{{ themeIcon }}</v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import { computed } from 'vue'

const theme = useTheme()

const toggleTheme = () => {
  theme.global.name.value =
    theme.global.name.value === 'sinergyLightTheme'
      ? 'sinergyDarkTheme'
      : 'sinergyLightTheme'
}

const themeIcon = computed(() => {
  return theme.global.name.value === 'sinergyLightTheme'
    ? 'mdi-weather-night'
    : 'mdi-weather-sunny'
})

const themeName = computed(() => {
  return theme.global.name.value === 'sinergyLightTheme'
    ? 'Cambiar a modo oscuro'
    : 'Cambiar a modo claro'
})
</script>
