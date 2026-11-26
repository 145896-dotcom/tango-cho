import type { DayStat, Persisted, Settings } from '../types'

const KEY = 'tango-cho:v1'
const VERSION = 1

export const DEFAULT_SETTINGS: Settings = {
  sessionSize: 20,
  direction: 'mix',
  autoSpeak: true,
  romaji: false,
  lastLesson: 1,
  customLessons: [1],
  customSections: [1, 2, 3, 4, 5, 6],
}

/** Fills in defaults, migrates the v1 'meaning' / 'kana' direction values. */
export function normaliseSettings(raw: Partial<Settings> | undefined): Settings {
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...(raw ?? {}),
    customLessons: [...(raw?.customLessons?.length ? raw.customLessons : DEFAULT_SETTINGS.customLessons)],
    customSections: [...(raw?.customSections?.length ? raw.customSections : DEFAULT_SETTINGS.customSections)],
  }
  const legacy = merged.direction as string
  if (legacy === 'meaning') merged.direction = 'w2m'
  else if (legacy === 'kana') merged.direction = 'w2k'
  return merged
}

export const storageAvailable: boolean = (() => {
  try {
    const probe = '__tango_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
})()

export function blankState(): Persisted {
  return {
    version: VERSION,
    cards: {},
    wrong: {},
    daily: {},
    totals: { answered: 0, correct: 0 },
    settings: normaliseSettings(undefined),
  }
}

export function loadState(): Persisted {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return blankState()
    const parsed = JSON.parse(raw) as Partial<Persisted>
    if (!parsed || parsed.version !== VERSION) return blankState()
    return {
      version: VERSION,
      cards: parsed.cards ?? {},
      wrong: parsed.wrong ?? {},
      daily: parsed.daily ?? {},
      totals: parsed.totals ?? { answered: 0, correct: 0 },
      settings: normaliseSettings(parsed.settings),
    }
  } catch {
    return blankState()
  }
}

export function saveState(state: Persisted): void {
  if (!storageAvailable) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* quota or private mode: keep running in memory */
  }
}

export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseStateFile(text: string): Persisted | null {
  try {
    const parsed = JSON.parse(text) as Partial<Persisted>
    if (!parsed || typeof parsed !== 'object') return null
    if (!parsed.cards || typeof parsed.cards !== 'object') return null
    return {
      version: VERSION,
      cards: parsed.cards,
      wrong: parsed.wrong ?? {},
      daily: parsed.daily ?? {},
      totals: parsed.totals ?? { answered: 0, correct: 0 },
      settings: normaliseSettings(parsed.settings),
    }
  } catch {
    return null
  }
}

export function exportState(state: Persisted): string {
  return JSON.stringify(
    {
      app: 'tango-cho',
      exportedAt: new Date().toISOString(),
      ...state,
    },
    null,
    2,
  )
}

export function recentDays(state: Persisted, count = 7): { key: string; label: string; stat: DayStat }[] {
  const out: { key: string; label: string; stat: DayStat }[] = []
  const labels = ['日', '一', '二', '三', '四', '五', '六']
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    out.push({ key, label: labels[d.getDay()], stat: state.daily[key] ?? { answered: 0, correct: 0 } })
  }
  return out
}

export function streakOf(state: Persisted): number {
  let streak = 0
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  // Today may still be untouched: start counting from yesterday then.
  if (!state.daily[dayKey(cursor)]?.answered) cursor.setDate(cursor.getDate() - 1)
  for (let i = 0; i < 3650; i++) {
    if (state.daily[dayKey(cursor)]?.answered) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else break
  }
  return streak
}
