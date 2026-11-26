import raw from '../data/words.json'
import type { LessonMeta, UnitMeta, Word } from '../types'
import { toRomaji } from 'wanakana'

export const WORDS = raw.words as Word[]
export const LESSONS = raw.lessons as LessonMeta[]
export const UNITS = raw.units as UnitMeta[]
export const META = raw.meta
export const TOTAL = WORDS.length

export const SECTION_LABELS: Record<number, string> = Object.fromEntries(
  (raw.sections as { index: number; label: string }[]).map((s) => [s.index, s.label]),
)

export const WORDS_BY_ID = new Map<string, Word>(WORDS.map((w) => [w.id, w]))
export const WORDS_BY_LESSON = new Map<number, Word[]>()
for (const w of WORDS) {
  const list = WORDS_BY_LESSON.get(w.lesson)
  if (list) list.push(w)
  else WORDS_BY_LESSON.set(w.lesson, [w])
}

export const LESSON_BY_NO = new Map<number, LessonMeta>(LESSONS.map((l) => [l.lesson, l]))

export const READABLE_WORDS = WORDS.filter((w) => w.kana !== w.surface)

const romajiCache = new Map<string, string>()
export function romajiOf(word: Word): string {
  const cached = romajiCache.get(word.id)
  if (cached !== undefined) return cached
  let out = ''
  try {
    out = toRomaji(word.kana).replace(/\s+/g, ' ')
  } catch {
    out = ''
  }
  romajiCache.set(word.id, out)
  return out
}

export function lessonWordCount(lesson: number): number {
  return WORDS_BY_LESSON.get(lesson)?.length ?? 0
}
