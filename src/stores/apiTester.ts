import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios, { type AxiosRequestConfig } from 'axios'
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../config/firebase'
import { localDB } from '../config/db'
import { useAuthStore } from './auth'
import type { ApiRequest, ApiResponse, ApiCollection, HttpMethod, KeyValuePair } from '@/types'

function makeKV(): KeyValuePair {
  return { key: '', value: '', enabled: true }
}

export const useApiTesterStore = defineStore('apiTester', () => {
  const authStore = useAuthStore()

  // Active request state
  const method = ref<HttpMethod>('GET')
  const url = ref('')
  const headers = ref<KeyValuePair[]>([makeKV()])
  const params = ref<KeyValuePair[]>([makeKV()])
  const body = ref('')
  const bodyType = ref<ApiRequest['bodyType']>('none')
  const requestName = ref('')
  const selectedCollectionId = ref<string | undefined>()

  // Response state
  const response = ref<ApiResponse | null>(null)
  const sending = ref(false)
  const error = ref<string | null>(null)

  // Saved data
  const requests = ref<ApiRequest[]>([])
  const collections = ref<ApiCollection[]>([])

  const requestsByCollection = computed(() => {
    const map = new Map<string | undefined, ApiRequest[]>()
    requests.value.forEach((r) => {
      const key = r.collectionId
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    })
    return map
  })

  const activeHeaders = computed(() =>
    headers.value.filter((h) => h.enabled && h.key && h.value)
  )

  async function sendRequest() {
    if (!url.value.trim()) return
    sending.value = true
    error.value = null
    response.value = null

    const start = performance.now()

    try {
      const headersObj: Record<string, string> = {}
      activeHeaders.value.forEach((h) => (headersObj[h.key] = h.value))

      const paramsObj: Record<string, string> = {}
      params.value.filter((p) => p.enabled && p.key).forEach((p) => (paramsObj[p.key] = p.value))

      const config: AxiosRequestConfig = {
        method: method.value,
        url: url.value,
        headers: headersObj,
        params: paramsObj,
        validateStatus: () => true,
      }

      if (bodyType.value === 'json' && body.value) {
        config.data = JSON.parse(body.value)
        headersObj['Content-Type'] = 'application/json'
      } else if (bodyType.value === 'text' && body.value) {
        config.data = body.value
      }

      const res = await axios(config)
      const elapsed = Math.round(performance.now() - start)
      const dataStr = JSON.stringify(res.data)

      response.value = {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers as Record<string, string>,
        data: res.data,
        time: elapsed,
        size: new Blob([dataStr]).size,
      }
    } catch (e: unknown) {
      const elapsed = Math.round(performance.now() - start)
      response.value = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: null,
        time: elapsed,
        size: 0,
        error: e instanceof Error ? e.message : String(e),
      }
    } finally {
      sending.value = false
    }
  }

  async function saveRequest() {
    const uid = authStore.firebaseUser?.uid
    if (!uid) return

    const now = Date.now()
    const req: ApiRequest = {
      userId: uid,
      name: requestName.value || `${method.value} ${url.value}`,
      method: method.value,
      url: url.value,
      headers: headers.value,
      params: params.value,
      body: body.value,
      bodyType: bodyType.value,
      collectionId: selectedCollectionId.value,
      createdAt: now,
      synced: false,
    }

    const localId = await localDB.apiRequests.add(req)
    req.id = localId as number
    requests.value.unshift(req)

    try {
      const fbRef = await addDoc(collection(db, 'users', uid, 'api_requests'), req)
      await localDB.apiRequests.update(localId, { firebaseId: fbRef.id, synced: true })
    } catch (_) {}

    return req
  }

  function loadRequest(req: ApiRequest) {
    method.value = req.method
    url.value = req.url
    headers.value = req.headers.length ? req.headers : [makeKV()]
    params.value = req.params.length ? req.params : [makeKV()]
    body.value = req.body
    bodyType.value = req.bodyType
    requestName.value = req.name
    selectedCollectionId.value = req.collectionId
    response.value = null
  }

  async function deleteRequest(localId: number) {
    const req = requests.value.find((r) => r.id === localId)
    await localDB.apiRequests.delete(localId)
    requests.value = requests.value.filter((r) => r.id !== localId)

    const uid = authStore.firebaseUser?.uid
    if (uid && req?.firebaseId) {
      await deleteDoc(doc(db, 'users', uid, 'api_requests', req.firebaseId))
    }
  }

  async function loadFromCache() {
    const uid = authStore.firebaseUser?.uid
    if (!uid) return
    requests.value = await localDB.apiRequests.where('userId').equals(uid).toArray()
  }

  async function syncFromFirebase() {
    const uid = authStore.firebaseUser?.uid
    if (!uid) return

    const [reqSnap, colSnap] = await Promise.all([
      getDocs(query(collection(db, 'users', uid, 'api_requests'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'users', uid, 'api_collections'), orderBy('createdAt', 'desc'))),
    ])

    const remote = reqSnap.docs.map((d) => ({ ...d.data(), firebaseId: d.id } as ApiRequest))
    await localDB.apiRequests.clear()
    await localDB.apiRequests.bulkAdd(remote)
    requests.value = remote

    collections.value = colSnap.docs.map((d) => ({ ...d.data(), id: d.id } as ApiCollection))
  }

  function addHeader() { headers.value.push(makeKV()) }
  function removeHeader(i: number) { headers.value.splice(i, 1) }
  function addParam() { params.value.push(makeKV()) }
  function removeParam(i: number) { params.value.splice(i, 1) }
  function reset() {
    method.value = 'GET'
    url.value = ''
    headers.value = [makeKV()]
    params.value = [makeKV()]
    body.value = ''
    bodyType.value = 'none'
    requestName.value = ''
    response.value = null
    error.value = null
  }

  return {
    method, url, headers, params, body, bodyType, requestName, selectedCollectionId,
    response, sending, error,
    requests, collections, requestsByCollection, activeHeaders,
    sendRequest, saveRequest, loadRequest, deleteRequest,
    loadFromCache, syncFromFirebase,
    addHeader, removeHeader, addParam, removeParam, reset,
  }
})