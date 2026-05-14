<template>
  <div class="flex h-screen overflow-hidden bg-surface">
    <div
      v-if="uiStore.mobileSidebarOpen"
      class="fixed inset-0 bg-black/60 z-40 lg:hidden"
      @click="uiStore.toggleMobileSidebar()"
    />

    <AppSidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <AppHeader />
      <main class="flex-1 overflow-y-auto">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSnippetsStore } from '@/stores/snippets'
import { useApiTesterStore } from '@/stores/apiTester'
import { useDebugStore } from '@/stores/debug'
import { onMounted } from 'vue'

const uiStore = useUIStore()
const authStore = useAuthStore()
const snippetsStore = useSnippetsStore()
const apiStore = useApiTesterStore()
const debugStore = useDebugStore()

onMounted(async () => {
  await Promise.all([
    snippetsStore.loadFromCache(),
    apiStore.loadFromCache(),
    debugStore.loadFromCache(),
  ])

  if (!authStore.isAnonymous) {
    snippetsStore.syncFromFirebase()
    apiStore.syncFromFirebase()
    debugStore.syncFromFirebase()
  }
})
</script>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>