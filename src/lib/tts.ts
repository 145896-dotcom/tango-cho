let cachedVoice: SpeechSynthesisVoice | null = null
let voicesBound = false

function pickVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const japanese = voices.filter((v) => v.lang.toLowerCase().startsWith('ja'))
  const preferred =
    japanese.find((v) => /kyoto|nanami|otoya|haruka|ayumi|ichiro|takumi|google/i.test(v.name)) ??
    japanese[0] ??
    null
  cachedVoice = preferred
  return preferred
}

export function initSpeech(): void {
  if (voicesBound || !('speechSynthesis' in window)) return
  voicesBound = true
  pickVoice()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    pickVoice()
  })
}

export function speechReady(): boolean {
  if (!('speechSynthesis' in window)) return false
  if (!cachedVoice) pickVoice()
  return !!cachedVoice
}

export function speak(text: string): boolean {
  if (!('speechSynthesis' in window) || !text) return false
  const voice = cachedVoice ?? pickVoice()
  if (!voice) return false
  const clean = text.replace(/[～~]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.voice = voice
  utterance.lang = voice.lang || 'ja-JP'
  utterance.rate = 0.92
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
  return true
}
