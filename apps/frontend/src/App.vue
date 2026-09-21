<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import Menu from './components/Menu.vue'

const route = useRoute()
const ocultarLayout = computed(() => !!route.meta.hideLayout)
const theme = useTheme()

// Sincronizar data-bs-theme y clase dark-theme en <html> para que Bootstrap y Vuetify armonicen
watch(
  () => theme.global.name.value,
  (nuevoTema) => {
    const esOscuro = nuevoTema === 'sinergyDarkTheme'
    document.documentElement.setAttribute('data-bs-theme', esOscuro ? 'dark' : 'light')
    if (esOscuro) {
      document.documentElement.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
    }
    localStorage.setItem('sinergy_theme', nuevoTema)
  },
  { immediate: true }
)

onMounted(() => {
  const temaGuardado = localStorage.getItem('sinergy_theme')
  if (temaGuardado && (temaGuardado === 'sinergyLightTheme' || temaGuardado === 'sinergyDarkTheme')) {
    theme.global.name.value = temaGuardado
  }

  // Desactivar globalmente el popup de autocompletado nativo del navegador en todos los inputs
  document.addEventListener(
    'focusin',
    (e) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        target.setAttribute('autocomplete', 'off')
        target.setAttribute('spellcheck', 'false')
        target.setAttribute('data-lpignore', 'true')
        target.setAttribute('data-form-type', 'other')
      }
    },
    true
  )
})
</script>

<template>
  <v-app>
    <Menu :ocultarLayout="ocultarLayout" />

    <v-main>
      <RouterView />
      <!-- footer para cambio de tema
      <v-footer v-if="!ocultarLayout">
        <ThemeToggle></ThemeToggle>
      </v-footer>
      -->
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
