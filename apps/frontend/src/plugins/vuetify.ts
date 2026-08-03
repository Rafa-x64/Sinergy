// apps/frontend/src/plugins/vuetify.ts
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Tema claro personalizado de Sinergy
const sinergyLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    // 📝 TEXTOS - Contraste máximo
    'text-primary': '#0B1120',        // Azul noche casi negro (más rico que #1A1A1A)
    'text-secondary': '#475569',      // Gris pizarra (más legible que #5A6268)
    'text-muted': '#94A3B8',          // Gris más claro pero visible

    // 🎯 COLORES PRINCIPALES - Más intensos
    'primary': '#2563EB',             // Azul eléctrico (el mismo, pero lo usaremos mejor)
    'primary-dark': '#1D4ED8',
    'primary-light': '#DBEAFE',       // Fondo de selección (más azulado)

    'secondary': '#64748B',           // Gris azulado más elegante
    'secondary-light': '#F1F5F9',     // Fondo de elementos secundarios

    // 🟢 SEMÁNTICOS - Más vivos y distinguibles
    'success': '#059669',             // Verde esmeralda intenso
    'success-light': '#D1FAE5',       // Fondo de éxito (más verde)
    'warning': '#D97706',             // Ámbar profundo
    'warning-light': '#FEF3C7',       // Fondo de advertencia
    'error': '#DC2626',               // Rojo vivo
    'error-light': '#FEE2E2',         // Fondo de error
    'info': '#0891B2',                // Cian intenso
    'info-light': '#CFFAFE',          // Fondo de info

    // 🏠 FONDOS - Más contraste
    'background': '#F1F5F9',          // Gris azulado más oscuro (mejor que #F6F8FA)
    'surface': '#FFFFFF',             // Blanco puro para tarjetas
    'surface-variant': '#F8FAFC',
    'elevated': '#FFFFFF',

    // 🧩 BORDES Y DIVISORES - Más definidos
    'border': '#CBD5E1',              // Gris más oscuro para bordes
    'divider': '#E2E8F0',

    // ⭐ ON COLORS (texto sobre colores)
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-success': '#FFFFFF',
    'on-warning': '#FFFFFF',
    'on-error': '#FFFFFF',
    'on-info': '#FFFFFF',
    'on-background': '#0B1120',
    'on-surface': '#0B1120'
  }
}

// Tema oscuro personalizado de Sinergy
const sinergyDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    // 📝 TEXTOS - Blanco puro con contraste alto
    'text-primary': '#F1F5F9',        // Blanco azulado (más brillante)
    'text-secondary': '#CBD5E1',      // Gris claro (mejor contraste)
    'text-muted': '#94A3B8',

    // 🎯 COLORES PRINCIPALES - Más luminosos
    'primary': '#3B82F6',             // Azul más brillante
    'primary-dark': '#2563EB',
    'primary-light': '#1E3A5F',       // Fondo de selección más visible

    'secondary': '#94A3B8',
    'secondary-light': '#1E293B',

    // 🟢 SEMÁNTICOS - Más vivos
    'success': '#34D399',             // Verde esmeralda claro
    'success-light': '#064E3B',
    'warning': '#FBBF24',             // Ámbar brillante
    'warning-light': '#78350F',
    'error': '#F87171',               // Rojo suave pero visible
    'error-light': '#7F1D1D',
    'info': '#22D3EE',                // Cian eléctrico
    'info-light': '#164E63',

    // 🏠 FONDOS - Más profundidad
    'background': '#0B1120',          // Azul noche más oscuro
    'surface': '#1E293B',
    'surface-variant': '#172032',
    'elevated': '#26344A',

    // 🧩 BORDES Y DIVISORES
    'border': '#334155',              // Bordes más visibles
    'divider': '#1E293B',

    // ⭐ ON COLORS
    'on-primary': '#0B1120',
    'on-secondary': '#0B1120',
    'on-success': '#0B1120',
    'on-warning': '#0B1120',
    'on-error': '#0B1120',
    'on-info': '#0B1120',
    'on-background': '#F1F5F9',
    'on-surface': '#F1F5F9'
  }
}

export const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi'
  },
  theme: {
    defaultTheme: 'sinergyLightTheme',
    themes: {
      sinergyLightTheme,
      sinergyDarkTheme
    }
  }
})

export default vuetify
