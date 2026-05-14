import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
    signInWithPopup,
    signInAnonymously,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import type { User, Workspace, Theme } from '@/types'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const firebaseUser = ref<FirebaseUser | null>(null)
    const initialized = ref(false)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const isAuthenticated = computed(() => !!firebaseUser.value)
    const isAnonymous = computed(() => firebaseUser.value?.isAnonymous ?? false)

    let resolveInit: (() => void) | null = null
    const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve
    })

    function waitForInit() {
        return initPromise
    }

    async function fetchOrCreateUser(fbUser: FirebaseUser): Promise<User> {
        const ref = doc(db, 'users', fbUser.uid)
        const snap = await getDoc(ref)

        if (snap.exists()) {
            return snap.data() as User
        }

        const newUser: User = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            isAnonymous: fbUser.isAnonymous,
            workspaces: [],
            theme: 'dark',
            createdAt: Date.now(),
        }

        await setDoc(ref, newUser)
        return newUser
    }

    onAuthStateChanged(auth, async (fbUser) => {
        firebaseUser.value = fbUser

        if (fbUser) {
            user.value = await fetchOrCreateUser(fbUser)

    applyTheme(user.value.theme)

        } else {
            user.value = null
        }

        initialized.value = true
        resolveInit?.()
    })

    function applyTheme(theme: Theme) {
  const root = document.documentElement

  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
}

    async function loginWithGoogle() {
        loading.value = true
        error.value = null
        try {
            const provider = new GoogleAuthProvider()
            await signInWithPopup(auth, provider)
        } catch (e: unknown) {
            error.value = e instanceof Error ? e.message : 'Login failed'
        } finally {
            loading.value = false
        }
    }

    async function loginAsGuest() {
        loading.value = true
        error.value = null
        try {
            await signInAnonymously(auth)
        } catch (e: unknown) {
            error.value = e instanceof Error ? e.message : 'Login failed'
        } finally {
            loading.value = false
        }
    }

    async function logout() {
        await signOut(auth)
    }

    async function updateWorkspaces(workspaces: Workspace[]) {
        if (!firebaseUser.value || !user.value) return
        const ref = doc(db, 'users', firebaseUser.value.uid)
        await setDoc(ref, { workspaces }, { merge: true })
        user.value.workspaces = workspaces
    }

async function updateTheme(theme: Theme) {
  if (!firebaseUser.value || !user.value) return

  const ref = doc(db, 'users', firebaseUser.value.uid)
  await setDoc(ref, { theme }, { merge: true })

  user.value.theme = theme

  applyTheme(theme)
}


watch(() => user.value?.theme, (theme) => {
  if (!theme) return

  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
}, { immediate: true })

    return {
        user,
        firebaseUser,
        initialized,
        loading,
        error,
        isAuthenticated,
        isAnonymous,
        waitForInit,
        loginWithGoogle,
        loginAsGuest,
        logout,
        updateWorkspaces,
        updateTheme,
    }
})