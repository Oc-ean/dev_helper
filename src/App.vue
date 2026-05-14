<template>
  <SplashView v-if="loading" />
  
  <template v-else>
    <RouterView />
    <ToastContainer />
  </template>
</template>


<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/ToastContainer.vue'
import SplashView from '@/views/SplashView.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(true)

onMounted(async() => {
  const theme = localStorage.getItem('theme') ?? 'dark'
  document.documentElement.classList.toggle('dark', theme !== 'light')

    await authStore.waitForInit()

  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>