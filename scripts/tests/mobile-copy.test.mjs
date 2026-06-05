import assert from 'node:assert/strict'
import { copyMobileByClueId, resolveClueIdForCopy } from '../../src/views/crm/clue/mobileCopyCore.mjs'

const requestCalls = []
const copiedTexts = []
const successMessages = []
const warningMessages = []

const copyApi = async (clueId) => {
  requestCalls.push(clueId)
  return { mobile: `1380000${clueId}`, usedCount: 1, remainingCount: 6 }
}

await copyMobileByClueId({
  clueId: 12,
  copyApi,
  writeClipboard: async (text) => copiedTexts.push(text),
  onSuccess: (message) => successMessages.push(message)
})

assert.deepEqual(requestCalls, [12])
assert.deepEqual(copiedTexts, ['138000012'])
assert.equal(successMessages[0], '复制成功')

const detailCalls = []
const directClueId = await resolveClueIdForCopy({
  row: { clueId: 21 },
  getDetail: async () => {
    detailCalls.push('should-not-run')
    return { clueId: 99 }
  }
})
assert.equal(directClueId, 21)
assert.deepEqual(detailCalls, [])

const fallbackClueId = await resolveClueIdForCopy({
  row: { id: 7 },
  getDetail: async (id) => {
    detailCalls.push(id)
    return { clueId: 35 }
  }
})
assert.equal(fallbackClueId, 35)
assert.deepEqual(detailCalls, [7])

const missingClueId = await resolveClueIdForCopy({
  row: { id: 8 },
  getDetail: async () => ({})
})
assert.equal(missingClueId, undefined)

await copyMobileByClueId({
  clueId: undefined,
  copyApi,
  writeClipboard: async () => copiedTexts.push('unexpected'),
  onWarning: (message) => warningMessages.push(message)
})

assert.deepEqual(warningMessages, ['未找到线索，无法复制手机号'])
assert.deepEqual(copiedTexts, ['138000012'])

console.log('mobile-copy assertions passed')
