<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-white">
          {{ greeting }}, {{ firstName }} 👋
        </h2>
        <p class="text-white/40 text-sm mt-0.5">Here's your developer workspace</p>
      </div>
      <div class="text-right text-xs text-white/25 hidden sm:block">
        <p>{{ currentDate }}</p>
        <p>{{ currentTime }}</p>
      </div>
    </div>

    <div>
      <p class="section-title">Quick Actions</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <RouterLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          class="card-hover p-4 flex flex-col gap-3 group"
        >
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-transform group-hover:scale-110"
            :class="action.bg"
          >
            {{ action.emoji }}
          </div>
          <div>
            <p class="text-sm font-medium text-white">{{ action.label }}</p>
            <p class="text-xs text-white/40 mt-0.5">{{ action.desc }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card p-4">
        <p class="text-xs text-white/30 mb-1">Snippets</p>
        <p class="text-2xl font-bold text-white">{{ snippetsStore.snippets.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-white/30 mb-1">API Requests</p>
        <p class="text-2xl font-bold text-white">{{ apiStore.requests.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-white/30 mb-1">Repos Tracked</p>
        <p class="text-2xl font-bold text-white">{{ githubStore.repos.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-white/30 mb-1">Debug Sessions</p>
        <p class="text-2xl font-bold text-white">{{ debugStore.sessions.length }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <div class="card p-4">
        <div class="flex items-center justify-between mb-4">
          <p class="section-title mb-0">Recent Snippets</p>
          <RouterLink to="/snippets" class="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            View all →
          </RouterLink>
        </div>
        <div v-if="recentSnippets.length" class="space-y-2">
          <div
            v-for="s in recentSnippets"
            :key="s.id"
            class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
            @click="$router.push('/snippets')"
          >
            <div class="w-8 h-8 rounded-md bg-white/[0.04] flex items-center justify-center text-xs font-mono text-white/40 shrink-0">
              {{ langAbbr(s.language) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white truncate">{{ s.title }}</p>
              <p class="text-xs text-white/30 truncate">{{ s.tags.map(t => '#' + t).join(' ') || 'No tags' }}</p>
            </div>
            <span class="badge-gray text-[10px]">{{ s.language }}</span>
          </div>
        </div>
        <div v-else class="text-center py-8 text-white/25 text-sm">
          No snippets yet. <RouterLink to="/snippets" class="text-brand-400 hover:underline">Add one →</RouterLink>
        </div>
      </div>

      <div class="card p-4">
        <div class="flex items-center justify-between mb-4">
          <p class="section-title mb-0">Recent API Tests</p>
          <RouterLink to="/api-tester" class="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            View all →
          </RouterLink>
        </div>
        <div v-if="recentRequests.length" class="space-y-2">
          <div
            v-for="r in recentRequests"
            :key="r.id"
            class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
            @click="loadAndGoRequest(r)"
          >
            <span class="text-xs font-mono font-semibold w-14 shrink-0" :class="`method-${r.method}`">
              {{ r.method }}
            </span>
            <p class="text-sm text-white/70 truncate flex-1">{{ r.name || r.url }}</p>
          </div>
        </div>
        <div v-else class="text-center py-8 text-white/25 text-sm">
          No saved requests. <RouterLink to="/api-tester" class="text-brand-400 hover:underline">Test an API →</RouterLink>
        </div>
      </div>

      <div class="card p-4">
        <div class="flex items-center justify-between mb-4">
          <p class="section-title mb-0">Starred Repos</p>
          <RouterLink to="/github" class="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            View all →
          </RouterLink>
        </div>
        <div v-if="starredRepos.length" class="space-y-2">
          <a
            v-for="repo in starredRepos.slice(0, 4)"
            :key="repo.githubId"
            :href="repo.url"
            target="_blank"
            class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white truncate">{{ repo.name }}</p>
              <p class="text-xs text-white/30 truncate">{{ repo.description ?? 'No description' }}</p>
            </div>
            <div class="flex items-center gap-1 text-xs text-white/30 shrink-0">
              <span>⭐</span>
              <span>{{ repo.stars }}</span>
            </div>
          </a>
        </div>
        <div v-else class="text-center py-8 text-white/25 text-sm">
          No starred repos. <RouterLink to="/github" class="text-brand-400 hover:underline">Connect GitHub →</RouterLink>
        </div>
      </div>

      <div class="card p-4">
        <div class="flex items-center justify-between mb-4">
          <p class="section-title mb-0">Debug Sessions</p>
          <RouterLink to="/debug" class="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            View all →
          </RouterLink>
        </div>
        <div v-if="activeSessions.length" class="space-y-2">
          <div
            v-for="s in activeSessions"
            :key="s.id"
            class="p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
            @click="$router.push('/debug')"
          >
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-sm text-white">{{ s.title }}</p>
              <span class="badge-gray text-[10px]">{{ s.category }}</span>
            </div>
            <div class="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full bg-brand-500 rounded-full transition-all"
                :style="{ width: s.progress + '%' }"
              />
            </div>
            <p class="text-xs text-white/30 mt-1">{{ s.progress }}% complete</p>
          </div>
        </div>
        <div v-else class="text-center py-8 text-white/25 text-sm">
          No active sessions. <RouterLink to="/debug" class="text-brand-400 hover:underline">Start debugging →</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSnippetsStore } from '@/stores/snippets.ts'
import { useApiTesterStore } from '@/stores/apiTester.ts'
import { useGitHubStore } from '@/stores/github.ts'
import { useDebugStore } from '@/stores/debug.ts'
import type { ApiRequest } from '@/types'

const authStore = useAuthStore()
const snippetsStore = useSnippetsStore()
const apiStore = useApiTesterStore()
const githubStore = useGitHubStore()
const debugStore = useDebugStore()
const router = useRouter()

const now = ref(new Date())
let timer: number

onMounted(() => { timer = setInterval(() => (now.value = new Date()), 1000) as unknown as number })
onUnmounted(() => clearInterval(timer))

const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const firstName = computed(() => {
  if (authStore.isAnonymous) return 'Developer'
  return authStore.user?.displayName?.split(' ')[0] ?? 'Developer'
})

const currentDate = computed(() => now.value.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }))
const currentTime = computed(() => now.value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))

const quickActions = [
  { label: 'Test API', desc: 'Send HTTP requests', to: '/api-tester', emoji: '🌐', bg: 'bg-brand-500/20' },
  { label: 'Save Snippet', desc: 'Store code fragments', to: '/snippets', emoji: '📌', bg: 'bg-purple-500/20' },
  { label: 'GitHub', desc: 'Browse repositories', to: '/github', emoji: '🐙', bg: 'bg-white/10' },
  { label: 'Debug', desc: 'Structured checklists', to: '/debug', emoji: '🧠', bg: 'bg-orange-500/20' },
]

const recentSnippets = computed(() => snippetsStore.snippets.slice(0, 4))
const recentRequests = computed(() => apiStore.requests.slice(0, 4))
const starredRepos = computed(() => githubStore.starredRepos)
const activeSessions = computed(() => debugStore.sessions.filter((s) => !s.resolved).slice(0, 3))

const langAbbr = (lang: string) => lang.slice(0, 2).toUpperCase()

function loadAndGoRequest(r: ApiRequest) {
  apiStore.loadRequest(r)
  router.push('/api-tester')
}
</script>