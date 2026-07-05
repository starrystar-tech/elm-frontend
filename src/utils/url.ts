const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const resolveBaseUrl = () => {
  const configuredBaseUrl = trimTrailingSlash(String(import.meta.env.VITE_BASE_URL || '').trim())
  return configuredBaseUrl || window.location.origin
}

export const resolveWebSocketUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = resolveBaseUrl()
  const wsBaseUrl = baseUrl.replace(/^https?:/i, (protocol) =>
    protocol.toLowerCase() === 'https:' ? 'wss:' : 'ws:'
  )
  return `${wsBaseUrl}${normalizedPath}`
}
