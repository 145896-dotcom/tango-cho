import { useMemo, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { Sheet } from '../components/Sheet'
import { useToast } from '../components/Toast'
import {
  LESSON_BY_NO,
  SECTION_LABELS,
  TOTAL,
  UNITS,
  WORDS,
} from '../data/catalog'
import { pad2 } from '../lib/format'
import { navigate } from '../lib/router'
import { useStore } from '../store'
import {
  IconArrowRight,
  IconCheckSquare,
  IconRotate,
  IconSquare,
} from '../components/Icons'

export function SelectScreen() {
  const { state, updateSettings, resetRange } = useStore()
  const toast = useToast()
  const [lessons, setLessons] = useState<number[]>(state.settings.customLessons)
  const [sections, setSections] = useState<number[]>(state.settings.customSections)
  const [confirmReset, setConfirmReset] = useState(false)

  const sectionCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const word of WORDS) {
      if (!lessons.includes(word.lesson)) continue
      counts.set(word.section, (counts.get(word.section) ?? 0) + 1)
    }
    return counts
  }, [lessons])

  const effectiveSections = useMemo(
    () => sections.filter((section) => (sectionCounts.get(section) ?? 0) > 0),
    [sections, sectionCounts],
  )

  const total = useMemo(
    () => effectiveSections.reduce((sum, section) => sum + (sectionCounts.get(section) ?? 0), 0),
    [effectiveSections, sectionCounts],
  )

  const studied = useMemo(
    () =>
      WORDS.filter(
        (word) =>
          lessons.includes(word.lesson) &&
          sections.includes(word.section) &&
          state.cards[word.id],
      ).length,
    [lessons, sections, state.cards],
  )

  const toggleLesson = (lesson: number) => {
    setLessons((current) =>
      current.includes(lesson)
        ? current.filter((value) => value !== lesson)
        : [...current, lesson].sort((a, b) => a - b),
    )
  }

  const toggleSection = (section: number) => {
    setSections((current) =>
      current.includes(section)
        ? current.filter((value) => value !== section)
        : [...current, section].sort((a, b) => a - b),
    )
  }

  const toggleUnit = (unitLessons: number[]) => {
    setLessons((current) => {
      const allOn = unitLessons.every((lesson) => current.includes(lesson))
      if (allOn) return current.filter((lesson) => !unitLessons.includes(lesson))
      return [...new Set([...current, ...unitLessons])].sort((a, b) => a - b)
    })
  }

  const allLessons = lessons.length === UNITS.reduce((sum, unit) => sum + unit.lessons.length, 0)

  const start = () => {
    if (!total) return
    updateSettings({ customLessons: lessons, customSections: sections })
    navigate(`/study?scope=custom&l=${lessons.join(',')}&s=${effectiveSections.join(',')}`)
  }

  const doReset = () => {
    resetRange({ lessons, sections })
    toast('已重置所选范围的学习进度')
    setConfirmReset(false)
  }

  return (
    <div className="screen screen--flush screen--app">
      <AppBar
        title="自选范围"
        onBack={() => navigate('/')}
        actions={
          <span className="appbar__hint">
            {lessons.length} 课 · {total} 词
          </span>
        }
      />

      <main className="select">
        <p className="select__intro">
          按课和词表部分自由组合。到期复习的词会排在前面，其余按课本顺序出现。
        </p>

        <section className="pick">
          <header className="pick__head">
            <h2>按课</h2>
            <button
              type="button"
              className="linkbtn"
              onClick={() => setLessons(allLessons ? [] : UNITS.flatMap((unit) => unit.lessons))}
            >
              {allLessons ? '清空' : '全选 8 课'}
            </button>
          </header>

          {UNITS.map((unit) => {
            const allOn = unit.lessons.every((lesson) => lessons.includes(lesson))
            return (
              <div className="pick__unit" key={unit.unit}>
                <div className="pick__unit-label">
                  <span>
                    {unit.label} <em>{unit.range}</em>
                  </span>
                  <button type="button" className="linkbtn" onClick={() => toggleUnit(unit.lessons)}>
                    {allOn ? '取消本单元' : '全选本单元'}
                  </button>
                </div>
                {unit.lessons.map((no) => {
                  const meta = LESSON_BY_NO.get(no)
                  if (!meta) return null
                  const on = lessons.includes(no)
                  return (
                    <button
                      type="button"
                      key={no}
                      className={`pick-row${on ? ' is-on' : ''}`}
                      onClick={() => toggleLesson(no)}
                      aria-pressed={on}
                    >
                      <span className="pick-row__check">
                        {on ? <IconCheckSquare size={20} /> : <IconSquare size={20} />}
                      </span>
                      <span className="pick-row__no">{pad2(no)}</span>
                      <span className="pick-row__body">
                        <span className="pick-row__title jp">{meta.title}</span>
                        <span className="pick-row__sub">{meta.topic}</span>
                      </span>
                      <span className="pick-row__count">{meta.count} 词</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </section>

        <section className="pick">
          <header className="pick__head">
            <h2>词表部分</h2>
            <span className="pick__hint">可多选</span>
          </header>
          <div className="pick__sections">
            {Object.entries(SECTION_LABELS).map(([rawIndex, label]) => {
              const index = Number(rawIndex)
              const count = sectionCounts.get(index) ?? 0
              const on = sections.includes(index) && count > 0
              return (
                <button
                  type="button"
                  key={index}
                  className={`chip chip--pick${on ? ' is-on' : ''}`}
                  onClick={() => toggleSection(index)}
                  aria-pressed={on}
                  disabled={count === 0}
                >
                  <span>{label}</span>
                  <em>{count}</em>
                </button>
              )
            })}
          </div>
          <p className="pick__foot">
            全部 {TOTAL} 词 · 已选 {total} 词
            {studied > 0 ? ` · 其中 ${studied} 词学过` : ''}
          </p>
        </section>

        <button
          type="button"
          className="ghostbtn ghostbtn--sm select__reset"
          onClick={() => setConfirmReset(true)}
          disabled={!total}
        >
          <IconRotate size={15} />
          重置所选范围
        </button>
      </main>

      <footer className="select__bar">
        <div className="select__summary">
          <span>
            <b>{lessons.length}</b> 课 · <b>{effectiveSections.length}</b> 部分 ·{' '}
            <b>{total}</b> 词
          </span>
        </div>
        <button type="button" className="primary" onClick={start} disabled={total === 0}>
          开始学习
          <IconArrowRight size={18} />
        </button>
      </footer>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="重置所选范围？"
        description="只清除这一范围内的复习记录，其它课不受影响。"
        footer={
          <div className="sheet__actions">
            <button type="button" className="ghostbtn" onClick={() => setConfirmReset(false)}>
              取消
            </button>
            <button type="button" className="pill pill--danger" onClick={doReset}>
              <IconRotate size={17} />
              确认重置
            </button>
          </div>
        }
      >
        <p className="sheet__note">
          当前范围内学过 <b>{studied}</b> 个词，重置后它们会回到待学状态。
        </p>
      </Sheet>
    </div>
  )
}
