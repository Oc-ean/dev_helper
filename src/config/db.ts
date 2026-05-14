import Dexie, { type Table } from 'dexie'
import type { Snippet, ApiRequest, DebugSession, GitHubRepo } from '@/types'

export class DevHelperDB extends Dexie {
  snippets!: Table<Snippet>
  apiRequests!: Table<ApiRequest>
  debugSessions!: Table<DebugSession>
  githubRepos!: Table<GitHubRepo>

  constructor() {
    super('DevHelperDB')
    this.version(1).stores({
      snippets: '++id, userId, title, language, tags, createdAt, updatedAt',
      apiRequests: '++id, userId, name, method, url, collectionId, createdAt',
      debugSessions: '++id, userId, title, category, createdAt',
      githubRepos: '++id, userId, fullName, starred, lastSynced',
    })
  }
}

export const localDB = new DevHelperDB()