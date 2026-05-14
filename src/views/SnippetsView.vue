<template>
  <div class="p-6 max-w-6xl mx-auto space-y-5 animate-fade-in">
    <div class="flex flex-wrap gap-3 items-center">
      <input v-model="snippetsStore.searchQuery" class="input flex-1 min-w-48" placeholder="Search snippets..." />
      <select v-model="snippetsStore.filterLanguage" class="select w-36 text-sm">
        <option value="all">All languages</option>
        <option v-for="l in languages" :key="l" :value="l">{{ l }}</option>
      </select>
      <button class="btn-primary gap-2" @click="showForm = true">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4"><path d="M8 1v14M1 8h14" stroke-linecap="round"/></svg>
        New Snippet
      </button>
    </div>

    <div v-if="snippetsStore.allTags.length" class="flex flex-wrap gap-2">
      <button
        class="badge cursor-pointer transition-all text-xs"
        :class="snippetsStore.filterTag === '' ? 'bg-brand-500/30 text-brand-300' : 'bg-white/[0.06] text-white/40 hover:bg-white/10'"
        @click="snippetsStore.filterTag = ''"
      >
        All
      </button>
      <button
        v-for="tag in snippetsStore.allTags"
        :key="tag"
        class="badge cursor-pointer transition-all text-xs"
        :class="snippetsStore.filterTag === tag ? 'bg-brand-500/30 text-brand-300' : 'bg-white/[0.06] text-white/40 hover:bg-white/10'"
        @click="snippetsStore.filterTag = tag"
      >
        #{{ tag }}
      </button>
    </div>

    <div v-if="snippetsStore.filteredSnippets.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="snippet in snippetsStore.filteredSnippets"
        :key="snippet.id"
        class="card p-4 flex flex-col gap-3 group hover:border-white/10 transition-all"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium text-white truncate">{{ snippet.title }}</h3>
            <p v-if="snippet.description" class="text-xs text-white/30 truncate mt-0.5">{{ snippet.description }}</p>
          </div>
          <span class="badge-gray text-[10px] shrink-0">{{ snippet.language }}</span>
        </div>

        <pre class="code-block text-[11px] text-white/60 max-h-28 overflow-hidden relative">{{ snippet.code.slice(0, 300) }}<div v-if="snippet.code.length > 300" class="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/60 to-transparent" /></pre>

        <div v-if="snippet.tags.length" class="flex flex-wrap gap-1">
          <span v-for="tag in snippet.tags" :key="tag" class="badge-blue text-[10px] cursor-pointer" @click="snippetsStore.filterTag = tag">
            #{{ tag }}
          </span>
        </div>

        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="btn-secondary text-xs flex-1 justify-center py-1.5 gap-1.5" @click="copySnippet(snippet.code)">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" class="w-3 h-3"><rect x="5" y="5" width="9" height="9" rx="1"/><path d="M3 11V3h8" stroke-linecap="round"/></svg>
            Copy
          </button>
          <button class="btn-secondary text-xs flex-1 justify-center py-1.5" @click="editSnippet(snippet)">Edit</button>
          <button class="btn-danger text-xs px-3 py-1.5" @click="deleteSnippet(snippet.id!)">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" class="w-3 h-3"><path d="M3 4h10M5 4V2h6v2M6 7v5M10 7v5M4 4l.5 9h7L12 4" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!snippetsStore.loading" class="text-center py-24 text-white/25">
      <div class="text-4xl mb-4">📌</div>
      <p class="text-lg font-medium text-white/40">No snippets found</p>
      <p class="text-sm mt-1">{{ snippetsStore.searchQuery ? 'Try a different search' : 'Create your first code snippet' }}</p>
      <button v-if="!snippetsStore.searchQuery" class="btn-primary mt-4" @click="showForm = true">Create Snippet</button>
    </div>

    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="closeForm">
        <div class="w-full max-w-2xl bg-surface-50 border border-white/10 rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h2 class="font-semibold text-white">{{ editingId ? 'Edit Snippet' : 'New Snippet' }}</h2>
            <button class="btn-icon" @click="closeForm">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" class="w-4 h-4"><path d="M2 2l12 12M14 2L2 14" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="section-title">Title</label>
                <input v-model="form.title" class="input" placeholder="e.g. Flutter Login UI" />
              </div>
              <div>
                <label class="section-title">Language</label>
                <select v-model="form.language" class="select">
                  <option v-for="l in languages" :key="l" :value="l">{{ l }}</option>
                </select>
              </div>
              <div>
                <label class="section-title">Tags (comma separated)</label>
                <input v-model="tagsInput" class="input" placeholder="flutter, ui, login" />
              </div>
            </div>
            <div>
              <label class="section-title">Description (optional)</label>
              <input v-model="form.description" class="input" placeholder="What does this snippet do?" />
            </div>
            <div>
              <label class="section-title">Code</label>
              <textarea v-model="form.code" class="input font-mono text-xs resize-none h-48" placeholder="Paste your code here..." />
            </div>
          </div>
          <div class="px-6 py-4 border-t border-white/[0.06] flex gap-3 justify-end">
            <button class="btn-ghost" @click="closeForm">Cancel</button>
            <button class="btn-primary" :disabled="!form.title || !form.code" @click="submitForm">
              {{ editingId ? 'Update' : 'Save Snippet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useSnippetsStore } from '@/stores/snippets'
import { useUIStore } from '@/stores/ui'
import type { Snippet, Language } from '@/types'

const snippetsStore = useSnippetsStore()
const uiStore = useUIStore()

const languages: Language[] = ['typescript', 'javascript', 'dart', 'python', 'php', 'rust', 'go', 'java', 'kotlin', 'swift', 'css', 'html', 'sql', 'bash', 'other']

const showForm = ref(false)
const editingId = ref<number | null>(null)
const tagsInput = ref('')

const form = reactive({
  title: '',
  language: 'typescript' as Language,
  code: '',
  description: '',
})

function editSnippet(snippet: Snippet) {
  editingId.value = snippet.id!
  form.title = snippet.title
  form.language = snippet.language
  form.code = snippet.code
  form.description = snippet.description ?? ''
  tagsInput.value = snippet.tags.join(', ')
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  form.title = ''
  form.code = ''
  form.description = ''
  tagsInput.value = ''
}

async function submitForm() {
  const tags = tagsInput.value.split(',').map((t) => t.trim()).filter(Boolean)
  if (editingId.value) {
    await snippetsStore.updateSnippet(editingId.value, { ...form, tags })
    uiStore.toast('Snippet updated!', 'success')
  } else {
    await snippetsStore.createSnippet({ ...form, tags })
    uiStore.toast('Snippet saved!', 'success')
  }
  closeForm()
}

async function copySnippet(code: string) {
  await navigator.clipboard.writeText(code)
  uiStore.toast('Code copied!', 'success')
}

async function deleteSnippet(id: number) {
  await snippetsStore.deleteSnippet(id)
  uiStore.toast('Snippet deleted', 'info')
}
</script>