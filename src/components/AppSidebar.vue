<template>
  <aside
    class="flex flex-col border-r border-white/[0.05] bg-surface-100 z-50 transition-all duration-300 ease-in-out shrink-0 overflow-hidden"
    :class="[
      uiStore.sidebarCollapsed ? 'w-16' : 'w-60',
      'fixed lg:relative inset-y-0 left-0',
      uiStore.mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Logo bar -->
    <div
      class="flex items-center h-14 border-b border-white/[0.05] shrink-0 transition-all duration-300"
      :class="uiStore.sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'"
    >
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 40 40" fill="none" class="w-4 h-4">
          <rect x="4" y="8" width="14" height="10" rx="2" fill="white" fill-opacity="0.9"/>
          <rect x="22" y="8" width="14" height="10" rx="2" fill="white" fill-opacity="0.5"/>
          <rect x="4" y="22" width="14" height="10" rx="2" fill="white" fill-opacity="0.5"/>
          <rect x="22" y="22" width="14" height="10" rx="2" fill="white" fill-opacity="0.9"/>
        </svg>
      </div>
      <span v-if="!uiStore.sidebarCollapsed" class="font-bold text-sm text-white whitespace-nowrap">DevHelper</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-4 space-y-0.5 scrollbar-hide" :class="uiStore.sidebarCollapsed ? 'px-2' : 'px-2'">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center py-2.5 rounded-lg text-sm transition-all duration-200 group relative"
        :class="[
          isActive(item.to)
            ? 'bg-brand-500/15 text-white border border-brand-500/20'
            : 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent',
          uiStore.sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
        ]"
      >
        <component :is="item.icon" :size="18" class="shrink-0" />
        <span v-if="!uiStore.sidebarCollapsed" class="truncate">{{ item.label }}</span>
        <span
          v-if="!uiStore.sidebarCollapsed && isActive(item.to)"
          class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0"
        />
        <!-- Tooltip when collapsed -->
        <div
          v-if="uiStore.sidebarCollapsed"
          class="absolute left-full ml-3 px-2 py-1 bg-surface-50 border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
        >
          {{ item.label }}
        </div>
      </RouterLink>
    </nav>

    <!-- Footer -->
    <div class="border-t border-white/[0.05] p-2 space-y-1">
      <!-- Settings -->
      <RouterLink
        to="/settings"
        class="flex items-center py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/[0.04] transition-all group relative"
        :class="uiStore.sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'"
      >
        <Settings :size="18" class="shrink-0" />
        <span v-if="!uiStore.sidebarCollapsed">Settings</span>
        <div
          v-if="uiStore.sidebarCollapsed"
          class="absolute left-full ml-3 px-2 py-1 bg-surface-50 border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
        >
          Settings
        </div>
      </RouterLink>

      <!-- Collapse toggle -->
      <button
        class="flex items-center py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/[0.04] transition-all w-full"
        :class="uiStore.sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'"
        @click="uiStore.toggleSidebar()"
      >
        <ChevronLeft
          :size="18"
          class="shrink-0 transition-transform duration-300"
          :class="uiStore.sidebarCollapsed ? 'rotate-180' : ''"
        />
        <span v-if="!uiStore.sidebarCollapsed">Collapse</span>
      </button>

      <!-- User row -->
      <div v-if="!uiStore.sidebarCollapsed" class="flex items-center gap-2 px-3 py-2 mt-1">
        <div class="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-xs text-brand-300 font-medium shrink-0">
          {{ userInitials }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs text-white/60 truncate">{{ displayName }}</p>
          <p class="text-[10px] text-white/25 truncate">{{ authStore.isAnonymous ? 'Guest' : 'Syncing' }}</p>
        </div>
        <button class="p-1 text-white/30 hover:text-white transition-colors" @click="logout" title="Sign out">
          <LogOut :size="14" />
        </button>
      </div>

      <!-- Collapsed user avatar -->
      <div v-else class="flex justify-center py-2">
        <div class="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-xs text-brand-300 font-medium cursor-pointer" @click="logout" title="Sign out">
          {{ userInitials }}
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Pencil,
  Code2,
  Github,
  Bug,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const uiStore = useUIStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const navItems = [
  { label: 'Dashboard',  to: '/',           icon: LayoutDashboard },
  { label: 'API Tester', to: '/api-tester', icon: Pencil },
  { label: 'Snippets',   to: '/snippets',   icon: Code2 },
  { label: 'GitHub',     to: '/github',     icon: Github },
  { label: 'Debug',      to: '/debug',      icon: Bug },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const displayName = computed(() =>
  authStore.isAnonymous
    ? 'Guest User'
    : (authStore.user?.displayName ?? authStore.user?.email ?? 'User')
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