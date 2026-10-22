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
const mostrarPassword = ref<boolean>(false)
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
    <div class="bg-ambient-shape shape-1"></div>
    <div class="bg-ambient-shape shape-2"></div>

    <v-card class="login-card" elevation="8" rounded="xl">
      <div class="card-grid">
        <!-- Columna Formulario -->
        <div class="form-section">
          <div class="form-header mb-6">
            <h1 class="text-h4 font-weight-bold mb-1">
              Iniciar Sesión
            </h1>
            <p class="text-body-2 text-medium-emphasis">
              Ingresa tus credenciales para acceder a la plataforma
            </p>
          </div>

          <v-alert
            v-if="mensajeServidor"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4 rounded-lg"
            icon="mdi-alert-circle-outline"
          >
            {{ mensajeServidor }}
          </v-alert>

          <v-form @submit.prevent="manejarSubmit" ref="formRef" class="login-form">
            <v-text-field
              v-model="formulario.nombreUsuario"
              :rules="loginRules.nombreUsuario"
              label="Nombre de Usuario"
              placeholder="ej. admin.tubrica"
              prepend-inner-icon="mdi-account-outline"
              variant="outlined"
              color="primary"
              validate-on="blur"
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="formulario.password"
              :rules="loginRules.password"
              label="Contraseña"
              placeholder="Contraseña institucional"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="mostrarPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              @click:append-inner="mostrarPassword = !mostrarPassword"
              :type="mostrarPassword ? 'text' : 'password'"
              variant="outlined"
              color="primary"
              validate-on="blur"
              class="mb-4"
            ></v-text-field>

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              elevation="2"
              class="rounded-lg font-weight-bold submit-btn"
              :loading="cargando"
            >
              <v-icon start size="20">mdi-login-variant</v-icon>
              {{ cargando ? 'Iniciando sesión...' : 'Entrar al Sistema' }}
            </v-btn>
          </v-form>

          <div class="form-footer mt-8 pt-4 border-t d-flex align-center justify-space-between text-caption text-medium-emphasis">
            <span class="d-flex align-center" style="gap: 4px;">
              <v-icon size="16" color="success">mdi-shield-check-outline</v-icon>
              Conexión cifrada
            </span>
            <span>Versión 2.0 • Tubrica</span>
          </div>
        </div>

        <!-- Columna Marca / Hero Industrial -->
        <div class="brand-section">
          <div class="brand-overlay"></div>
          <div class="brand-content text-white">
            <div class="brand-chip mb-6">
              <v-icon size="18" class="mr-2">mdi-chart-timeline-variant</v-icon>
              <span>Control Operativo de Mantenimiento</span>
            </div>

            <!-- Logo Sinergy Vectorial Directo -->
            <div class="brand-logo-badge mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 88" class="vector-logo">
                <g fill="none" fill-rule="evenodd">
                  <rect x="4" y="10" width="68" height="68" rx="16" fill="#0f172a"/>
                  <path d="M53.5 31.8c-1.6-4.4-5.6-7.1-10.9-7.1-6.6 0-11.2 3.7-11.2 9.3 0 5 3.3 7.8 10.2 9.4 5.4 1.3 7.4 2.5 7.4 5 0 2.6-2.4 4.2-6.2 4.2-4 0-6.9-1.8-8-5.4l-5.6 1.6c1.5 5.6 6.4 9 13.4 9 7.4 0 12.4-3.9 12.4-9.9 0-5.3-3.2-8-10.4-9.7-5.3-1.3-7.2-2.4-7.2-4.7 0-2.3 2-3.7 5.4-3.7 3.4 0 5.9 1.5 6.9 4.5l5.8-1.9z" fill="#5cb85c"/>
                  <text x="92" y="58" font-family="'Segoe UI', Roboto, sans-serif" font-size="42" font-weight="700" letter-spacing="2" fill="#0f172a">SINERGY</text>
                  <text x="94" y="76" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" letter-spacing="4.5" fill="#64748b">GESTIÓN DE MANTENIMIENTO</text>
                </g>
              </svg>
            </div>

            <h2 class="text-h5 font-weight-bold mb-3">
              Gestión Integral Multiplanta
            </h2>

            <p class="brand-description text-body-2 mb-6">
              Monitoreo continuo de variables críticas, inspecciones preventivas y control de lubricación industrial en tiempo real.
            </p>

            <div class="d-flex flex-wrap" style="gap: 8px;">
              <v-chip size="small" variant="outlined" color="white" class="font-weight-medium">
                <v-icon start size="14">mdi-factory</v-icon> Extrusión
              </v-chip>
              <v-chip size="small" variant="outlined" color="white" class="font-weight-medium">
                <v-icon start size="14">mdi-factory</v-icon> Inyección
              </v-chip>
              <v-chip size="small" variant="outlined" color="white" class="font-weight-medium">
                <v-icon start size="14">mdi-factory</v-icon> Mezcla
              </v-chip>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.login-wrapper {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(var(--v-theme-background));
  padding: 24px 16px;
  overflow: hidden;
}

.bg-ambient-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
}

.shape-1 {
  width: 420px;
  height: 420px;
  top: -80px;
  right: -80px;
  background: radial-gradient(circle, rgb(var(--v-theme-primary)) 0%, transparent 70%);
}

.shape-2 {
  width: 380px;
  height: 380px;
  bottom: -60px;
  left: -60px;
  background: radial-gradient(circle, rgb(var(--v-theme-info)) 0%, transparent 70%);
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 980px;
  min-height: 560px;
  display: flex;
  border: 1px solid rgb(var(--v-theme-border));
  background-color: rgb(var(--v-theme-surface)) !important;
  box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.12) !important;
  overflow: hidden;
}

.card-grid {
  display: flex;
  width: 100%;
  min-height: 560px;
}

/* Columna Formulario */
.form-section {
  flex: 1.1;
  padding: 48px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.submit-btn {
  text-transform: none;
  letter-spacing: 0.3px;
  font-size: 0.95rem;
  height: 48px;
}

.border-t {
  border-top: 1px solid rgb(var(--v-theme-divider));
}

/* Columna Hero / Brand */
.brand-section {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: linear-gradient(145deg, #0F172A 0%, #1E293B 55%, #312E81 100%);
  overflow: hidden;
}

.brand-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.22), transparent 60%);
  pointer-events: none;
}

.brand-content {
  position: relative;
  z-index: 1;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.brand-chip {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #E0E7FF;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
}

.brand-logo-badge {
  background: #ffffff;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  max-width: 280px;
}

.vector-logo {
  width: 100%;
  height: 52px;
  display: block;
}

.brand-description {
  color: rgba(241, 245, 249, 0.85);
  line-height: 1.55;
}

/* Responsive */
@media (max-width: 960px) {
  .brand-section {
    display: none;
  }

  .form-section {
    padding: 36px 24px;
  }

  .login-card {
    max-width: 480px;
    min-height: auto;
  }
}
</style>
