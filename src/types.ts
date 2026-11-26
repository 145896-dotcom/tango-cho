export interface Word {
  id: string
  no: number
  lesson: number
  section: number
  surface: string
  kana: string
  meaning: string
  pos: string
  posZh: string
}

export interface LessonMeta {
  lesson: number
  title: string
  topic: string
  unit: number
  count: number
}

export interface UnitMeta {
  unit: number
  label: string
  range: string
  lessons: number[]
}

/** What the question shows. */
export type Cue = 'word' | 'kana' | 'meaning'

/** What the learner has to pick. */
export type AnswerKind = 'kana' | 'meaning'

/**
 * w2m 看词选义 · w2k 看词选假名 · m2k 看义选假名 · k2m 看假名选义
 */
export type Direction = 'w2m' | 'w2k' | 'm2k' | 'k2m'

export type DirectionPref = 'mix' | Direction

export interface OptionItem {
  wordId: string
  text: string
  pos: string
}

export interface Question {
  key: string
  word: Word
  direction: Direction
  cue: Cue
  answerKind: AnswerKind
  options: OptionItem[]
  answer: number
}

/** FSRS card with dates serialised to epoch milliseconds. */
export interface StoredCard {
  due: number
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: number
  last_review?: number
}

export type SessionSize = 10 | 20 | 30 | 0

export interface Settings {
  sessionSize: SessionSize
  direction: DirectionPref
  autoSpeak: boolean
  romaji: boolean
  lastLesson: number
  /** remembered range for the custom study screen */
  customLessons: number[]
  customSections: number[]
}

export interface DayStat {
  answered: number
  correct: number
}

export interface Persisted {
  version: number
  cards: Record<string, StoredCard>
  /** wordId -> outstanding wrong answers (cleared as the word is answered right) */
  wrong: Record<string, number>
  daily: Record<string, DayStat>
  totals: { answered: number; correct: number }
  settings: Settings
}
