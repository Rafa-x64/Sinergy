# Auth0 Vue en Sinergy - Guía Completa y Tutorial de Uso

Auth0 Vue (`@auth0/auth0-vue@2.6.0`) proporciona autenticación de identidad federada (OAuth 2.0 / OpenID Connect) para Sinergy. Permite inicio de sesión corporativo seguro, gestión de perfiles y obtención de Access Tokens JWT.

---

## 1. Configuración del Entorno (`.env`)

Agrega las credenciales del Tenant de Auth0 en `apps/frontend/.env`:

```env
VITE_AUTH0_DOMAIN="sinergy-auth.us.auth0.com"
VITE_AUTH0_CLIENT_ID="YourAuth0ClientIdString"
VITE_AUTH0_AUDIENCE="https://api.sinergy.com"
```

---

## 2. Registro del Plugin en `main.ts`

```typescript
// apps/frontend/src/main.ts
import { createApp } from 'vue'
import { createAuth0 } from '@auth0/auth0-vue'
import App from './App.vue'

const app = createApp(App)

app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE
    }
  })
)

app.mount('#app')
```

---

## 3. Tutorial de Uso con Composition API (`useAuth0`)

```vue
<!-- apps/frontend/src/components/common/UserProfile.vue -->
<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'

const {
  loginWithRedirect,
  logout,
  user,
  isAuthenticated,
  isLoading,
  getAccessTokenSilently
} = useAuth0()

function iniciarSesion() {
  loginWithRedirect()
}

function cerrarSesion() {
  logout({
    logoutParams: {
      returnTo: window.location.origin
    }
  })
}

async function obtenerTokenParaBackend() {
  try {
    const token = await getAccessTokenSilently()
    console.log('Access Token JWT obtenido para enviar al Backend:', token)
    return token
  } catch (error) {
    console.error('Error al obtener token silencioso:', error)
  }
}
</script>

<template>
  <div v-if="isLoading" class="d-flex align-center gap-2">
    <v-progress-circular indeterminate size="24" color="primary" />
    <span>Cargando sesión...</span>
  </div>

  <div v-else-if="isAuthenticated" class="d-flex align-center gap-3">
    <v-avatar color="primary" size="36">
      <v-img :src="user?.picture" :alt="user?.name" />
    </v-avatar>

    <div class="d-flex flex-column">
      <span class="font-weight-bold text-body-2">{{ user?.name }}</span>
      <span class="text-caption text-grey">{{ user?.email }}</span>
    </div>

    <v-btn icon="mdi-logout" size="small" variant="text" color="error" @click="cerrarSesion" />
  </div>

  <v-btn v-else color="primary" prepend-icon="mdi-login" @click="iniciarSesion">
    Iniciar Sesión con Auth0
  </v-btn>
</template>
```

---

## 4. Integración del Token de Auth0 con Axios

Para inyectar el Token Bearer de Auth0 en las solicitudes de Axios:

```typescript
import { useAuth0 } from '@auth0/auth0-vue'
import http from '@/utils/http'

export function useAuthHttp() {
  const { getAccessTokenSilently } = useAuth0()

  const peticionAutenticada = async (url: string) => {
    const token = await getAccessTokenSilently()
    return http.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }

  return { peticionAutenticada }
}
```
