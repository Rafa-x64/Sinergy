<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore, type LoginDTO } from '../auth.store'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { loginRules } from '../validations/login'
import { VuetifyForm } from '../../../core/types/vuetifyForm'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const cargando = ref<boolean>(false)
const mensajeServidor = ref<string | null>(null)
const formRef = ref<VuetifyForm | null>(null)

const formulario = reactive<LoginDTO>({
  nombreUsuario: '',
  password: ''
})

const manejarSubmit = async (): Promise<void> => {
  if (!formRef.value) return

  const { valid } = await formRef.value.validate()

  if (!valid) return

  cargando.value = true
  mensajeServidor.value = null

  try {
    const resultado = await authStore.login(formulario)

    if (resultado.status === 'ok' && authStore.estaAutenticado) {
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
      <div class="card-grid">
        <!-- Columna Formulario -->
        <div class="form-section">
          <h1 class="text-h4 font-weight-bold mb-6 text-center">Bienvenido</h1>

          <v-form @submit.prevent="manejarSubmit" ref="formRef" class="mt-2">
            <v-text-field v-model="formulario.nombreUsuario" :rules="loginRules.nombreUsuario" label="Nombre de Usuario"
              prepend-inner-icon="mdi-account" variant="outlined" placeholder="Ejemplo123*." type="text" class="mb-2"
              validate-on="blur"></v-text-field>

            <v-text-field v-model="formulario.password" :rules="loginRules.password" label="Contraseña"
              prepend-inner-icon="mdi-lock-outline" variant="outlined" placeholder="Contraseña123" type="password"
              class="mb-4" validate-on="blur"></v-text-field>

            <v-btn type="submit" color="primary" size="large" block :loading="cargando">
              {{ cargando ? 'Iniciando Sesión...' : 'Iniciar Sesión' }}
            </v-btn>
          </v-form>
        </div>

        <!-- Columna Logo -->
        <div class="brand-section">
          <img src="/LOGO_TUBRICA_AZUL.png" alt="Logo Tubrica" class="brand-logo" />
        </div>
      </div>
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
  display: flex;
  overflow: hidden;
}

/* Flex Grid Controlado */
.card-grid {
  display: flex;
  width: 100%;
  min-height: 550px;
}

.form-section {
  flex: 1;
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-section {
  flex: 1;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.brand-logo {
  max-width: 80%;
  max-height: 250px;
  object-fit: contain;
}

/* Responsividad para pantallas pequeñas */
@media (max-width: 960px) {
  .brand-section {
    display: none;
  }
}
</style>
