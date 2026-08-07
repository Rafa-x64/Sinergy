// apps/frontend/src/plugins/vuetify.ts
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

/*
 * ======================================================
 *  TEMA CLARO · "Aire Fresco"   ☁️
 *  · Fondo gris azulado muy claro (no blanco)
 *  · Superficies en blanco roto (ligeramente gris)
 *  · Texto en gris oscuro (no negro)
 *  · Índigo como primario, tonos suaves para el resto
 * ======================================================
 */
const sinergyLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    // ─── TEXTOS ───
    'text-primary': '#1E293B',     // pizarra oscura
    'text-secondary': '#475569',   // pizarra media
    'text-muted': '#94A3B8',       // pizarra clara

    // ─── PRIMARIOS ─── (índigo IA, pero suave)
    'primary': '#4F46E5',          // índigo base
    'primary-dark': '#4338CA',
    'primary-light': '#E0E7FF',    // fondo de selección

    'secondary': '#64748B',        // pizarra
    'secondary-light': '#F1F5F9',

    // ─── SEMÁNTICOS ─── (vivos pero sin estridencia)
    'success': '#0D9488',          // teal
    'success-light': '#CCFBF1',
    'warning': '#D97706',          // ámbar
    'warning-light': '#FEF3C7',
    'error': '#E11D48',            // rosa/rojo
    'error-light': '#FFE4E6',
    'info': '#0284C7',             // cielo
    'info-light': '#E0F2FE',

    // ─── FONDOS ─── (sin blanco puro)
    'background': '#F1F5F9',       // gris azulado muy claro
    'surface': '#F8FAFC',          // blanco roto para tarjetas
    'surface-variant': '#F1F5F9',
    'elevated': '#FFFFFF',         // solo para elementos elevados (opcional)

    // ─── BORDES ───
    'border': '#E2E8F0',
    'divider': '#E2E8F0',

    // ─── ON COLORS ───
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-success': '#FFFFFF',
    'on-warning': '#FFFFFF',
    'on-error': '#FFFFFF',
    'on-info': '#FFFFFF',
    'on-background': '#1E293B',
    'on-surface': '#1E293B',
  },
}

/*
 * ======================================================
 *  TEMA OSCURO · "Noche Polar"   🌙
 *  · Fondo azul noche profundo (no negro)
 *  · Superficies ligeramente más claras
 *  · Texto en blanco crema (no puro)
 *  · Índigo más luminoso, semánticos suaves
 * ======================================================
 */
const sinergyDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    // ─── TEXTOS ───
    'text-primary': '#F1F5F9',     // blanco grisáceo
    'text-secondary': '#CBD5E1',
    'text-muted': '#94A3B8',

    // ─── PRIMARIOS ─── (índigo más brillante pero suave)
    'primary': '#818CF8',          // índigo claro
    'primary-dark': '#6366F1',
    'primary-light': '#1E1B4B',    // fondo de selección

    'secondary': '#94A3B8',
    'secondary-light': '#1E293B',

    // ─── SEMÁNTICOS ─── (luminosos pero no neón)
    'success': '#2DD4BF',          // teal claro
    'success-light': '#134E4A',
    'warning': '#FBBF24',          // ámbar
    'warning-light': '#78350F',
    'error': '#FB7185',            // rosa suave
    'error-light': '#4C0519',
    'info': '#38BDF8',             // cielo claro
    'info-light': '#0C4A6E',

    // ─── FONDOS ─── (azul noche, sin negro)
    'background': '#0B0E14',       // casi negro pero azulado
    'surface': '#141A24',          // superficie más clara
    'surface-variant': '#0F131C',
    'elevated': '#1E2635',

    // ─── BORDES ───
    'border': '#2A3346',
    'divider': '#1E2635',

    // ─── ON COLORS ───
    'on-primary': '#0B0E14',
    'on-secondary': '#0B0E14',
    'on-success': '#0B0E14',
    'on-warning': '#0B0E14',
    'on-error': '#0B0E14',
    'on-info': '#0B0E14',
    'on-background': '#F1F5F9',
    'on-surface': '#F1F5F9',
  },
}

export const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'sinergyLightTheme',
    themes: {
      sinergyLightTheme,
      sinergyDarkTheme,
    },
  },
})

export default vuetify
