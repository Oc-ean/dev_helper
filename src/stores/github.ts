import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { localDB } from '../config/db'
import { useAuthStore } from './auth'
import type { GitHubRepo } from '@/types'

export const useGitHubStore = defineStore('github', () => {
  const authStore = useAuthStore()

  const repos = ref<GitHubRepo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const username = ref('')
  const searchQuery = ref('')

  const filteredRepos = computed(() =>
    repos.value.filter(
      (r) =>
        !searchQuery.value ||
        r.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (r.description ?? '').toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  )

  const starredRepos = computed(() => repos.value.filter((r) => r.starred))

  async function loadFromCache() {
    const uid = authStore.firebaseUser?.uid
    if (!uid) return
    repos.value = await localDB.githubRepos.where('userId').equals(uid).toArray()
  }

  async function fetchRepos(githubUsername: string) {
    if (!githubUsername.trim()) return
    loading.value = true
    error.value = null
    username.value = githubUsername

    try {
      const { data } = await axios.get<GHApiRepo[]>(
        `https://api.github.com/users/${githubUsername}/repos`,
        {
          params: { per_page: 100, sort: 'updated' },
          headers: { Accept: 'application/vnd.github.v3+json' },
        }
      )

      const uid = authStore.firebaseUser?.uid ?? 'guest'
      const existingStarred = new Set(repos.value.filter((r) => r.starred).map((r) => r.githubId))

      const mapped: GitHubRepo[] = data.map((r) => ({
        githubId: r.id,
        userId: uid,
        fullName: r.full_name,
        name: r.name,
        description: r.description,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        topics: r.topics ?? [],
        isPrivate: r.private,
        defaultBranch: r.default_branch,
        openIssuesCount: r.open_issues_count,
        url: r.html_url,
        homepage: r.homepage,
        pushedAt: r.pushed_at,
        createdAt: r.created_at,
        starred: existingStarred.has(r.id),
        lastSynced: Date.now(),
      }))

      await localDB.githubRepos.clear()
      await localDB.githubRepos.bulkAdd(mapped)
      repos.value = mapped
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch repos'
    } finally {
      loading.value = false
    }
  }

  async function toggleStar(githubId: number) {
    const repo = repos.value.find((r) => r.githubId === githubId)
    if (!repo) return
    repo.starred = !repo.starred
    if (repo.id) {
      await localDB.githubRepos.update(repo.id, { starred: repo.starred })
    }
  }

  return {
    repos, filteredRepos, starredRepos,
    loading, error, username, searchQuery,
    loadFromCache, fetchRepos, toggleStar,
  }
})

interface GHApiRepo {
  id: number
  full_name: string
  name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  private: boolean
  default_branch: string
  open_issues_count: number
  html_url: string
  homepage: string | null
  pushed_at: string
  created_at: string
}