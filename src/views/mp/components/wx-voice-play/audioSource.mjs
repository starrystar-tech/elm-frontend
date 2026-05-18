const NATIVE_AUDIO_EXTENSIONS = new Set([
  'mp3',
  'wav',
  'ogg',
  'm4a',
  'aac',
  'flac',
  'webm',
  'mp4'
])

export function resolveAudioPlaybackMode(url) {
  if (!url) return 'amr'
  try {
    const normalizedUrl = new URL(url, window.location.origin)
    const pathname = normalizedUrl.pathname || ''
    const extension = pathname.split('.').pop()?.toLowerCase()
    if (extension && NATIVE_AUDIO_EXTENSIONS.has(extension)) {
      return 'native'
    }
  } catch {
    const pathname = url.split('?')[0].split('#')[0]
    const extension = pathname.split('.').pop()?.toLowerCase()
    if (extension && NATIVE_AUDIO_EXTENSIONS.has(extension)) {
      return 'native'
    }
  }
  return 'amr'
}
