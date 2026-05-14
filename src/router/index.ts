import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   path: '/splash',
    //   name: 'splash',
    //   component: () => import('@/views/SplashView.vue'),
    //   meta: { public: true },
    // },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
      meta: { public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/views/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'api-tester',
          name: 'api-tester',
          component: () => import('@/views/ApiTesterView.vue'),
        },
        {
          path: 'snippets',
          name: 'snippets',
          component: () => import('@/views/SnippetsView.vue'),
        },
        {
          path: 'github',
          name: 'github',
          component: () => import('@/views/GitHubView.vue'),
        },
        {
          path: 'debug',
          name: 'debug',
          component: () => import('@/views/DebugView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.waitForInit()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.public && authStore.isAuthenticated && to.name !== 'onboarding') {
    return { name: 'dashboard' }
  }
})

export default router