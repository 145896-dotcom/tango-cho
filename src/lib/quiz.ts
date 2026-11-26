import { WORDS } from '../data/catalog'
import type {
  AnswerKind,
  Cue,
  Direction,
  DirectionPref,
  OptionItem,
  Question,
  StoredCard,
  Word,
} from '../types'

export function shuffle<T>(items: T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const DIRECTION_META: Record<
  Direction,
  { cue: Cue; answerKind: AnswerKind; label: string; short: string }
> = {
  w2m: { cue: 'word', answerKind: 'meaning', label: '看词选义', short: '看词选义' },
  w2k: { cue: 'word', answerKind: 'kana', label: '看词选假名', short: '看词选假名' },
  m2k: { cue: 'meaning', answerKind: 'kana', label: '看义选假名', short: '看义选假名' },
  k2m: { cue: 'kana', answerKind: 'meaning', label: '看假名选义', short: '看假名选义' },
}

export const DIRECTION_ORDER: Direction[] = ['w2m', 'w2k', 'm2k', 'k2m']

export function hasReading(word: Word): boolean {
  return word.kana !== word.surface
}

/** Directions that make sense for a word: kana-only words can only be asked w2m. */
export function availableDirections(word: Word): Direction[] {
  if (!hasReading(word)) return ['w2m']
  return DIRECTION_ORDER
}

export function answerText(word: Word, kind: AnswerKind): string {
  return kind === 'kana' ? word.kana : word.meaning
}

export function cueText(word: Word, cue: Cue): string {
  if (cue === 'kana') return word.kana
  if (cue === 'meaning') return word.meaning
  return word.surface
}

export function pickDirection(word: Word, pref: DirectionPref): Direction {
  const available = availableDirections(word)
  if (pref === 'mix') return available[Math.floor(Math.random() * available.length)]
  return available.includes(pref) ? pref : 'w2m'
}

export interface QueueOptions {
  pool: Word[]
  cards: Record<string, StoredCard>
  size: number
  /** only words already scheduled and due */
  onlyDue?: boolean
  /** only words never seen */
  onlyNew?: boolean
  now?: number
}

/**
 * Due reviews come first (most overdue first), then new words in textbook
 * order, so a session always repays what is about to be forgotten.
 */
export function buildQueue({
  pool,
  cards,
  size,
  onlyDue = false,
  onlyNew = false,
  now = Date.now(),
}: QueueOptions): Word[] {
  const due: Word[] = []
  const fresh: Word[] = []
  for (const word of pool) {
    const card = cards[word.id]
    if (!card) {
      if (!onlyDue) fresh.push(word)
    } else if (onlyNew) {
      continue
    } else if (card.due <= now) {
      due.push(word)
    }
  }
  due.sort((a, b) => (cards[a.id]?.due ?? 0) - (cards[b.id]?.due ?? 0))
  const limit = size > 0 ? size : due.length + fresh.length
  return [...due, ...fresh].slice(0, limit)
}

function buildOptions(target: Word, pool: Word[], kind: AnswerKind): OptionItem[] {
  const correct = answerText(target, kind)
  const usedText = new Set<string>([correct])
  const usedSurface = new Set<string>([target.surface])
  const picks: Word[] = []

  const accept = (word: Word): boolean => {
    if (word.id === target.id || picks.length >= 3) return false
    const text = answerText(word, kind)
    if (!text || usedText.has(text) || usedSurface.has(word.surface)) return false
    usedText.add(text)
    usedSurface.add(word.surface)
    picks.push(word)
    return true
  }

  // Same part of speech keeps one distractor honest; the rest come from
  // anywhere so the choice never collapses into a grammar hint. Kana options
  // are also nudged towards a similar length, which is what makes a kana
  // question actually hard.
  const samePos = shuffle(pool.filter((w) => w.posZh === target.posZh))
  const others = shuffle(pool.filter((w) => w.posZh !== target.posZh))
  if (kind === 'kana') {
    const byLength = (w: Word) => Math.abs(w.kana.length - target.kana.length) + Math.random() * 3
    samePos.sort(byLength)
    others.sort(byLength)
  }
  const samePosPick = samePos.find((w) => w.id !== target.id)
  if (samePosPick) accept(samePosPick)
  for (const word of others) {
    if (picks.length >= 3) break
    accept(word)
  }
  for (const word of shuffle(pool)) {
    if (picks.length >= 3) break
    accept(word)
  }
  for (const word of shuffle(WORDS)) {
    if (picks.length >= 3) break
    accept(word)
  }

  const options: OptionItem[] = shuffle([
    { wordId: target.id, text: correct, pos: target.posZh },
    ...picks.map((w) => ({ wordId: w.id, text: answerText(w, kind), pos: w.posZh })),
  ])
  return options
}

export function makeQuestion(target: Word, pool: Word[], pref: DirectionPref): Question {
  const direction = pickDirection(target, pref)
  const { cue, answerKind } = DIRECTION_META[direction]
  const options = buildOptions(target, pool, answerKind)
  const answer = options.findIndex((option) => option.wordId === target.id)
  return {
    key: `${target.id}:${direction}`,
    word: target,
    direction,
    cue,
    answerKind,
    options,
    answer,
  }
}
