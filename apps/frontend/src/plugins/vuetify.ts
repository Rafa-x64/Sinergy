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
    'text-principal': '#1E293B',     // pizarra oscura
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
    'safety-orange': '#FF5F15',    // naranja industrial
    'safety-orange-light': '#ffa600',
    'purple': '#9146FF',
    'purple-light': '#C9A3FF',

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
    'text-principal': '#F8FAFC',     // blanco slate de alto contraste
    'text-secondary': '#94A3B8',     // slate medio para subtítulos
    'text-muted': '#64748B',         // slate atenuado

    // ─── PRIMARIOS ─── (índigo moderno de alta legibilidad)
    'primary': '#6366F1',          // índigo base
    'primary-dark': '#4F46E5',
    'primary-light': '#1E1B4B',    // fondo de selección sutil

    'secondary': '#94A3B8',
    'secondary-light': '#1E293B',

    // ─── SEMÁNTICOS ───
    'success': '#10B981',          // emerald
    'success-light': '#064E3B',
    'warning': '#F59E0B',          // ámbar cálido
    'warning-light': '#78350F',
    'error': '#F43F5E',            // rose vivo
    'error-light': '#881337',
    'info': '#38BDF8',             // sky
    'info-light': '#0C4A6E',
    'safety-orange': '#FF6B00',    // naranja industrial
    'safety-orange-light': '#FFA500',
    'purple': '#A855F7',
    'purple-light': '#D8B4FE',

    // ─── FONDOS Y SUPERFICIES (Slate Profundo Industrial) ───
    'background': '#0B0F19',       // Fondo de la app
    'surface': '#131B2E',          // Tarjetas y paneles
    'surface-variant': '#1A253C',  // Secciones anidadas
    'elevated': '#1E2B45',         // Modales y menús flotantes

    // ─── BORDES ───
    'border': '#1E293B',
    'divider': '#1E293B',

    // ─── ON COLORS ───
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-success': '#FFFFFF',
    'on-warning': '#0B0F19',
    'on-error': '#FFFFFF',
    'on-info': '#0B0F19',
    'on-background': '#F8FAFC',
    'on-surface': '#F8FAFC',
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
