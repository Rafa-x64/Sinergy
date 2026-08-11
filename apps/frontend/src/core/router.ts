import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../modules/auth/auth.store'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'login',
    component: () => import('../modules/auth/views/LoginView.vue'),
    meta: { requiresAuth: false, hideLayout: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../modules/dashboard/views/DashboardView.vue'),
    meta: { requiresAuth: true, hideLayout: false },
  },
  {
    path: '/plantas',
    name: 'plantas',
    component: () => import('../modules/plantas/views/PlantasView.vue'),
    meta: {
      requiresAuth: true,
      hideLayout: false,
      roles: ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento']
    },
  },
  {
    path: '/ubicaciones',
    name: 'ubicaciones',
    component: () => import('../modules/ubicaciones/views/UbicacionesView.vue'),
    meta: {
      requiresAuth: true,
      hideLayout: false,
      roles: ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento']
    },
  },
  {
    path: '/lineas',
    name: 'lineas',
    component: () => import('../modules/lineas/views/LineasView.vue'),
    meta: {
      requiresAuth: true,
      hideLayout: false,
      roles: ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento']
    },
  },
  {
    path: '/roles',
    name: 'roles',
    component: () => import('../modules/auth/views/RolesView.vue'),
    meta: {
      requiresAuth: true,
      hideLayout: false,
      roles: ['Administrador del Sistema']
    },
  },
  {
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('../modules/usuarios/views/UsuariosView.vue'),
    meta: {
      requiresAuth: true,
      hideLayout: false,
      roles: ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento']
    },
  },
  {
    path: '/equipos',
    name: 'equipos',
    component: () => import('../modules/equipo/views/EquipoView.vue'),
    meta: {
      requiresAuth: true,
      hideLayout: false,
      roles: ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento']
    },
  },
  {
    path: '/montacargas',
    name: 'montacargas',
    component: () => import('../modules/equipo/views/EquiposPorTipoView.vue'),
    meta: { requiresAuth: true, hideLayout: false, tipoFiltro: 'Montacargas', titulo: 'Montacargas' },
  },
  {
    path: '/compresor',
    name: 'compresor',
    component: () => import('../modules/equipo/views/EquiposPorTipoView.vue'),
    meta: { requiresAuth: true, hideLayout: false, tipoFiltro: 'Compresor', titulo: 'Compresores' },
  },
  {
    path: '/generador',
    name: 'generador',
    component: () => import('../modules/equipo/views/EquiposPorTipoView.vue'),
    meta: { requiresAuth: true, hideLayout: false, tipoFiltro: 'Generador', titulo: 'Generadores' },
  },
  {
    path: '/chiller',
    name: 'chiller',
    component: () => import('../modules/equipo/views/EquiposPorTipoView.vue'),
    meta: { requiresAuth: true, hideLayout: false, tipoFiltro: 'Chiller', titulo: 'Chillers' },
  },
  {
    path: '/componentes',
    name: 'componentes',
    component: () => import('../modules/componentes/views/ComponentesView.vue'),
    meta: {
      requiresAuth: true,
      hideLayout: false,
      roles: ['Administrador del Sistema', 'Supervisor / Gerente de Mantenimiento']
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: false, hideLayout: true }
  }

]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

/**
 * Navigation Guard global.
 *
 * Flujo:
 * 1. Si la ruta requiere autenticación y no hay accessToken en memoria,
 *    intenta refrescar el token desde la HttpOnly Cookie (sesión persistente).
 * 2. Si el refresh tiene éxito, continúa la navegación normalmente.
 * 3. Si falla, redirige al login.
 * 4. Si la ruta no requiere autenticación y el usuario ya está logueado,
 *    redirige al dashboard para evitar que vea el login innecesariamente.
 * 5. Si la ruta especifica roles permitidos (meta.roles), verifica que el usuario
 *    tenga al menos uno de los roles requeridos; de lo contrario, redirige al dashboard.
 */
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const requiereAuth = to.meta.requiresAuth === true

  if (requiereAuth && !authStore.estaAutenticado) {
    const sesionRestaurada = await authStore.refrescarToken()
    if (!sesionRestaurada) {
      return { name: 'login' }
    }
  }

  if (requiereAuth && authStore.estaAutenticado) {
    const rolesPermitidos = to.meta.roles as string[] | undefined
    if (rolesPermitidos && !authStore.tieneRol(rolesPermitidos)) {
      return { name: 'dashboard' }
    }
  }

  if (!requiereAuth && authStore.estaAutenticado && to.name === 'login') {
    return { name: 'dashboard' }
  }
})

export default router
