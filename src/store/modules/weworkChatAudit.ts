import { defineStore } from 'pinia'

export interface WeworkChatAuditStateCache {
  activeTab: 'employee' | 'content'
  selectedCorpId: string
  employeeFilters: Recordable
  contentFilters: Recordable
}

export interface WeworkChatAuditState {
  cache: WeworkChatAuditStateCache | null
}

export const useWeworkChatAuditStore = defineStore('weworkChatAudit', {
  state: (): WeworkChatAuditState => ({
    cache: null
  }),
  getters: {
    getCache(): WeworkChatAuditStateCache | null {
      return this.cache
    }
  },
  actions: {
    setCache(cache: WeworkChatAuditStateCache) {
      this.cache = cache
    },
    clearCache() {
      this.cache = null
    }
  },
  persist: false
})
