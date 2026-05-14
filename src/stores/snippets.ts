import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { localDB } from '../config/db'
import { useAuthStore } from './auth'
import type { Snippet, Language } from '@/types'

export const useSnippetsStore = defineStore('snippets', () => {
  const snippets = ref<Snippet[]>([])
  const loading = ref(false)
  const searchQuery = ref('')
  const filterLanguage = ref<Language | 'all'>('all')
  const filterTag = ref('')

  const authStore = useAuthStore()

  const filteredSnippets = computed(() => {
    return snippets.value.filter((s) => {
      const matchQuery =
        !searchQuery.value ||
        s.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(searchQuery.value.toLowerCase()))

      const matchLang = filterLanguage.value === 'all' || s.language === filterLanguage.value

      const matchTag = !filterTag.value || s.tags.includes(filterTag.value)

      return matchQuery && matchLang && matchTag
    })
  })

  const allTags = computed(() => {
    const tags = new Set<string>()
    snippets.value.forEach((s) => s.tags.forEach((t) => tags.add(t)))
    return Array.from(tags).sort()
  })

  async function loadFromCache() {
    const uid = authStore.firebaseUser?.uid
    if (!uid) return
    const cached = await localDB.snippets.where('userId').equals(uid).toArray()
    snippets.value = cached
  }

  async function syncFromFirebase() {
    const uid = authStore.firebaseUser?.uid
    if (!uid) return
    loading.value = true
    try {
      const q = query(
        collection(db, 'users', uid, 'snippets'),
        orderBy('updatedAt', 'desc')
      )
      const snap = await getDocs(q)
      const remote = snap.docs.map((d) => ({ ...d.data(), firebaseId: d.id } as Snippet))

      await localDB.snippets.clear()
      await localDB.snippets.bulkAdd(remote)

      snippets.value = remote
    } finally {
      loading.value = false
    }
  }

  async function createSnippet(data: Omit<Snippet, 'id' | 'firebaseId' | 'userId' | 'createdAt' | 'updatedAt' | 'synced'>) {
    const uid = authStore.firebaseUser?.uid
    if (!uid) return

    const now = Date.now()
    const snippet: Snippet = {
      ...data,
      userId: uid,
      createdAt: now,
      updatedAt: now,
      synced: false,
    }

    const localId = await localDB.snippets.add(snippet)
    snippet.id = localId as number
    snippets.value.unshift(snippet)

    try {
      const ref = await addDoc(collection(db, 'users', uid, 'snippets'), snippet)
      await localDB.snippets.update(localId, { firebaseId: ref.id, synced: true })
      snippet.firebaseId = ref.id
      snippet.synced = true
    } catch (e) {
      console.log('Failed to sync snippet to Firebase:', e)
      // queued for later sync
    }

    return snippet
  }

async function updateSnippet(localId: number, data: Partial<Snippet>) {
  const uid = authStore.firebaseUser?.uid
  if (!uid) return

  const updated = {
    ...data,
    updatedAt: Date.now(),
    synced: false,
  }

  await localDB.snippets.update(localId, updated)

  const idx = snippets.value.findIndex((s) => s.id === localId)
  if (idx === -1) return

  const existing = snippets.value[idx]
  if (!existing) return

  const merged = { ...existing, ...updated }

  snippets.value[idx] = merged

  if (merged.firebaseId) {
    try {
      await updateDoc(
        doc(db, 'users', uid, 'snippets', merged.firebaseId),
        {
          ...data,
          updatedAt: updated.updatedAt,
          synced: true,
        }
      )

      await localDB.snippets.update(localId, { synced: true })

      snippets.value[idx] = {
        ...snippets.value[idx],
        synced: true,
      }
    } catch (_) {}
  }
}

  async function deleteSnippet(localId: number) {
    const uid = authStore.firebaseUser?.uid
    const snippet = snippets.value.find((s) => s.id === localId)

    await localDB.snippets.delete(localId)
    snippets.value = snippets.value.filter((s) => s.id !== localId)

    if (uid && snippet?.firebaseId) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'snippets', snippet.firebaseId))
      } catch (_) {}
    }
  }

  return {
    snippets,
    filteredSnippets,
    allTags,
    loading,
    searchQuery,
    filterLanguage,
    filterTag,
    loadFromCache,
    syncFromFirebase,
    createSnippet,
    updateSnippet,
    deleteSnippet,
  }
})