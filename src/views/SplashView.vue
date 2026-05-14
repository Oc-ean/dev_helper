<template>
  <div class="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]
                  bg-brand-500/10 rounded-full blur-[120px] animate-pulse-slow" />
    </div>

    <div class="relative z-10 flex flex-col items-center gap-6 animate-fade-in">
      <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-2xl glow-brand">
        <svg viewBox="0 0 40 40" fill="none" class="w-10 h-10">
          <rect x="4" y="8" width="14" height="10" rx="2" fill="white" fill-opacity="0.9"/>
          <rect x="22" y="8" width="14" height="10" rx="2" fill="white" fill-opacity="0.5"/>
          <rect x="4" y="22" width="14" height="10" rx="2" fill="white" fill-opacity="0.5"/>
          <rect x="22" y="22" width="14" height="10" rx="2" fill="white" fill-opacity="0.9"/>
        </svg>
      </div>

      <div class="text-center">
        <h1 class="text-3xl font-bold text-gradient mb-1">DevHelper</h1>
        <p class="text-white/40 text-sm">Developer Control Center</p>
      </div>

      <div class="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
          :style="{ width: progress + '%' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const progress = ref(0)

onMounted(async () => {
  const interval = setInterval(() => {
    progress.value = Math.min(progress.value + 12, 85)
  }, 120)

  await authStore.waitForInit()

  clearInterval(interval)
  progress.value = 100

  await new Promise((r) => setTimeout(r, 300))

  if (authStore.isAuthenticated) {
    router.replace({ name: 'dashboard' })
  } else {
    router.replace({ name: 'login' })
  }
})
</script>