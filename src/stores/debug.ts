import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../config/firebase'
import { localDB } from '../config/db'
import { useAuthStore } from './auth'
import type { DebugSession, DebugCategory, ChecklistItem } from '@/types'

const TEMPLATES: Record<DebugCategory, Omit<ChecklistItem, 'id'>[]> = {
  api: [
    { text: 'Verify endpoint URL is correct', completed: false },
    { text: 'Check authentication headers / tokens', completed: false },
    { text: 'Validate request body format (JSON keys)', completed: false },
    { text: 'Inspect response status code and body', completed: false },
    { text: 'Test with cURL or Postman to isolate client issues', completed: false },
    { text: 'Check CORS policy on the server', completed: false },
    { text: 'Look for rate limiting errors (429)', completed: false },
    { text: 'Confirm base URL and environment (staging vs prod)', completed: false },
  ],
  ui: [
    { text: 'Reproduce in multiple browsers', completed: false },
    { text: 'Check console for JS errors', completed: false },
    { text: 'Inspect element styles and overrides', completed: false },
    { text: 'Verify state management is updating correctly', completed: false },
    { text: 'Check component prop types and defaults', completed: false },
    { text: 'Test on mobile viewport sizes', completed: false },
    { text: 'Disable browser extensions that may interfere', completed: false },
    { text: 'Review recent CSS/component changes', completed: false },
  ],
  performance: [
    { text: 'Profile with DevTools Performance tab', completed: false },
    { text: 'Check for unnecessary re-renders', completed: false },
    { text: 'Audit network waterfall for blocking requests', completed: false },
    { text: 'Look for large bundle sizes (webpack-bundle-analyzer)', completed: false },
    { text: 'Verify image optimization and lazy loading', completed: false },
    { text: 'Check memory leaks in long-running components', completed: false },
    { text: 'Review database query indexes', completed: false },
    { text: 'Enable caching where appropriate', completed: false },
  ],
  firebase: [
    { text: 'Verify Firebase security rules', completed: false },
    { text: 'Check Firebase project configuration (API keys)', completed: false },
    { text: 'Review Firestore document structure', completed: false },
    { text: 'Check quota/billing limits in Firebase Console', completed: false },
    { text: 'Verify Auth providers are enabled', completed: false },
    { text: 'Inspect Firebase Emulator logs in dev', completed: false },
    { text: 'Confirm offline persistence settings', completed: false },
    { text: 'Review Cloud Functions logs for errors', completed: false },
  ],
  database: [
    { text: 'Check connection string and credentials', completed: false },
    { text: 'Verify table/collection schema matches query', completed: false },
    { text: 'Check for missing indexes on query fields', completed: false },
    { text: 'Inspect slow query logs', completed: false },
    { text: 'Validate data types match expected format', completed: false },
    { text: 'Check foreign key constraints', completed: false },
    { text: 'Review migration history', completed: false },
    { text: 'Confirm DB is accessible from the app environment', completed: false },
  ],
  auth: [
    { text: 'Verify JWT token is not expired', completed: false },
    { text: 'Check token signature and secret', completed: false },
    { text: 'Confirm user role/permissions are correct', completed: false },
    { text: 'Review auth middleware order', completed: false },
    { text: 'Check redirect URIs in OAuth config', completed: false },
    { text: 'Inspect CORS for auth endpoints', completed: false },
    { text: 'Test with a fresh incognito session', completed: false },
    { text: 'Review session/cookie settings', completed: false },
  ],
}

export const useDebugStore = defineStore('debug', () => {
  const authStore = useAuthStore()
  const sessions = ref<DebugSession[]>([])
  const activeSession = ref<DebugSession | null>(null)
  const loading = ref(false)

  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => b.createdAt - a.createdAt)
  )

  function createSessionTemplate(category: DebugCategory, title: string): DebugSession {
    const uid = authStore.firebaseUser?.uid ?? 'guest'
    const now = Date.now()
    const items: ChecklistItem[] = TEMPLATES[category].map((item, i) => ({
      ...item,
      id: `item-${i}`,
    }))

    return {
      userId: uid,
      title,
      category,
      items,
      progress: 0,
      resolved: false,
      createdAt: now,
      updatedAt: now,
      synced: false,
    }
  }

  async function startSession(category: DebugCategory, title: string) {
    const session = createSessionTemplate(category, title)
    const localId = await localDB.debugSessions.add(session)
    session.id = localId as number 
    sessions.value.push(session)
    activeSession.value = session

    const uid = authStore.firebaseUser?.uid
    if (uid) {
      try {
        const ref = await addDoc(collection(db, 'users', uid, 'debug_sessions'), session)
        await localDB.debugSessions.update(localId, { firebaseId: ref.id, synced: true })
        session.firebaseId = ref.id
        session.synced = true
      } catch (_) {}
    }

    return session
  }

  async function toggleItem(sessionId: number, itemId: string) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return

    const item = session.items.find((i) => i.id === itemId)
    if (!item) return

    item.completed = !item.completed
    session.progress = Math.round(
      (session.items.filter((i) => i.completed).length / session.items.length) * 100
    )
    session.updatedAt = Date.now()
    session.synced = false

    await localDB.debugSessions.update(sessionId, {
      items: session.items,
      progress: session.progress,
      updatedAt: session.updatedAt,
    })

    const uid = authStore.firebaseUser?.uid
    if (uid && session.firebaseId) {
      try {
        await updateDoc(doc(db, 'users', uid, 'debug_sessions', session.firebaseId), {
          items: session.items,
          progress: session.progress,
          updatedAt: session.updatedAt,
        })
        await localDB.debugSessions.update(sessionId, { synced: true })
        session.synced = true
      } catch (_) {}
    }
  }

  async function resolveSession(sessionId: number) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    session.resolved = true
    session.updatedAt = Date.now()

    await localDB.debugSessions.update(sessionId, { resolved: true, updatedAt: session.updatedAt })

    const uid = authStore.firebaseUser?.uid
    if (uid && session.firebaseId) {
      try {
        await updateDoc(doc(db, 'users', uid, 'debug_sessions', session.firebaseId), {
          resolved: true,
        })
      } catch (_) {}
    }
  }

  async function deleteSession(sessionId: number) {
    const session = sessions.value.find((s) => s.id === sessionId)
    await localDB.debugSessions.delete(sessionId)
    sessions.value = sessions.value.filter((s) => s.id !== sessionId)

    if (activeSession.value?.id === sessionId) activeSession.value = null

    const uid = authStore.firebaseUser?.uid
    if (uid && session?.firebaseId) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'debug_sessions', session.firebaseId))
      } catch (_) {}
    }
  }

  async function loadFromCache() {
    const uid = authStore.firebaseUser?.uid
    if (!uid) return
    sessions.value = await localDB.debugSessions.where('userId').equals(uid).toArray()
  }

  async function syncFromFirebase() {
    const uid = authStore.firebaseUser?.uid
    if (!uid) return
    loading.value = true
    try {
      const snap = await getDocs(
        query(collection(db, 'users', uid, 'debug_sessions'), orderBy('createdAt', 'desc'))
      )
      const remote = snap.docs.map((d) => ({ ...d.data(), firebaseId: d.id } as DebugSession))
      await localDB.debugSessions.clear()
      await localDB.debugSessions.bulkAdd(remote)
      sessions.value = remote
    } finally {
      loading.value = false
    }
  }

  return {
    sessions, sortedSessions, activeSession, loading,
    startSession, toggleItem, resolveSession, deleteSession,
    loadFromCache, syncFromFirebase,
  }
})