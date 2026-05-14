<template>
  <div class="flex h-full overflow-hidden">
    <div class="w-64 shrink-0 border-r border-white/[0.05] flex flex-col bg-surface-100/30 overflow-hidden hidden md:flex">
      <div class="p-3 border-b border-white/[0.05]">
        <input v-model="search" class="input text-xs py-1.5" placeholder="Search requests..." />
      </div>
      <div class="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-hide">
        <p class="section-title px-2 pt-2">Saved Requests</p>
        <div
          v-for="req in filteredRequests"
          :key="req.id"
          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer group hover:bg-white/[0.04] transition-colors"
          @click="apiStore.loadRequest(req)"
        >
          <span class="text-[10px] font-mono font-bold w-10 shrink-0" :class="`method-${req.method}`">
            {{ req.method }}
          </span>
          <span class="text-xs text-white/60 truncate flex-1">{{ req.name || req.url }}</span>
          <button
            class="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
            @click.stop="apiStore.deleteRequest(req.id!)"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" class="w-3 h-3"><path d="M2 2l12 12M14 2L2 14" stroke-linecap="round"/></svg>
          </button>
        </div>
        <p v-if="!filteredRequests.length" class="text-xs text-white/25 text-center py-6 px-2">
          No saved requests
        </p>
      </div>
    </div>

    <div class="flex-1 flex flex-col overflow-hidden">
      <div class="p-4 border-b border-white/[0.05] space-y-2">
        <div class="flex gap-2">
          <select v-model="apiStore.method" class="select w-28 text-xs font-mono font-semibold" :class="`method-${apiStore.method}`">
            <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
          </select>
          <input
            v-model="apiStore.url"
            class="input flex-1 font-mono text-xs"
            placeholder="https://api.example.com/endpoint"
            @keydown.enter="apiStore.sendRequest()"
          />
          <button class="btn-primary px-5 shrink-0" :disabled="apiStore.sending" @click="apiStore.sendRequest()">
            <span v-if="apiStore.sending" class="animate-spin">⏳</span>
            <span v-else>Send</span>
          </button>
        </div>
        <div class="flex gap-2">
          <input v-model="apiStore.requestName" class="input flex-1 text-xs" placeholder="Request name (optional)" />
          <button class="btn-secondary text-xs px-3" @click="saveRequest">Save</button>
          <button class="btn-ghost text-xs px-3" @click="apiStore.reset()">Clear</button>
        </div>
      </div>

      <div class="flex border-b border-white/[0.05] px-4 gap-1">
        <button
          v-for="tab in tabs"
          :key="tab"
          class="px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px"
          :class="activeTab === tab
            ? 'border-brand-500 text-brand-400'
            : 'border-transparent text-white/40 hover:text-white/70'"
          @click="activeTab = tab"
        >
          {{ tab }}
          <span v-if="tab === 'Headers' && activeHeaderCount" class="ml-1 badge-blue text-[10px]">{{ activeHeaderCount }}</span>
          <span v-if="tab === 'Params' && activeParamCount" class="ml-1 badge-blue text-[10px]">{{ activeParamCount }}</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="activeTab === 'Headers'" class="p-4 space-y-2">
          <div v-for="(h, i) in apiStore.headers" :key="i" class="flex gap-2 items-center">
            <input v-model="h.enabled" type="checkbox" class="shrink-0 accent-brand-500" />
            <input v-model="h.key" class="input flex-1 text-xs font-mono" placeholder="Header name" />
            <input v-model="h.value" class="input flex-1 text-xs font-mono" placeholder="Value" />
            <button class="btn-icon p-1.5" @click="apiStore.removeHeader(i)">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" class="w-3 h-3"><path d="M2 2l8 8M10 2L2 10" stroke-linecap="round"/></svg>
            </button>
          </div>
          <button class="btn-ghost text-xs gap-1.5" @click="apiStore.addHeader()">+ Add Header</button>
        </div>

        <div v-else-if="activeTab === 'Params'" class="p-4 space-y-2">
          <div v-for="(p, i) in apiStore.params" :key="i" class="flex gap-2 items-center">
            <input v-model="p.enabled" type="checkbox" class="shrink-0 accent-brand-500" />
            <input v-model="p.key" class="input flex-1 text-xs font-mono" placeholder="Parameter key" />
            <input v-model="p.value" class="input flex-1 text-xs font-mono" placeholder="Value" />
            <button class="btn-icon p-1.5" @click="apiStore.removeParam(i)">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" class="w-3 h-3"><path d="M2 2l8 8M10 2L2 10" stroke-linecap="round"/></svg>
            </button>
          </div>
          <button class="btn-ghost text-xs gap-1.5" @click="apiStore.addParam()">+ Add Param</button>
        </div>

        <div v-else-if="activeTab === 'Body'" class="p-4 space-y-3">
          <div class="flex gap-2">
            <button
              v-for="bt in bodyTypes"
              :key="bt"
              class="btn text-xs py-1 px-3"
              :class="apiStore.bodyType === bt ? 'btn-primary' : 'btn-ghost'"
              @click="apiStore.bodyType = bt as typeof apiStore.bodyType"
            >
              {{ bt }}
            </button>
          </div>
          <textarea
            v-if="apiStore.bodyType !== 'none'"
            v-model="apiStore.body"
            class="input font-mono text-xs resize-none h-48"
            :placeholder="placeholder"
          />
        </div>

        <div v-else-if="activeTab === 'Response'" class="p-4">
          <div v-if="apiStore.sending" class="flex items-center justify-center py-16 text-white/30">
            <div class="text-center">
              <div class="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p class="text-sm">Sending request...</p>
            </div>
          </div>

          <div v-else-if="apiStore.response">
            <div class="flex items-center gap-4 mb-4 p-3 rounded-lg" :class="statusBg">
              <span class="text-sm font-bold" :class="statusColor">{{ apiStore.response.status }}</span>
              <span class="text-sm text-white/60">{{ apiStore.response.statusText }}</span>
              <span class="ml-auto text-xs text-white/40">{{ apiStore.response.time }}ms</span>
              <span class="text-xs text-white/40">{{ formatSize(apiStore.response.size) }}</span>
            </div>

            <div v-if="apiStore.response.error" class="text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              {{ apiStore.response.error }}
            </div>

            <div v-if="apiStore.response.data !== null">
              <div class="flex items-center justify-between mb-2">
                <p class="section-title mb-0">Response Body</p>
                <button class="btn-ghost text-xs" @click="copyResponse">Copy JSON</button>
              </div>
              <pre class="code-block max-h-80 overflow-auto text-xs text-green-300/80">{{ prettyJson }}</pre>
            </div>

            <!-- Response headers -->
            <details class="mt-4">
              <summary class="section-title cursor-pointer hover:text-white/50 transition-colors">Response Headers</summary>
              <div class="mt-2 space-y-1">
                <div v-for="(v, k) in apiStore.response.headers" :key="k" class="flex gap-3 text-xs font-mono">
                  <span class="text-white/40 shrink-0 w-40 truncate">{{ k }}</span>
                  <span class="text-white/70 truncate">{{ v }}</span>
                </div>
              </div>
            </details>
          </div>

          <div v-else class="text-center py-16 text-white/25 text-sm">
            Hit "Send" to see the response here
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useApiTesterStore } from '@/stores/apiTester'
import { useUIStore } from '@/stores/ui'

