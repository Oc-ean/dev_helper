<template>
  <aside
    class="flex flex-col border-r border-white/[0.05] bg-surface-100 z-50 transition-all duration-300 ease-in-out shrink-0"
    :class="[
      uiStore.sidebarCollapsed ? 'w-16' : 'w-60',
      'fixed lg:relative inset-y-0 left-0',
      uiStore.mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <div class="flex items-center gap-3 px-4 h-14 border-b border-white/[0.05] shrink-0">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 40 40" fill="none" class="w-4 h-4">
          <rect x="4" y="8" width="14" height="10" rx="2" fill="white" fill-opacity="0.9"/>
          <rect x="22" y="8" width="14" height="10" rx="2" fill="white" fill-opacity="0.5"/>
          <rect x="4" y="22" width="14" height="10" rx="2" fill="white" fill-opacity="0.5"/>
          <rect x="22" y="22" width="14" height="10" rx="2" fill="white" fill-opacity="0.9"/>
        </svg>
      </div>
      <span v-if="!uiStore.sidebarCollapsed" class="font-bold text-sm text-white">DevHelper</span>
    </div>

    <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-hide">
      <template v-for="item in navItems" :key="item.to">
        <RouterLink
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative"
          :class="isActive(item.to)
            ? 'bg-brand-500/15 text-white border border-brand-500/20'
            : 'text-white/50 hover:text-white hover:bg-white/[0.04]'"
          :title="uiStore.sidebarCollapsed ? item.label : undefined"
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0" />
          <span v-if="!uiStore.sidebarCollapsed" class="truncate">{{ item.label }}</span>
          <span
            v-if="!uiStore.sidebarCollapsed && isActive(item.to)"
            class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400"
          />
          <div
            v-if="uiStore.sidebarCollapsed"
            class="absolute left-full ml-2 px-2 py-1 bg-surface-50 border border-white/10 rounded-lg text-xs text-white whitespace-nowrap
                   opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
          >
            {{ item.label }}
          </div>
        </RouterLink>
      </template>
    </nav>

    <div class="border-t border-white/[0.05] p-2 space-y-1">
      <RouterLink
        to="/settings"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/[0.04] transition-all"
      >
        <IconSettings class="w-4 h-4 shrink-0" />
        <span v-if="!uiStore.sidebarCollapsed">Settings</span>
      </RouterLink>

      <button
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/[0.04] transition-all w-full"
        @click="uiStore.toggleSidebar()"
      >
        <IconChevronLeft class="w-4 h-4 shrink-0 transition-transform" :class="uiStore.sidebarCollapsed ? 'rotate-180' : ''" />
        <span v-if="!uiStore.sidebarCollapsed">Collapse</span>
      </button>

      <div v-if="!uiStore.sidebarCollapsed" class="flex items-center gap-2 px-3 py-2 mt-1">
        <div class="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-xs text-brand-300 font-medium shrink-0">
          {{ userInitials }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs text-white/60 truncate">{{ displayName }}</p>
          <p class="text-[10px] text-white/25 truncate">{{ authStore.isAnonymous ? 'Guest' : 'Syncing' }}</p>
        </div>
        <button class="btn-icon p-1 text-white/30" @click="logout" title="Sign out">
          <IconLogout class="w-3 h-3" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const iconBase = { inheritAttrs: false }

const IconDashboard = {
  ...iconBase,
  template: `<svg v-bind="$attrs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
}
const IconApi = {
  ...iconBase,
  template: `<svg v-bind="$attrs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
}
const IconSnippet = {
  ...iconBase,
  template: `<svg v-bind="$attrs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
}
const IconGithub = {
  ...iconBase,
  template: `<svg v-bind="$attrs" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
}
const IconDebug = {
  ...iconBase,
  template: `<svg v-bind="$attrs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-.5 3.06M12 12.75c-2.883 0-5.647.508-8.207 1.44a23.91 23.91 0 00.5 3.06M12 3v1.5M6.22 5.47l1.06 1.06M17.78 5.47l-1.06 1.06M3 12h1.5M19.5 12H21" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
}
const IconSettings = {
  ...iconBase,
  template: `<svg v-bind="$attrs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
}
const IconChevronLeft = {
  ...iconBase,
  template: `<svg v-bind="$attrs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M15.75 19.5L8.25 12l7.5-7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
}
const IconLogout = {
  ...iconBase,
  template: `<svg v-bind="$attrs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
}

const uiStore = useUIStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const navItems = [
  { label: 'Dashboard', to: '/', icon: IconDashboard },
  { label: 'API Tester', to: '/api-tester', icon: IconApi },
  { label: 'Snippets', to: '/snippets', icon: IconSnippet },
  { label: 'GitHub', to: '/github', icon: IconGithub },
  { label: 'Debug', to: '/debug', icon: IconDebug },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const displayName = computed(() =>
  authStore.isAnonymous ? 'Guest User' : (authStore.user?.displayName ?? authStore.user?.email ?? 'User')
)

const userInitials = computed(() => {
  if (authStore.isAnonymous) return 'G'
  const name = authStore.user?.displayName ?? ''
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
})

async function logout() {
  await authStore.logout()
  router.push({ name: 'login' })
}

</script>