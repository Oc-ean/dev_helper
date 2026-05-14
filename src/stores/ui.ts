import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Toast } from '@/types'

export const useUIStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const sidebarCollapsed = ref(false)
  const mobileSidebarOpen = ref(false)

  function addToast(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).slice(2)
    toasts.value.push({ ...toast, id })
    setTimeout(() => removeToast(id), toast.duration ?? 4000)
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function toast(message: string, type: Toast['type'] = 'info') {
    addToast({ message, type })
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleMobileSidebar() {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  return {
    toasts, sidebarCollapsed, mobileSidebarOpen,
    addToast, removeToast, toast,
    toggleSidebar, toggleMobileSidebar,
  }
})