const apiStore = useApiTesterStore()
const uiStore = useUIStore()

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const bodyTypes = ['none', 'json', 'form-data', 'text']
const tabs = ['Headers', 'Params', 'Body', 'Response']
const activeTab = ref('Headers')
const search = ref('')

watch(() => apiStore.response, (v) => { if (v) activeTab.value = 'Response' })

const filteredRequests = computed(() =>
  apiStore.requests.filter((r) =>
    !search.value || r.name.toLowerCase().includes(search.value.toLowerCase()) || r.url.includes(search.value)
  )
)

const placeholder = computed(() => {
  return apiStore.bodyType === 'json'
    ? `{
  "key": "value"
}`
    : 'Request body...'
})

const activeHeaderCount = computed(() => apiStore.headers.filter((h) => h.enabled && h.key).length)
const activeParamCount = computed(() => apiStore.params.filter((p) => p.enabled && p.key).length)

const prettyJson = computed(() => {
  try { return JSON.stringify(apiStore.response?.data, null, 2) } catch { return String(apiStore.response?.data) }
})

const statusColor = computed(() => {
  const s = apiStore.response?.status ?? 0
  if (s >= 200 && s < 300) return 'text-green-400'
  if (s >= 300 && s < 400) return 'text-yellow-400'
  if (s >= 400) return 'text-red-400'
  return 'text-white/50'
})

const statusBg = computed(() => {
  const s = apiStore.response?.status ?? 0
  if (s >= 200 && s < 300) return 'bg-green-500/10 border border-green-500/20'
  if (s >= 300 && s < 400) return 'bg-yellow-500/10 border border-yellow-500/20'
  if (s >= 400) return 'bg-red-500/10 border border-red-500/20'
  return 'bg-white/5'
})

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  return (bytes / 1024).toFixed(1) + ' KB'
}

async function copyResponse() {
  await navigator.clipboard.writeText(prettyJson.value)
  uiStore.toast('Copied to clipboard', 'success')
}

async function saveRequest() {
  if (!apiStore.url) { uiStore.toast('Enter a URL first', 'warning'); return }
  await apiStore.saveRequest()
  uiStore.toast('Request saved!', 'success')
}
</script>