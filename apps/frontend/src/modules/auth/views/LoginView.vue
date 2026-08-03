<script setup lang="ts">
import { ref, reactive } from 'vue'

interface InicioSesionDTO {
  email: string
  password: string
}

interface RespuestaExito {
  success: true
  message: string
  data: {
    accessToken: string
  }
}

interface RespuestaError {
  success: false
  error: {
    message: string
  }
}

type RespuestaLogin = RespuestaExito | RespuestaError

const datosFormulario = reactive<InicioSesionDTO>({
  email: '',
  password: ''
})

const cargando = ref(false)
const mensajeServidor = ref<string | null>(null)

const API_URL = 'http://localhost:3000/api'

async function iniciarSesion(): Promise<void> {
  try {
    console.log(`Iniciando petición POST a ${API_URL}/auth/login`)

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(datosFormulario)
    })

    const respuesta = (await response.json()) as RespuestaLogin

    console.log('Estado HTTP:', response.status)

    if (respuesta.success) {
      console.log('Mensaje del servidor:', respuesta.message)
      console.log('Access Token recibido:', respuesta.data.accessToken)

      mensajeServidor.value = respuesta.message
      // Aquí puedes guardar el accessToken en memoria o redireccionar
    } else {
      // TypeScript infiere que 'respuesta' es RespuestaError
      console.log('Error del servidor:', respuesta.error.message)
      mensajeServidor.value = respuesta.error.message
    }

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('Error de red o servidor no disponible:', error.message)
      mensajeServidor.value = 'No se pudo conectar con el servidor'
    } else {
      console.log('Error desconocido:', error)
    }
  }
}

const enviar = async (): Promise<void> => {
  try {
    cargando.value = true
    mensajeServidor.value = null
    await iniciarSesion()
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <v-card class="login-card" elevation="4" rounded="lg">
      <v-row no-gutters class="fill-height">
        <!-- Columna de Formulario -->
        <v-col cols="12" md="6" class="pa-8 d-flex flex-column justify-center">
          <h1 class="text-h4 font-weight-bold mb-6">Bienvenido</h1>

          <v-form @submit.prevent="enviar">
            <v-text-field v-model="datosFormulario.email" label="Correo" prepend-inner-icon="mdi-email-outline"
              variant="outlined" placeholder="correo@gmail.com" type="email" class="mb-2"></v-text-field>

            <v-text-field v-model="datosFormulario.password" label="Contraseña" prepend-inner-icon="mdi-lock-outline"
              variant="outlined" placeholder="Contraseña123" type="password" class="mb-4"></v-text-field>

            <v-btn type="submit" color="primary" size="large" block :loading="cargando">
              {{ cargando ? 'Iniciando Sesión...' : 'Iniciar Sesión' }}
            </v-btn>
          </v-form>
        </v-col>

        <!-- Columna de Imagen -->
        <v-col cols="12" md="6" class="d-none d-md-flex">
          <v-img src="https://i.pinimg.com/1200x/a7/ec/c6/a7ecc6a77608ffbab4545c5a789c9b45.jpg" cover
            height="100%"></v-img>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<style scoped>
.login-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(var(--v-theme-background));
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 1000px;
  min-height: 550px;
  overflow: hidden;
}
</style>
