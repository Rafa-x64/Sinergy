# Vue Toastification en Sinergy - Guía Completa y Tutorial de Uso

Vue Toastification es la librería de notificaciones (Toasts) no bloqueantes elegida para Sinergy. Permite proporcionar retroalimentación visual inmediata al usuario tras realizar acciones (guardar inspecciones, errores de servidor, pérdida de conectividad offline, etc.).

---

## 1. Instalación y Registro

### Instalación de Paquetes

```powershell
# En el frontend (apps/frontend)
pnpm --filter @sinergy/frontend add vue-toastification@2.0.0-rc.5
```

### Configuración del Plugin (`apps/frontend/src/plugins/toast.ts`)

Para mantener el archivo `main.ts` limpio, creamos el archivo de plugin dedicado:

```typescript
// apps/frontend/src/plugins/toast.ts
import Toast, { type PluginOptions, POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

export const toastOptions: PluginOptions = {
  position: POSITION.TOP_RIGHT,
  timeout: 4000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
}

export { Toast }
```

### Registro en `main.ts`

```typescript
// apps/frontend/src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { Toast, toastOptions } from './plugins/toast'

const app = createApp(App)
app.use(Toast, toastOptions)
app.mount('#app')
```

---

## 2. Tutorial de Uso en Componentes Vue 3

### Uso Directo con Composition API (`useToast`)

```vue
<script setup lang="ts">
import { useToast } from 'vue-toastification'

const toast = useToast()

function notificarOperacionExitosa() {
  toast.success('Inspección guardada correctamente')
}

function notificarErrorServidor() {
  toast.error('No se pudo conectar con el servidor backend', {
    timeout: 6000
  })
}

function notificarAdvertenciaOffline() {
  toast.warning('Sin conexión a Internet. Los datos se guardaron localmente en IndexedDB.')
}

function notificarInformacion() {
  toast.info('Sincronización en segundo plano completada.')
}
</script>

<template>
  <div class="d-flex gap-2">
    <v-btn color="success" @click="notificarOperacionExitosa">Éxito</v-btn>
    <v-btn color="error" @click="notificarErrorServidor">Error</v-btn>
    <v-btn color="warning" @click="notificarAdvertenciaOffline">Advertencia</v-btn>
    <v-btn color="info" @click="notificarInformacion">Info</v-btn>
  </div>
</template>
```

---

## 3. Patrón Recomendado: Composable `useNotifications`

Para evitar repetir textos de notificación y estandarizar los mensajes en toda la aplicación, creamos un composable envolvente:

```typescript
// apps/frontend/src/composables/useNotifications.ts
import { useToast } from 'vue-toastification'

export function useNotifications() {
  const toast = useToast()

  const notifySuccess = (mensaje: string) => {
    toast.success(mensaje)
  }

  const notifyError = (mensaje: string | Error) => {
    const text = typeof mensaje === 'string' ? mensaje : mensaje.message
    toast.error(text, { timeout: 6000 })
  }

  const notifyOfflineWarning = () => {
    toast.warning('Modo Offline: Cambios guardados localmente.', {
      timeout: 5000
    })
  }

  return {
    notifySuccess,
    notifyError,
    notifyOfflineWarning
  }
}
```

---

## 4. Opciones Avanzadas

### Toasts Programáticos con Acción al Hacer Clic
```typescript
toast.info('Nueva actualización disponible. Haz clic para recargar.', {
  timeout: false, // No se cierra automáticamente
  onClick: () => {
    window.location.reload()
  }
})
```

### Limpiar Toasts
```typescript
import { useToast } from 'vue-toastification'

const toast = useToast()

// Limpiar todas las notificaciones activas en pantalla
toast.clear()
```
