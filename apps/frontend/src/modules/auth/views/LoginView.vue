<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore, type LoginDTO } from '../auth.store'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { loginRules } from '../validations/login'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const cargando = ref<boolean>(false)
const mensajeServidor = ref<string | null>(null)
const formRef = ref<VuetifyForm | null>(null)

interface VuetifyForm {
  validate: () => Promise<{ valid: boolean, errors: unknown[] }>
}

const formulario = reactive<LoginDTO>({
  email: '',
  password: ''
})

const manejarSubmit = async (): Promise<void> => {
  if (!formRef.value) return

  const { valid } = await formRef.value.validate()

  if(!valid) return

  cargando.value = true
  mensajeServidor.value = null

  try {
    const resultado = await authStore.login(formulario)

    if (resultado.success && authStore.estaAutenticado) {
      await router.push({ name: 'dashboard' })
    } else {
      mensajeServidor.value = resultado.message ?? 'Credenciales inválidas'
      toast.error(mensajeServidor.value)
    }
  } catch (error: unknown) {
    mensajeServidor.value = 'Error de conexión con el servidor'
    toast.error(mensajeServidor.value)
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
          <h1 class="text-h4 font-weight-bold mb-6 text-center">Bienvenido</h1>

          <v-form @submit.prevent="manejarSubmit" ref="formRef" class="mt-6">
            <v-text-field v-model="formulario.email" :rules="loginRules.email" label="Correo" prepend-inner-icon="mdi-email-outline"
              variant="outlined" placeholder="correo@gmail.com" type="email" class="mb-2" validate-on="blur"></v-text-field>

            <v-text-field v-model="formulario.password" :rules="loginRules.password" label="Contraseña" prepend-inner-icon="mdi-lock-outline"
              variant="outlined" placeholder="Contraseña123" type="password" class="mb-4" validate-on="blur"></v-text-field>

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
