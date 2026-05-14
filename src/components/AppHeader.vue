<template>
  <header class="h-14 border-b border-white/[0.05] flex items-center gap-3 px-4 bg-surface-100/50 backdrop-blur-sm shrink-0">
    <button class="lg:hidden btn-icon" @click="uiStore.toggleMobileSidebar()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5">
        <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" stroke-linecap="round"/>
      </svg>
    </button>

    <div class="flex-1 min-w-0">
      <h1 class="text-sm font-semibold text-white truncate">{{ pageTitle }}</h1>
      <p class="text-xs text-white/30 truncate">{{ pageSubtitle }}</p>
    </div>

    <div v-if="!authStore.isAnonymous" class="flex items-center gap-1.5 text-xs text-white/30">
      <div class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      <span class="hidden sm:inline">Synced</span>
    </div>

    <button class="btn-icon" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
      <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4">
        <path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" stroke-linecap="round"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4">
        <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" stroke-linecap="round"/>
      </svg>
    </button>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const uiStore = useUIStore()
const authStore = useAuthStore()
const route = useRoute()

const isDark = computed(() => authStore.user?.theme === 'dark')
const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Developer control center' },
  '/api-tester': { title: 'API Tester', subtitle: 'Test and save HTTP requests' },
  '/snippets': { title: 'Code Snippets', subtitle: 'Save and search code' },
  '/github': { title: 'GitHub', subtitle: 'Track your repositories' },
  '/debug': { title: 'Debug Checklist', subtitle: 'Structured debugging sessions' },
  '/settings': { title: 'Settings', subtitle: 'Preferences and account' },
}

const pageTitle = computed(() => pageMeta[route.path]?.title ?? 'DevHelper')
const pageSubtitle = computed(() => pageMeta[route.path]?.subtitle ?? '')

function toggleTheme() {
  const current = authStore.user?.theme ?? 'dark'
  const newTheme = current === 'dark' ? 'light' : 'dark'

  authStore.updateTheme(newTheme)
}
</script>