import { useEffect, useRef, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { Sheet } from '../components/Sheet'
import { WordDetailSheet } from '../components/WordDetailSheet'
import { IconBulb, IconCheck, IconHelp, IconRefresh } from '../components/Icons'
import { LESSON_BY_NO, WORDS, WORDS_BY_LESSON } from '../data/catalog'
import { formatDuration } from '../lib/format'
import { shuffle } from '../lib/quiz'
import { navigate, useRoute } from '../lib/router'
import { useStore } from '../store'
import type { Word } from '../types'

interface Round {
  pairs: Word[]
  left: Word[]
  right: Word[]
}

const ROUNDS = 3
const PER_ROUND = 4

function buildRounds(pool: Word[], roundCount: number, perRound: number): Round[] {
  const usable = shuffle(
    pool.filter(
      (word) =>
        word.kana !== word.surface && word.surface.length <= 8 && !word.surface.includes('～'),
    ),
  )
  const rounds: Round[] = []
  for (let i = 0; i + perRound <= usable.length && rounds.length < roundCount; i += perRound) {
    const slice = usable.slice(i, i + perRound)
    if (new Set(slice.map((word) => word.kana)).size !== slice.length) continue
    rounds.push({ pairs: slice, left: shuffle(slice), right: shuffle(slice) })
  }
  return rounds
}

export function MatchScreen() {
  const route = useRoute()
  const { reviewWord } = useStore()
  const lessonParam = Number(route.query.get('lesson') ?? 0)
  const pool = lessonParam > 0 ? WORDS_BY_LESSON.get(lessonParam) ?? WORDS : WORDS

  const [rounds] = useState(() => buildRounds(pool, ROUNDS, PER_ROUND))
  const [roundIdx, setRoundIdx] = useState(0)
  const [matched, setMatched] = useState<Set<string>>(() => new Set())
  const [sel, setSel] = useState<{ side: 'left' | 'right'; id: string } | null>(null)
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null)
  const [mistakes, setMistakes] = useState<Record<string, number>>({})
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [detailWord, setDetailWord] = useState<Word | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [summary, setSummary] = useState<{ words: number; wrong: number; ms: number } | null>(null)

  const startedAt = useRef(Date.now())
  const wrongTimer = useRef<number | null>(null)
  const advanceTimer = useRef<number | null>(null)
  const pressTimer = useRef<number | null>(null)
  const pressConsumed = useRef(false)

  useEffect(
    () => () => {
      if (wrongTimer.current) window.clearTimeout(wrongTimer.current)
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
      if (pressTimer.current) window.clearTimeout(pressTimer.current)
    },
    [],
  )

  const round = rounds[roundIdx]
  const totalPairs = rounds.length * PER_ROUND
  const solved = roundIdx * PER_ROUND + matched.size
  const progress = totalPairs ? solved / totalPairs : 0

  const startPress = (word: Word) => {
    pressConsumed.current = false
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => {
      pressConsumed.current = true
      setDetailWord(word)
    }, 430)
  }

  const cancelPress = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const finish = () => {
    setSummary({
      words: rounds.length * PER_ROUND,
      wrong: wrongAttempts,
      ms: Date.now() - startedAt.current,
    })
  }

  const completeRound = () => {
    advanceTimer.current = window.setTimeout(() => {
      if (roundIdx + 1 >= rounds.length) {
        finish()
        return
      }
      setRoundIdx((value) => value + 1)
      setMatched(new Set())
      setSel(null)
    }, 760)
  }

  const select = (side: 'left' | 'right', word: Word) => {
    if (!round || matched.has(word.id) || wrong) return
    if (!sel) {
      setSel({ side, id: word.id })
      return
    }
    if (sel.side === side) {
      setSel({ side, id: word.id })
      return
    }
    const leftId = side === 'left' ? word.id : sel.id
    const rightId = side === 'right' ? word.id : sel.id
    if (leftId === rightId) {
      const next = new Set(matched)
      next.add(word.id)
      setMatched(next)
      setSel(null)
      reviewWord(word.id, mistakes[word.id] ? 'hard' : 'good')
      if (next.size === round.pairs.length) completeRound()
      return
    }
    setWrongAttempts((value) => value + 1)
    setMistakes((current) => ({
      ...current,
      [leftId]: (current[leftId] ?? 0) + 1,
      [rightId]: (current[rightId] ?? 0) + 1,
    }))
    setWrong({ left: leftId, right: rightId })
    wrongTimer.current = window.setTimeout(() => {
      setWrong(null)
      setSel(null)
    }, 560)
  }

  const header = (
    <AppBar
      title="经典复习"
      progress={progress}
      onBack={() => navigate('/')}
      actions={
        <button type="button" className="iconbtn" onClick={() => setHelpOpen(true)} aria-label="玩法说明">
          <IconHelp size={20} />
        </button>
      }
    />
  )

  if (summary) {
    return (
      <div className="screen screen--flush">
        <AppBar title="经典复习" onBack={() => navigate('/')} />
        <div className="summary">
          <div className="summary__badge">
            <IconCheck size={40} />
          </div>
          <p className="summary__eyebrow">配对完成</p>
          <h2 className="summary__title">眼和耳都记住了。</h2>
          <div className="summary__grid">
            <div>
              <b>{summary.words}</b>
              <span>配对</span>
            </div>
            <div>
              <b>{summary.wrong}</b>
              <span>答错次数</span>
            </div>
            <div>
              <b>{formatDuration(summary.ms)}</b>
              <span>用时</span>
            </div>
          </div>
          <div className="summary__actions">
            <button
              type="button"
              className="pill pill--wide"
              onClick={() => navigate(`/match?n=${Date.now()}`)}
            >
              再来一组 <IconRefresh size={18} />
            </button>
            <button type="button" className="ghostbtn" onClick={() => navigate('/')}>
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!round) {
    return (
      <div className="screen screen--flush">
        {header}
        <div className="empty">
          <h2>这里还没有可配对的单词</h2>
          <p>换一课试试，或先去背几个新词。</p>
          <div className="empty__actions">
            <button type="button" className="pill" onClick={() => navigate('/study')}>
              去背单词
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stateOf = (side: 'left' | 'right', word: Word) => {
    if (matched.has(word.id)) return 'matched'
    if (sel?.side === side && sel.id === word.id) return 'selected'
    if (wrong && ((side === 'left' && wrong.left === word.id) || (side === 'right' && wrong.right === word.id))) {
      return 'wrong'
    }
    return 'idle'
  }

  return (
    <div className="screen screen--flush">
      {header}
      <main className="match">
        <div className="match__head">
          <span>
            第 {roundIdx + 1} / {rounds.length} 组
          </span>
          <span>
            {PER_ROUND} 对 ·{' '}
            {lessonParam
              ? `第 ${lessonParam} 课 ${LESSON_BY_NO.get(lessonParam)?.title ?? ''}`
              : '全部单词'}
          </span>
        </div>

        <div className="match__stage">
          <div className="match__grid">
            <div className="match__col">
              {round.left.map((word) => (
                <button
                  type="button"
                  key={word.id}
                  className={`mcard mcard--left mcard--${stateOf('left', word)}`}
                  onPointerDown={() => startPress(word)}
                  onPointerUp={cancelPress}
                  onPointerMove={cancelPress}
                  onPointerCancel={cancelPress}
                  onPointerLeave={cancelPress}
                  onClick={() => {
                    if (pressConsumed.current) {
                      pressConsumed.current = false
                      return
                    }
                    select('left', word)
                  }}
                  aria-label={`单词 ${word.surface}`}
                >
                  <span className="jp">{word.surface}</span>
                  {matched.has(word.id) ? (
                    <span className="mcard__tick" aria-hidden="true">
                      <IconCheck size={12} />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="match__col">
              {round.right.map((word) => (
                <button
                  type="button"
                  key={word.id}
                  className={`mcard mcard--right mcard--${stateOf('right', word)}`}
                  onClick={() => select('right', word)}
                  aria-label={`假名 ${word.kana}`}
                >
                  <span className="jp">{word.kana}</span>
                  {matched.has(word.id) ? (
                    <span className="mcard__tick" aria-hidden="true">
                      <IconCheck size={12} />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="match__foot">
          <IconBulb size={16} />
          <span>长按左侧单词，可查看单词详情</span>
        </div>
      </main>

      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="怎么玩">
        <ul className="bullets">
          <li>左侧是单词，右侧是它的假名读音。</li>
          <li>先点一个单词，再点对应的假名；配对正确会点亮并记入复习。</li>
          <li>点错会轻轻抖一下，并计入本轮错误次数。</li>
          <li>长按左侧单词可以查看释义、词性和读音。</li>
        </ul>
      </Sheet>

      <WordDetailSheet word={detailWord} onClose={() => setDetailWord(null)} />
    </div>
  )
}
