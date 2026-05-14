<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/5 rounded-full blur-[100px]" />
    </div>

    <div class="relative z-10 w-full max-w-lg animate-slide-up">
      <div class="text-center mb-8">
        <p class="text-brand-400 text-xs font-semibold tracking-widest uppercase mb-3">Step 1 of 1</p>
        <h1 class="text-2xl font-bold text-white mb-2">What do you work with?</h1>
        <p class="text-white/40 text-sm">Select all that apply. This personalizes your dashboard.</p>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-6">
        <button
          v-for="ws in workspaceOptions"
          :key="ws.id"
          class="card p-5 text-left transition-all duration-200 hover:border-brand-500/40"
          :class="selected.includes(ws.id) ? 'border-brand-500/60 bg-brand-500/10' : ''"
          @click="toggle(ws.id)"
        >
          <div class="text-2xl mb-3">{{ ws.emoji }}</div>
          <div class="font-medium text-sm text-white mb-1">{{ ws.label }}</div>
          <div class="text-xs text-white/40">{{ ws.desc }}</div>
          <div
            v-if="selected.includes(ws.id)"
            class="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center"
          >
            <svg viewBox="0 0 12 12" fill="none" class="w-3 h-3">
              <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
      </div>

      <div class="card p-4 mb-6">
        <label class="text-xs text-white/40 font-medium uppercase tracking-wider block mb-2">
          GitHub Username <span class="normal-case">(optional)</span>
        </label>
        <div class="flex gap-2 items-center">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-white/30 flex-shrink-0">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          <input
            v-model="githubUsername"
            type="text"
            placeholder="your-username"
            class="input flex-1"
          />
        </div>
      </div>

      <button
        class="btn-primary w-full justify-center py-3"
        :disabled="!selected.length || saving"
        @click="finish"
      >
        <span v-if="saving">Setting up...</span>
        <span v-else>Get Started →</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Workspace } from '@/types'

const authStore = useAuthStore()
const router = useRouter()

const saving = ref(false)
const selected = ref<Workspace[]>([])
const githubUsername = ref('')

const workspaceOptions = [
  { id: 'flutter' as Workspace, emoji: '📱', label: 'Flutter / Mobile', desc: 'Dart, Flutter, mobile dev' },
  { id: 'web' as Workspace, emoji: '🌐', label: 'Web Frontend', desc: 'Vue, React, TypeScript' },
  { id: 'backend' as Workspace, emoji: '⚙️', label: 'Backend / API', desc: 'Node, PHP, Python, Go' },
  { id: 'devops' as Workspace, emoji: '🚀', label: 'DevOps / Cloud', desc: 'Docker, CI/CD, AWS' },
]

function toggle(ws: Workspace) {
  const idx = selected.value.indexOf(ws)
  if (idx === -1) selected.value.push(ws)
  else selected.value.splice(idx, 1)
}

async function finish() {
  saving.value = true
  await authStore.updateWorkspaces(selected.value)
  saving.value = false
  router.push({ name: 'dashboard' })
}
</script>