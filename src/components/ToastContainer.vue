<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in uiStore.toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md text-sm max-w-sm shadow-2xl"
          :class="toastClass(toast.type)"
        >
          <span class="text-base shrink-0">{{ toastIcon(toast.type) }}</span>
          <span class="text-white/90">{{ toast.message }}</span>
          <button
            class="ml-auto text-white/40 hover:text-white shrink-0"
            @click="uiStore.removeToast(toast.id)"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5">
              <path d="M3 3l10 10M13 3L3 13" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import type { Toast } from '@/types'

const uiStore = useUIStore()

function toastClass(type: Toast['type']) {
  const map = {
    success: 'bg-green-950/80 border-green-500/30',
    error: 'bg-red-950/80 border-red-500/30',
    warning: 'bg-yellow-950/80 border-yellow-500/30',
    info: 'bg-surface-50/90 border-white/10',
  }
  return map[type]
}

function toastIcon(type: Toast['type']) {
  const map = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }
  return map[type]
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(12px) scale(0.95); }
.toast-leave-to   { opacity: 0; transform: translateX(20px); }
</style>