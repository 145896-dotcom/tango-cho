type VoiceListener = () => void

let cachedVoice: SpeechSynthesisVoice | null = null
let supported = false
let initialised = false
let pollTimer: number | null = null
const listeners = new Set<VoiceListener>()

function readVoices(): SpeechSynthesisVoice[] {
  try {
    return window.speechSynthesis.getVoices()
  } catch {
    return []
  }
}

function chooseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const japanese = voices.filter((voice) => (voice.lang || '').toLowerCase().startsWith('ja'))
  if (!japanese.length) return null
  // Prefer a named Japanese voice; any ja-JP entry is better than silence.
  return (
    japanese.find((voice) =>
      /kyoko|kyoto|nanami|otoya|haruka|ayumi|ichiro|takumi|google|microsoft/i.test(voice.name),
    ) ?? japanese[0]
  )
}

function refresh(): boolean {
  const voices = readVoices()
  if (!voices.length) return false
  const next = chooseVoice(voices)
  const changed = next !== cachedVoice
  if (next) cachedVoice = next
  if (changed) listeners.forEach((listener) => listener())
  return !!next
}

/**
 * Voices often arrive after first paint (Chrome's remote voices do), and some
 * mobile browsers never fire `voiceschanged`, so poll briefly as well.
 */
export function initSpeech(): void {
  if (initialised || typeof window === 'undefined') return
  initialised = true
  supported = 'speechSynthesis' in window
  if (!supported) return

  refresh()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    refresh()
  })

  let attempts = 0
  pollTimer = window.setInterval(() => {
    attempts += 1
    if (refresh() || attempts > 20) {
      if (pollTimer) window.clearInterval(pollTimer)
      pollTimer = null
    }
  }, 300)
}

export function subscribeSpeech(listener: VoiceListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export interface SpeechState {
  supported: boolean
  ready: boolean
  voice: string | null
}

export function speechState(): SpeechState {
  if (!cachedVoice) refresh()
  return {
    supported,
    ready: !!cachedVoice,
    voice: cachedVoice?.name ?? null,
  }
}

export function speechReady(): boolean {
  return speechState().ready
}

export function speak(text: string): boolean {
  if (!supported || !text) return false
  if (!cachedVoice) refresh()
  if (!cachedVoice) return false
  const clean = text
    .replace(/[～~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean) return false
  const synth = window.speechSynthesis
  synth.cancel()
  synth.resume()
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.voice = cachedVoice
  utterance.lang = cachedVoice.lang || 'ja-JP'
  utterance.rate = 0.92
  utterance.pitch = 1
  synth.speak(utterance)
  return true
}

export const NO_VOICE_HINT =
  '这台设备没有日语语音。到系统设置里安装「日本語」语音包（或换用带日语语音的浏览器），刷新后再试。'
