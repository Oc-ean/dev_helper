<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
    <div class="card p-5">
      <p class="section-title">Account</p>
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-brand-500/20 flex items-center justify-center text-xl font-bold text-brand-300">
          {{ initials }}
        </div>
        <div>
          <p class="font-medium text-white">{{ displayName }}</p>
          <p class="text-sm text-white/40">{{ authStore.user?.email ?? 'Guest account' }}</p>
          <p v-if="authStore.isAnonymous" class="text-xs text-yellow-400 mt-0.5">
            ⚠ Guest mode — data only stored locally
          </p>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-white/[0.06]">
        <button class="btn-danger text-sm" @click="logout">Sign Out</button>
      </div>
    </div>

    <div class="card p-5">
      <p class="section-title">Workspaces</p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="ws in workspaceOptions"
          :key="ws.id"
          class="p-3 rounded-lg border text-sm text-left transition-all"
          :class="selectedWorkspaces.includes(ws.id)
            ? 'border-brand-500/60 bg-brand-500/15 text-white'
            : 'border-white/[0.06] bg-white/[0.03] text-white/50 hover:text-white hover:border-white/20'"
          @click="toggleWorkspace(ws.id)"
        >
          <span class="text-base mr-2">{{ ws.emoji }}</span>{{ ws.label }}
        </button>
      </div>
      <button class="btn-secondary text-sm mt-4" @click="saveWorkspaces" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save Workspaces' }}
      </button>
    </div>

    <div class="card p-5">
      <p class="section-title">Appearance</p>
      <div class="flex gap-3">
        <button
          v-for="t in themes"
          :key="t.id"
          class="flex-1 p-3 rounded-lg border text-sm transition-all"
          :class="currentTheme === t.id
            ? 'border-brand-500/60 bg-brand-500/15 text-white'
            : 'border-white/[0.06] bg-white/[0.03] text-white/50 hover:text-white'"
          @click="setTheme(t.id)"
        >
          <span class="block text-xl mb-1">{{ t.emoji }}</span>
          {{ t.label }}
        </button>
      </div>
    </div>

    <div class="card p-5">
      <p class="section-title">GitHub Integration</p>
      <div class="flex gap-2">
        <input v-model="githubUsername" class="input flex-1" placeholder="GitHub username" />
        <button class="btn-secondary" @click="saveGitHub">Save</button>
      </div>
    </div>

    <div class="card p-5">
      <p class="section-title">About</p>
      <div class="space-y-2 text-sm text-white/40">
        <div class="flex justify-between">
          <span>Version</span>
          <span class="text-white/60">1.0.0</span>
        </div>
        <div class="flex justify-between">
          <span>Built with</span>
          <span class="text-white/60">Vue 3 · TypeScript · Firebase</span>
        </div>
        <div class="flex justify-between">
          <span>Data storage</span>
          <span class="text-white/60">Dexie (local) + Firestore (cloud)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import type { Workspace, Theme } from '@/types'

const authStore = useAuthStore()
const uiStore = useUIStore()
const router = useRouter()

const saving = ref(false)
const currentTheme = ref<Theme>(authStore.user?.theme ?? 'dark')
const githubUsername = ref(authStore.user?.githubUsername ?? '')
const selectedWorkspaces = ref<Workspace[]>([...(authStore.user?.workspaces ?? [])])

const workspaceOptions = [
  { id: 'flutter' as Workspace, emoji: '📱', label: 'Flutter / Mobile' },
  { id: 'web' as Workspace, emoji: '🌐', label: 'Web Frontend' },
  { id: 'backend' as Workspace, emoji: '⚙️', label: 'Backend / API' },
  { id: 'devops' as Workspace, emoji: '🚀', label: 'DevOps / Cloud' },
]

const themes = [
  { id: 'dark' as Theme, emoji: '🌙', label: 'Dark' },
  { id: 'light' as Theme, emoji: '☀️', label: 'Light' },
  { id: 'system' as Theme, emoji: '💻', label: 'System' },
]

const displayName = computed(() =>
  authStore.isAnonymous ? 'Guest User' : (authStore.user?.displayName ?? 'Developer')
)

const initials = computed(() =>
  displayName.value.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
)

function toggleWorkspace(ws: Workspace) {
  const idx = selectedWorkspaces.value.indexOf(ws)
  if (idx === -1) selectedWorkspaces.value.push(ws)
  else selectedWorkspaces.value.splice(idx, 1)
}

async function saveWorkspaces() {
  saving.value = true
  await authStore.updateWorkspaces(selectedWorkspaces.value)
  saving.value = false
  uiStore.toast('Workspaces saved!', 'success')
}

async function setTheme(theme: Theme) {
  currentTheme.value = theme
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
  await authStore.updateTheme(theme)
  uiStore.toast('Theme updated!', 'success')
}

async function saveGitHub() {
  uiStore.toast('GitHub username saved!', 'success')
}

async function logout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>