import { useMemo, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { WordDetailSheet } from '../components/WordDetailSheet'
import { IconClose, IconSearch } from '../components/Icons'
import { LESSONS, LESSON_BY_NO, WORDS, romajiOf } from '../data/catalog'
import { navigate, useRoute } from '../lib/router'
import { useStore } from '../store'
import type { Word } from '../types'

export function ListScreen() {
  const route = useRoute()
  const { state, updateSettings } = useStore()
  const [lesson, setLesson] = useState(() => Number(route.query.get('lesson') ?? 0))
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<Word | null>(null)
  const showRomaji = state.settings.romaji

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return WORDS.filter((word) => {
      if (lesson > 0 && word.lesson !== lesson) return false
      if (!needle) return true
      return (
        word.surface.includes(needle) ||
        word.kana.includes(needle) ||
        word.meaning.includes(needle) ||
        word.posZh.includes(needle) ||
        romajiOf(word).toLowerCase().includes(needle) ||
        word.id.includes(needle)
      )
    })
  }, [lesson, query])

  let lastLesson = -1

  return (
    <div className="screen screen--flush">
      <AppBar
        title="词表"
        onBack={() => navigate('/')}
        actions={
          <button
            type="button"
            className={`textbtn textbtn--boxed${showRomaji ? ' is-on' : ''}`}
            onClick={() => updateSettings({ romaji: !showRomaji })}
            aria-pressed={showRomaji}
            title="显示罗马音"
          >
            A
          </button>
        }
      />

      <main className="list">
        <div className="search">
          <IconSearch size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索汉字、假名、中文或罗马音"
            aria-label="搜索单词"
          />
          {query ? (
            <button
              type="button"
              className="search__clear"
              onClick={() => setQuery('')}
              aria-label="清空搜索"
            >
              <IconClose size={16} />
            </button>
          ) : null}
        </div>

        <div className="chips" role="tablist" aria-label="按课筛选">
          <button
            type="button"
            role="tab"
            aria-selected={lesson === 0}
            className={`chip${lesson === 0 ? ' is-on' : ''}`}
            onClick={() => setLesson(0)}
          >
            全部
          </button>
          {LESSONS.map((meta) => (
            <button
              type="button"
              role="tab"
              key={meta.lesson}
              aria-selected={lesson === meta.lesson}
              className={`chip${lesson === meta.lesson ? ' is-on' : ''}`}
              onClick={() => setLesson(meta.lesson)}
            >
              第 {meta.lesson} 课
            </button>
          ))}
        </div>

        <p className="list__count">
          共 <b>{filtered.length}</b> 词
          {lesson > 0 ? ` · 第 ${lesson} 课 ${LESSON_BY_NO.get(lesson)?.title ?? ''}` : ' · 第 1〜8 课'}
        </p>

        <div className="wlist">
          {filtered.map((word) => {
            const showGroup = lesson === 0 && word.lesson !== lastLesson
            if (showGroup) lastLesson = word.lesson
            const meta = LESSON_BY_NO.get(word.lesson)
            const reading = word.kana !== word.surface ? word.kana : ''
            return (
              <div key={word.id} className="wlist__item">
                {showGroup ? (
                  <div className="wgroup">
                    <span>
                      第 {word.lesson} 课 · {meta?.title}
                    </span>
                    <span>{meta?.count} 词</span>
                  </div>
                ) : null}
                <button type="button" className="wrow" onClick={() => setDetail(word)}>
                  <span className="wrow__left">
                    <span className="wrow__head">
                      <span className="wrow__word jp">{word.surface}</span>
                      {reading ? <span className="wrow__kana jp">{reading}</span> : null}
                      {showRomaji ? <span className="wrow__romaji">{romajiOf(word)}</span> : null}
                    </span>
                    <span className="wrow__meaning">{word.meaning}</span>
                  </span>
                  <span className="wrow__pos">{word.posZh}</span>
                </button>
              </div>
            )
          })}
          {!filtered.length ? (
            <div className="wlist__empty">
              <p>没有找到匹配的单词。</p>
              <button type="button" className="textbtn" onClick={() => { setQuery(''); setLesson(0) }}>
                清空筛选
              </button>
            </div>
          ) : null}
        </div>
      </main>

      <WordDetailSheet word={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
