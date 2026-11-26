import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { WORDS } from './data/catalog'
import { masteryOf, rateCard, type GradeKey } from './lib/srs'
import {
  blankState,
  dayKey,
  exportState,
  loadState,
  parseStateFile,
  saveState,
  storageAvailable,
  streakOf,
} from './lib/storage'
import { initSpeech } from './lib/tts'
import type { DayStat, Persisted, Settings, StoredCard } from './types'

export interface LessonProgress {
  total: number
  studied: number
  mastered: number
  due: number
}

interface Derived {
  studied: number
  mastered: number
  learning: number
  due: number
  accuracy: number
  streak: number
  today: DayStat
  mistakes: number
  byLesson: Map<number, LessonProgress>
}

interface StoreValue {
  state: Persisted
  derived: Derived
  cardOf: (id: string) => StoredCard | undefined
  reviewWord: (id: string, grade: GradeKey) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetProgress: () => void
  /** Clears card + wrong tracking for a lesson/section slice, returns cards cleared. */
  resetRange: (filter: { lessons?: number[]; sections?: number[] }) => number
  loadExternal: (next: Persisted) => void
  importFromText: (text: string) => boolean
  exportText: () => string
  storageAvailable: boolean
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => loadState())

  useEffect(() => {
    initSpeech()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => saveState(state), 200)
    return () => window.clearTimeout(timer)
  }, [state])

  const reviewWord = useCallback((id: string, grade: GradeKey) => {
    setState((prev) => {
      const card = rateCard(prev.cards[id], grade)
      const key = dayKey(new Date())
      const today = prev.daily[key] ?? { answered: 0, correct: 0 }
      const good = grade !== 'again'
      const wrong = { ...prev.wrong }
      const outstanding = (wrong[id] ?? 0) + (good ? -1 : 1)
      if (outstanding > 0) wrong[id] = outstanding
      else delete wrong[id]
      return {
        ...prev,
        cards: { ...prev.cards, [id]: card },
        wrong,
        daily: {
          ...prev.daily,
          [key]: { answered: today.answered + 1, correct: today.correct + (good ? 1 : 0) },
        },
        totals: {
          answered: prev.totals.answered + 1,
          correct: prev.totals.correct + (good ? 1 : 0),
        },
      }
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  const resetProgress = useCallback(() => {
    setState((prev) => ({ ...blankState(), settings: prev.settings }))
  }, [])

  const resetRange = useCallback(
    (filter: { lessons?: number[]; sections?: number[] }) => {
      const cards = { ...state.cards }
      const wrong = { ...state.wrong }
      let cleared = 0
      for (const word of WORDS) {
        if (filter.lessons && !filter.lessons.includes(word.lesson)) continue
        if (filter.sections && !filter.sections.includes(word.section)) continue
        if (cards[word.id]) {
          delete cards[word.id]
          cleared++
        }
        delete wrong[word.id]
      }
      setState((prev) => ({ ...prev, cards, wrong }))
      return cleared
    },
    [state.cards, state.wrong],
  )

  const loadExternal = useCallback((next: Persisted) => {
    setState(next)
  }, [])

  const importFromText = useCallback((text: string) => {
    const parsed = parseStateFile(text)
    if (!parsed) return false
    setState(parsed)
    return true
  }, [])

  const exportText = useCallback(() => exportState(state), [state])

  const derived = useMemo<Derived>(() => {
    const now = Date.now()
    let studied = 0
    let mastered = 0
    let learning = 0
    let due = 0
    const byLesson = new Map<number, LessonProgress>()
    for (const word of WORDS) {
      const card = state.cards[word.id]
      const level = masteryOf(card)
      const entry =
        byLesson.get(word.lesson) ??
        ({ total: 0, studied: 0, mastered: 0, due: 0 } satisfies LessonProgress)
      entry.total++
      if (level > 0) {
        studied++
        entry.studied++
        if (level === 3) {
          mastered++
          entry.mastered++
        } else {
          learning++
        }
        if (card && card.due <= now) {
          due++
          entry.due++
        }
      }
      byLesson.set(word.lesson, entry)
    }
    const streak = streakOf(state)
    const today = state.daily[dayKey(new Date())] ?? { answered: 0, correct: 0 }
    return {
      studied,
      mastered,
      learning,
      due,
      accuracy: state.totals.answered ? state.totals.correct / state.totals.answered : 0,
      streak,
      today,
      mistakes: Object.keys(state.wrong).length,
      byLesson,
    }
  }, [state])

  const value = useMemo<StoreValue>(
    () => ({
      state,
      derived,
      cardOf: (id: string) => state.cards[id],
      reviewWord,
      updateSettings,
      resetProgress,
      resetRange,
      loadExternal,
      importFromText,
      exportText,
      storageAvailable,
    }),
    [
      state,
      derived,
      reviewWord,
      updateSettings,
      resetProgress,
      resetRange,
      loadExternal,
      importFromText,
      exportText,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
