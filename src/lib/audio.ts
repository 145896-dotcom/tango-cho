/**
 * Optional pre-rendered pronunciation clips (docs/audio/<word-id>.mp3).
 * They make the app speak on devices with no Japanese system voice; when the
 * clips are unreachable (offline, file://, or a missing file) callers fall
 * back to speech synthesis.
 */
const cache = new Map<string, HTMLAudioElement>()
const failed = new Set<string>()
let available: boolean | null = null
let probe: Promise<boolean> | null = null

function baseUrl(): string {
  return new URL('audio/', window.location.href).href
}

export function probeAudio(): Promise<boolean> {
  if (probe) return probe
  probe = (async () => {
    try {
      const response = await fetch(new URL('probe.json', baseUrl()), { cache: 'no-cache' })
      if (!response.ok) {
        available = false
        return false
      }
      const data = (await response.json()) as { ok?: boolean }
      available = data?.ok === true
    } catch {
      available = false
    }
    return available === true
  })()
  return probe
}

export function audioReady(): boolean {
  return available === true
}

export function clipAvailable(wordId: string): boolean {
  return available === true && !failed.has(wordId)
}

function elementFor(wordId: string): HTMLAudioElement {
  let element = cache.get(wordId)
  if (!element) {
    element = new Audio(new URL(`${wordId}.mp3`, baseUrl()).href)
    element.preload = 'auto'
    cache.set(wordId, element)
  }
  return element
}

export function preloadClip(wordId: string): void {
  if (!clipAvailable(wordId)) return
  try {
    elementFor(wordId).load()
  } catch {
    /* the play() failure path handles it */
  }
}

export function playClip(wordId: string): boolean {
  if (!clipAvailable(wordId)) return false
  const element = elementFor(wordId)
  try {
    element.currentTime = 0
  } catch {
    /* not loaded yet */
  }
  const promise = element.play()
  if (promise && typeof promise.catch === 'function') {
    promise.catch(() => {
      failed.add(wordId)
    })
  }
  return true
}
