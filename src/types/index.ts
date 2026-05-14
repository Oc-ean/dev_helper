export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type Language = 'dart' | 'typescript' | 'javascript' | 'python' | 'php' | 'rust' | 'go' | 'java' | 'kotlin' | 'swift' | 'css' | 'html' | 'sql' | 'bash' | 'other'

export type DebugCategory = 'api' | 'ui' | 'performance' | 'firebase' | 'database' | 'auth'

export type Theme = 'dark' | 'light' | 'system'

export type Workspace = 'flutter' | 'web' | 'backend' | 'devops'


export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isAnonymous: boolean
  workspaces: Workspace[]
  githubUsername?: string
  theme: Theme
  createdAt: number
}


export interface Snippet {
  id?: number
  firebaseId?: string
  userId: string
  title: string
  language: Language
  code: string
  tags: string[]
  description?: string
  createdAt: number
  updatedAt: number
  synced: boolean
}


export interface KeyValuePair {
  key: string
  value: string
  enabled: boolean
}

export interface ApiRequest {
  id?: number
  firebaseId?: string
  userId: string
  name: string
  method: HttpMethod
  url: string
  headers: KeyValuePair[]
  params: KeyValuePair[]
  body: string
  bodyType: 'none' | 'json' | 'form-data' | 'text'
  collectionId?: string
  createdAt: number
  synced: boolean
}

export interface ApiCollection {
  id: string
  userId: string
  name: string
  description?: string
  color: string
  requestIds: string[]
  createdAt: number
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: unknown
  time: number
  size: number
  error?: string
}

export interface GitHubRepo {
  id?: number
  githubId: number
  userId: string
  fullName: string
  name: string
  description: string | null
  stars: number
  forks: number
  language: string | null
  topics: string[]
  isPrivate: boolean
  defaultBranch: string
  openIssuesCount: number
  url: string
  homepage: string | null
  pushedAt: string
  createdAt: string
  starred: boolean
  lastSynced: number
}


export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  note?: string
}

export interface DebugSession {
  id?: number
  firebaseId?: string
  userId: string
  title: string
  category: DebugCategory
  items: ChecklistItem[]
  progress: number
  resolved: boolean
  createdAt: number
  updatedAt: number
  synced: boolean
}


export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export interface NavItem {
  label: string
  icon: string
  to: string
  badge?: number
}