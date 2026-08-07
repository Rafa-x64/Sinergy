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
    meta: { requiresAuth: true, hideLayout: false },
  },
  {
    path: '/ubicaciones',
    name: 'ubicaciones',
    component: () => import('../modules/ubicaciones/views/UbicacionesView.vue'),
    meta: { requiresAuth: true, hideLayout: false },
  },
  {
    path: '/lineas',
    name: 'lineas',
    component: () => import('../modules/lineas/views/LineasView.vue'),
    meta: { requiresAuth: true, hideLayout: false },
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

  if (!requiereAuth && authStore.estaAutenticado && to.name === 'login') {
    return { name: 'dashboard' }
  }
})

export default router
