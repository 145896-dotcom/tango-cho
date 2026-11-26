type VoiceListener = () => void

export type SpeechStatus = 'unsupported' | 'unknown' | 'missing' | 'ready'

let cachedVoice: SpeechSynthesisVoice | null = null
let supported = false
let initialised = false
let pollTimer: number | null = null
let voiceCount = 0
let japaneseCount = 0
const listeners = new Set<VoiceListener>()

function readVoices(): SpeechSynthesisVoice[] {
  try {
    return window.speechSynthesis.getVoices()
  } catch {
    return []
  }
}

function japaneseVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices.filter((voice) => (voice.lang || '').toLowerCase().startsWith('ja'))
}

function chooseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const japanese = japaneseVoices(voices)
  if (!japanese.length) return null
  // Prefer a named Japanese voice; any ja entry is better than silence.
  return (
    japanese.find((voice) =>
      /kyoko|kyoto|nanami|otoya|haruka|ayumi|ichiro|takumi|google|microsoft/i.test(voice.name),
    ) ?? japanese[0]
  )
}

function refresh(): boolean {
  const voices = readVoices()
  voiceCount = voices.length
  japaneseCount = japaneseVoices(voices).length
  if (!voices.length) return false
  const next = chooseVoice(voices)
  const changed = next !== cachedVoice
  if (next) cachedVoice = next
  if (changed) listeners.forEach((listener) => listener())
  return !!next
}

/**
 * Voices often arrive after first paint (Chrome's remote voices do), and some
 * mobile browsers only expose them after an interaction or never fire
 * `voiceschanged`, so poll for a while and re-check on the first gesture.
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
    if (refresh() || attempts > 100) {
      if (pollTimer) window.clearInterval(pollTimer)
      pollTimer = null
    }
  }, 300)

  // iOS Safari populates the voice list lazily after the first interaction.
  const onGesture = () => {
    refresh()
    window.setTimeout(refresh, 250)
    window.setTimeout(refresh, 1000)
  }
  window.addEventListener('pointerdown', onGesture, { once: true, capture: true })
  window.addEventListener('keydown', onGesture, { once: true, capture: true })
}

export function subscribeSpeech(listener: VoiceListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export interface SpeechState {
  supported: boolean
  status: SpeechStatus
  /** kept for the simple "can I speak right now" check */
  ready: boolean
  voice: string | null
  voiceCount: number
  japaneseCount: number
}

export function speechState(): SpeechState {
  if (!cachedVoice) refresh()
  const voices = readVoices()
  voiceCount = voices.length
  japaneseCount = japaneseVoices(voices).length
  if (!cachedVoice) {
    const next = chooseVoice(voices)
    if (next) cachedVoice = next
  }
  const status: SpeechStatus = !supported
    ? 'unsupported'
    : cachedVoice
      ? 'ready'
      : voiceCount === 0
        ? 'unknown'
        : 'missing'
  return {
    supported,
    status,
    ready: status === 'ready',
    voice: cachedVoice?.name ?? null,
    voiceCount,
    japaneseCount,
  }
}

export function speechReady(): boolean {
  return speechState().ready
}

export function speechHint(state: SpeechState): string {
  switch (state.status) {
    case 'unsupported':
      return '这个浏览器不支持语音朗读，换 Chrome / Edge / Safari 打开试试。'
    case 'missing':
      return `设备上有 ${state.voiceCount} 个语音，但没有日语的。到系统设置里安装「日本語」语音包，刷新后再试。`
    case 'unknown':
      return '还没拿到语音列表。先在页面上点一下再试；仍然没声的话，去系统里装一个日语语音。'
    default:
      return ''
  }
}

export const NO_VOICE_HINT =
  '这台设备没有日语语音。到系统设置里安装「日本語」语音包（或换用带日语语音的浏览器），刷新后再试。'

export function speak(text: string): boolean {
  if (!supported || !text) return false
  const clean = text
    .replace(/[～~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean) return false

  const voices = readVoices()
  voiceCount = voices.length
  japaneseCount = japaneseVoices(voices).length
  const voice = chooseVoice(voices) ?? cachedVoice
  if (!voice && voices.length > 0) return false // the device really has no Japanese voice

  const synth = window.speechSynthesis
  synth.cancel()
  synth.resume()
  const utterance = new SpeechSynthesisUtterance(clean)
  if (voice) utterance.voice = voice
  utterance.lang = voice?.lang || 'ja-JP'
  utterance.rate = 0.92
  utterance.pitch = 1
  synth.speak(utterance)
  // The list can populate right after the first utterance (iOS).
  window.setTimeout(refresh, 400)
  return true
}
