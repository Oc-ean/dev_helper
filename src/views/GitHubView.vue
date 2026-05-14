<template>
  <div class="p-6 max-w-5xl mx-auto space-y-5 animate-fade-in">
    <div class="card p-5">
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-48">
          <label class="section-title">GitHub Username</label>
          <input
            v-model="usernameInput"
            class="input"
            placeholder="e.g. torvalds"
            @keydown.enter="fetchRepos"
          />
        </div>
        <button
          class="btn-primary gap-2"
          :disabled="githubStore.loading || !usernameInput"
          @click="fetchRepos"
        >
          <svg v-if="githubStore.loading" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          {{ githubStore.loading ? 'Fetching...' : 'Fetch Repos' }}
        </button>
      </div>
      <p v-if="githubStore.error" class="text-red-400 text-xs mt-2">{{ githubStore.error }}</p>
    </div>

    <div v-if="githubStore.repos.length" class="grid grid-cols-3 gap-3">
      <div class="card p-4">
        <p class="text-xs text-white/30 mb-1">Total Repos</p>
        <p class="text-2xl font-bold">{{ githubStore.repos.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-white/30 mb-1">Starred</p>
        <p class="text-2xl font-bold">{{ githubStore.starredRepos.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-white/30 mb-1">Total Stars</p>
        <p class="text-2xl font-bold">{{ totalStars }}</p>
      </div>
    </div>

    <div v-if="githubStore.repos.length" class="flex gap-3">
      <input v-model="githubStore.searchQuery" class="input flex-1" placeholder="Search repos..." />
      <select v-model="filterView" class="select w-36 text-sm">
        <option value="all">All repos</option>
        <option value="starred">Starred only</option>
        <option value="public">Public only</option>
      </select>
    </div>

    <div v-if="displayedRepos.length" class="space-y-3">
      <div
        v-for="repo in displayedRepos"
        :key="repo.githubId"
        class="card p-4 hover:border-white/10 transition-all"
      >
        <div class="flex items-start gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <a :href="repo.url" target="_blank" class="text-sm font-medium text-white hover:text-brand-400 transition-colors truncate">
                {{ repo.name }}
              </a>
              <span v-if="repo.isPrivate" class="badge-gray text-[10px]">private</span>
              <span v-if="repo.language" class="badge-purple text-[10px]">{{ repo.language }}</span>
            </div>
            <p class="text-xs text-white/40 line-clamp-2">{{ repo.description ?? 'No description' }}</p>

            <div v-if="repo.topics.length" class="flex flex-wrap gap-1 mt-2">
              <span v-for="t in repo.topics.slice(0, 5)" :key="t" class="badge-blue text-[10px]">{{ t }}</span>
            </div>

            <div class="flex items-center gap-4 mt-2 text-xs text-white/30">
              <span class="flex items-center gap-1">
                <span>⭐</span> {{ repo.stars }}
              </span>
              <span class="flex items-center gap-1">
                <span>🍴</span> {{ repo.forks }}
              </span>
              <span v-if="repo.openIssuesCount" class="flex items-center gap-1">
                <span>🐛</span> {{ repo.openIssuesCount }} issues
              </span>
              <span>Updated {{ timeAgo(repo.pushedAt) }}</span>
            </div>
          </div>

          <button
            class="btn-icon shrink-0 transition-all"
            :class="repo.starred ? 'text-yellow-400 hover:text-yellow-300' : 'text-white/20 hover:text-yellow-400'"
            @click="githubStore.toggleStar(repo.githubId)"
            :title="repo.starred ? 'Remove from favorites' : 'Add to favorites'"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5" :fill="repo.starred ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!githubStore.loading && !githubStore.repos.length" class="text-center py-24 text-white/25">
      <div class="text-5xl mb-4">🐙</div>
      <p class="text-lg font-medium text-white/40">No repos yet</p>
      <p class="text-sm mt-1">Enter a GitHub username and hit Fetch Repos</p>
    </div>

    <div v-else-if="!githubStore.loading && !displayedRepos.length" class="text-center py-12 text-white/25 text-sm">
      No repos match your search
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGitHubStore } from '@/stores/github'
import { formatDistanceToNow } from 'date-fns'

const githubStore = useGitHubStore()
const usernameInput = ref(githubStore.username)
const filterView = ref<'all' | 'starred' | 'public'>('all')

const totalStars = computed(() => githubStore.repos.reduce((s, r) => s + r.stars, 0))

const displayedRepos = computed(() => {
  let repos = githubStore.filteredRepos
  if (filterView.value === 'starred') repos = repos.filter((r) => r.starred)
  if (filterView.value === 'public') repos = repos.filter((r) => !r.isPrivate)
  return repos
})

async function fetchRepos() {
  await githubStore.fetchRepos(usernameInput.value)
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return 'recently'
  }
}
</script>