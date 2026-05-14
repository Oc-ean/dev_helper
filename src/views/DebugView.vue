<template>
  <div class="p-6 max-w-5xl mx-auto animate-fade-in">
    <div class="grid lg:grid-cols-[320px_1fr] gap-6">
      <div class="space-y-4">
        <div class="card p-4 space-y-3">
          <p class="section-title">New Debug Session</p>
          <input v-model="newTitle" class="input text-sm" placeholder="Bug fix session title..." />
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="p-2.5 rounded-lg border text-xs font-medium transition-all"
              :class="selectedCat === cat.id
                ? 'border-brand-500/60 bg-brand-500/15 text-white'
                : 'border-white/[0.06] bg-white/[0.03] text-white/50 hover:text-white hover:border-white/20'"
              @click="selectedCat = cat.id"
            >
              <span class="block text-lg mb-1">{{ cat.emoji }}</span>
              {{ cat.label }}
            </button>
          </div>
          <button
            class="btn-primary w-full justify-center"
            :disabled="!newTitle || !selectedCat"
            @click="startSession"
          >
            Start Session
          </button>
        </div>

        <div>
          <p class="section-title">Sessions</p>
          <div class="space-y-2">
            <div
              v-for="s in debugStore.sortedSessions"
              :key="s.id"
              class="card p-3 cursor-pointer transition-all"
              :class="debugStore.activeSession?.id === s.id ? 'border-brand-500/40 bg-brand-500/10' : 'hover:border-white/10'"
              @click="debugStore.activeSession = s"
            >
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm">{{ catEmoji(s.category) }}</span>
                <p class="text-sm text-white font-medium truncate flex-1">{{ s.title }}</p>
                <span v-if="s.resolved" class="badge-green text-[10px]">Done</span>
              </div>
              <div class="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="s.resolved ? 'bg-green-500' : 'bg-brand-500'"
                  :style="{ width: s.progress + '%' }"
                />
              </div>
              <p class="text-[10px] text-white/30 mt-1">{{ s.progress }}% · {{ s.category }}</p>
            </div>
            <p v-if="!debugStore.sessions.length" class="text-xs text-white/25 text-center py-6">
              No sessions yet
            </p>
          </div>
        </div>
      </div>

      <div v-if="debugStore.activeSession" class="card p-5 space-y-5 animate-slide-right">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span>{{ catEmoji(debugStore.activeSession.category) }}</span>
              <h2 class="font-semibold text-white">{{ debugStore.activeSession.title }}</h2>
            </div>
            <p class="text-xs text-white/40">{{ debugStore.activeSession.category }} debugging checklist</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              v-if="!debugStore.activeSession.resolved"
              class="btn-secondary text-xs gap-1.5"
              @click="resolve"
            >
              ✓ Mark Resolved
            </button>
            <button class="btn-danger text-xs" @click="deleteSession">Delete</button>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-white/40">Progress</span>
            <span class="text-xs font-medium text-white">{{ debugStore.activeSession.progress }}%</span>
          </div>
          <div class="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="debugStore.activeSession.resolved ? 'bg-green-500' : 'bg-brand-500'"
              :style="{ width: debugStore.activeSession.progress + '%' }"
            />
          </div>
        </div>

        <div class="space-y-2">
          <button
            v-for="item in debugStore.activeSession.items"
            :key="item.id"
            class="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group"
            :class="item.completed ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/[0.03] hover:bg-white/[0.06] border border-transparent'"
            @click="!debugStore.activeSession?.resolved && toggleItem(item.id)"
            :disabled="debugStore.activeSession.resolved"
          >
            <div
              class="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
              :class="item.completed ? 'bg-green-500 border-green-500' : 'border-white/20 group-hover:border-white/40'"
            >
              <svg v-if="item.completed" viewBox="0 0 12 12" fill="none" class="w-3 h-3">
                <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span
              class="text-sm transition-colors"
              :class="item.completed ? 'text-white/40 line-through' : 'text-white/80'"
            >
              {{ item.text }}
            </span>
          </button>
        </div>

        <div v-if="debugStore.activeSession.resolved" class="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          <span>✓</span> This session is marked as resolved!
        </div>
      </div>

      <div v-else class="flex items-center justify-center rounded-2xl border border-dashed border-white/10 min-h-64 text-center">
        <div class="text-white/25">
          <div class="text-4xl mb-3">🧠</div>
          <p class="font-medium">Start a debug session</p>
          <p class="text-xs mt-1">Select a category and begin your checklist</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDebugStore } from '@/stores/debug'
import { useUIStore } from '@/stores/ui'
import type { DebugCategory } from '@/types'

const debugStore = useDebugStore()
const uiStore = useUIStore()

const newTitle = ref('')
const selectedCat = ref<DebugCategory | null>(null)

const categories = [
  { id: 'api' as DebugCategory, label: 'API Issue', emoji: '🌐' },
  { id: 'ui' as DebugCategory, label: 'UI Bug', emoji: '🎨' },
  { id: 'performance' as DebugCategory, label: 'Performance', emoji: '⚡' },
  { id: 'firebase' as DebugCategory, label: 'Firebase', emoji: '🔥' },
  { id: 'database' as DebugCategory, label: 'Database', emoji: '🗄️' },
  { id: 'auth' as DebugCategory, label: 'Auth Issue', emoji: '🔐' },
]

const catEmoji = (cat: DebugCategory) => categories.find((c) => c.id === cat)?.emoji ?? '🐛'

async function startSession() {
  if (!newTitle.value || !selectedCat.value) return
  await debugStore.startSession(selectedCat.value, newTitle.value)
  newTitle.value = ''
  selectedCat.value = null
  uiStore.toast('Debug session started!', 'success')
}

async function toggleItem(itemId: string) {
  if (!debugStore.activeSession?.id) return
  await debugStore.toggleItem(debugStore.activeSession.id, itemId)
}

async function resolve() {
  if (!debugStore.activeSession?.id) return
  await debugStore.resolveSession(debugStore.activeSession.id)
  uiStore.toast('Session resolved! 🎉', 'success')
}

async function deleteSession() {
  if (!debugStore.activeSession?.id) return
  await debugStore.deleteSession(debugStore.activeSession.id)
  uiStore.toast('Session deleted', 'info')
}
</script>