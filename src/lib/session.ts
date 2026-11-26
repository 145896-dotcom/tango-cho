import { WORDS, WORDS_BY_LESSON } from '../data/catalog'
import type { DirectionPref, Question, StoredCard, Word } from '../types'
import { buildQueue, makeQuestion, shuffle } from './quiz'

export type Scope = 'lesson' | 'today' | 'mistakes' | 'all' | 'custom'

export interface SessionInput {
  scope: Scope
  lesson: number
  lessons?: number[]
  sections?: number[]
  cards: Record<string, StoredCard>
  wrong: Record<string, number>
  size: number
  direction: DirectionPref
  force?: boolean
}

export interface SessionResult {
  questions: Question[]
  reason: 'ok' | 'no-due' | 'no-mistakes' | 'finished' | 'empty'
  poolSize: number
}

export function scopeOf(lesson: number, raw: string | null): Scope {
  if (raw === 'today' || raw === 'mistakes' || raw === 'all' || raw === 'custom') return raw
  return lesson > 0 ? 'lesson' : 'all'
}

/** "1,3,5" -> [1,3,5], dropping anything outside 1..max. */
export function parseList(raw: string | null, max: number): number[] {
  if (!raw) return []
  const out = new Set<number>()
  for (const piece of raw.split(',')) {
    const value = Number(piece)
    if (Number.isInteger(value) && value >= 1 && value <= max) out.add(value)
  }
  return [...out].sort((a, b) => a - b)
}

export function poolFor(input: Pick<SessionInput, 'scope' | 'lesson' | 'lessons' | 'sections'>): Word[] {
  if (input.scope === 'lesson') return WORDS_BY_LESSON.get(input.lesson) ?? []
  if (input.scope === 'custom') {
    const lessons = new Set(input.lessons ?? [])
    const sections = new Set(input.sections ?? [])
    if (!lessons.size || !sections.size) return []
    return WORDS.filter((word) => lessons.has(word.lesson) && sections.has(word.section))
  }
  return WORDS
}

/**
 * Builds one practice session. Due cards are repaid first, then unseen words
 * follow in textbook order.
 */
export function buildSession(input: SessionInput): SessionResult {
  const { scope, cards, wrong, size, direction, force } = input
  const pool = poolFor(input)
  let words: Word[] = []

  if (!pool.length) return { questions: [], reason: 'empty', poolSize: 0 }

  if (scope === 'mistakes') {
    const mistaken = pool
      .filter((w) => (wrong[w.id] ?? 0) > 0)
      .sort((a, b) => (wrong[b.id] ?? 0) - (wrong[a.id] ?? 0))
    if (!mistaken.length) return { questions: [], reason: 'no-mistakes', poolSize: pool.length }
    words = size > 0 ? mistaken.slice(0, size) : mistaken
  } else if (scope === 'today') {
    words = buildQueue({ pool, cards, size, onlyDue: true })
    if (!words.length) return { questions: [], reason: 'no-due', poolSize: pool.length }
  } else {
    words = buildQueue({ pool, cards, size })
    if (!words.length) {
      if (!force) return { questions: [], reason: 'finished', poolSize: pool.length }
      words = shuffle(pool).slice(0, size > 0 ? size : pool.length)
    }
  }

  // A tiny pool would repeat itself, so options may be drawn from the whole book.
  const optionPool = pool.length >= 8 ? pool : WORDS
  return {
    questions: words.map((word) => makeQuestion(word, optionPool, direction)),
    reason: 'ok',
    poolSize: pool.length,
  }
}
