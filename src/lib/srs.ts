import { createEmptyCard, fsrs, Rating, State, type Card } from 'ts-fsrs'
import type { StoredCard } from '../types'

const GRADES = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
} as const

export type GradeKey = keyof typeof GRADES

// FSRS-6 defaults; short-term steps are on so a wrong answer comes back in
// the same session instead of tomorrow.
const scheduler = fsrs({
  request_retention: 0.9,
  enable_fuzz: true,
  enable_short_term: true,
})

function hydrate(card: StoredCard): Card {
  return {
    ...card,
    state: card.state as Card['state'],
    due: new Date(card.due),
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  }
}

function serialise(card: Card): StoredCard {
  return {
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    last_review: card.last_review ? card.last_review.getTime() : undefined,
  }
}

export function rateCard(
  stored: StoredCard | undefined,
  grade: GradeKey,
  now = new Date(),
): StoredCard {
  const card = stored ? hydrate(stored) : createEmptyCard(now)
  const result = scheduler.next(card, now, GRADES[grade])
  return serialise(result.card)
}

export function isDue(card: StoredCard | undefined, now = Date.now()): boolean {
  return !!card && card.due <= now
}

export const MASTERY = {
  new: 0,
  learning: 1,
  reviewing: 2,
  solid: 3,
} as const

/** 0 未学 · 1 学习中 · 2 复习中 · 3 熟练 */
export function masteryOf(card: StoredCard | undefined): number {
  if (!card) return 0
  if (card.state === State.Review) return card.stability >= 21 ? 3 : 2
  return 1
}

export function isReviewState(card: StoredCard): boolean {
  return card.state === State.Review
}
