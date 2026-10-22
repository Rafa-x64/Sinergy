<template>
  <v-btn
    :icon="themeIcon"
    @click="toggleTheme"
    variant="text"
    size="small"
    :title="themeName"
    color="inherit"
  >
    <v-icon>{{ themeIcon }}</v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import { computed } from 'vue'

const theme = useTheme()

const toggleTheme = () => {
  const nuevo = theme.global.name.value === 'sinergyLightTheme'
    ? 'sinergyDarkTheme'
    : 'sinergyLightTheme'

  theme.global.name.value = nuevo
  localStorage.setItem('sinergy_theme', nuevo)
  localStorage.setItem('sinergy_theme_manual', 'true')
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
