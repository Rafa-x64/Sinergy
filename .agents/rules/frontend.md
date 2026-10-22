---
trigger: glob
---

# Frontend (Vue 3)
- Usa `<script setup lang="ts">` y Composition API.
- Reutiliza `BaseButton`, `BaseCard`, `BaseInput`, etc. No crees estilos aislados por vista.
- Bootstrap, mobile-first (grid y utilidades).
- Formularios con validación en tiempo real (computed/watch o un `composable`).
- Si repites lógica de validación o estilos, extráela a un `composable` o utilidad.
- Limpia listeners, timers y watchers en `onUnmounted`; evita bucles en watchers.
- Errores al usuario mediante el sistema global de notificaciones.
