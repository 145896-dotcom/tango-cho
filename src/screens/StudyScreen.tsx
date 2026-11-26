import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { motion, useReducedMotion } from 'motion/react'
import { AppBar } from '../components/AppBar'
import { OptionCard, type OptionStatus } from '../components/OptionCard'
import { Sheet } from '../components/Sheet'
import { WordDetailSheet } from '../components/WordDetailSheet'
import {
  IconArrowRight,
  IconChart,
  IconCheck,
  IconCheckCircle,
  IconGrid,
  IconList,
  IconMore,
  IconRefresh,
  IconSliders,
  IconSparkles,
  IconVolume,
  IconVolumeOff,
} from '../components/Icons'
import { LESSON_BY_NO, WORDS_BY_ID, romajiOf } from '../data/catalog'
import { formatDuration, formatPercent } from '../lib/format'
import { navigate, useRoute } from '../lib/router'
import { buildSession, parseList, scopeOf, type Scope } from '../lib/session'
import type { GradeKey } from '../lib/srs'
import {
  NO_VOICE_HINT,
  initSpeech,
  speak,
  speechState,
  subscribeSpeech,
  type SpeechState,
} from '../lib/tts'
import { useStore } from '../store'
import { useToast } from '../components/Toast'
import type { Question, Word } from '../types'

interface Summary {
  total: number
  correct: number
  ms: number
}

export function StudyScreen() {
  const route = useRoute()
  const { state, reviewWord, updateSettings } = useStore()
  const toast = useToast()
  const reduce = useReducedMotion()

  const lessonParam = Number(route.query.get('lesson') ?? 0)
  const lessonsParam = parseList(route.query.get('l'), 8)
  const sectionsParam = parseList(route.query.get('s'), 6)
  const scope: Scope = scopeOf(lessonParam, route.query.get('scope'))
  const nonce = Number(route.query.get('n') ?? 0)
  const force = route.query.get('force') === '1'

  const [session] = useState(() =>
    buildSession({
      scope,
      lesson: lessonParam,
      lessons: lessonsParam,
      sections: sectionsParam,
      cards: state.cards,
      wrong: state.wrong,
      size: state.settings.sessionSize,
      direction: state.settings.direction,
      force,
    }),
  )
  const { questions } = session
  const total = questions.length

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [detailWord, setDetailWord] = useState<Word | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [speech, setSpeech] = useState<SpeechState>(() => speechState())
  const warnedNoVoice = useRef(false)

  const startedAt = useRef(Date.now())
  const shownAt = useRef(Date.now())

  useEffect(() => {
    initSpeech()
    setSpeech(speechState())
    return subscribeSpeech(() => setSpeech(speechState()))
  }, [])

  const speakOrExplain = (text: string) => {
    if (!speechState().ready) {
      toast(NO_VOICE_HINT)
      return
    }
    speak(text)
  }

  const playWord = (word: Word) => {
    if (!state.settings.autoSpeak) return
    if (!speechState().ready) {
      if (!warnedNoVoice.current) {
        warnedNoVoice.current = true
        toast(NO_VOICE_HINT)
      }
      return
    }
    speak(word.kana)
  }

  // Remember the lesson the learner actually opened, so "继续学习" stays true.
  useEffect(() => {
    if (scope === 'lesson' && lessonParam > 0 && state.settings.lastLesson !== lessonParam) {
      updateSettings({ lastLesson: lessonParam })
    }
  }, [scope, lessonParam, state.settings.lastLesson, updateSettings])

  const q: Question | undefined = questions[idx]

  const replayHref = (() => {
    const params = new URLSearchParams(route.query)
    params.set('n', String(nonce + 1))
    return `/study?${params.toString()}`
  })()

  const finish = () => {
    setSummary({ total, correct: correctCount, ms: Date.now() - startedAt.current })
  }

  const advance = () => {
    if (idx + 1 >= total) {
      finish()
      return
    }
    setIdx((value) => value + 1)
    setPicked(null)
    setAnswered(false)
    shownAt.current = Date.now()
  }

  const pick = (choice: number) => {
    if (answered || !q) return
    const ok = choice === q.answer
    const elapsed = Date.now() - shownAt.current
    const grade: GradeKey = !ok ? 'again' : elapsed < 2600 ? 'easy' : elapsed > 12000 ? 'hard' : 'good'
    setPicked(choice)
    setAnswered(true)
    if (ok) setCorrectCount((value) => value + 1)
    reviewWord(q.word.id, grade)
    playWord(q.word)
  }

  const reveal = () => {
    if (answered || !q) return
    setPicked(null)
    setAnswered(true)
    reviewWord(q.word.id, 'again')
    playWord(q.word)
  }

  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {})
  keyHandler.current = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const target = event.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
    if (detailWord || menuOpen || summary) return
    if (!answered && /^[1-4]$/.test(event.key)) {
      event.preventDefault()
      pick(Number(event.key) - 1)
      return
    }
    if (answered && (event.key === 'Enter' || event.key === ' ')) {
      if (target?.closest('button')) return
      event.preventDefault()
      advance()
    }
  }

  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandler.current(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  useEffect(() => {
    if (!summary) return
    if (summary.total > 0 && summary.correct / summary.total >= 0.8 && !reduce) {
      confetti({
        particleCount: 80,
        spread: 72,
        startVelocity: 34,
        gravity: 0.9,
        ticks: 180,
        origin: { y: 0.72 },
        colors: ['#8fe8d2', '#b6f3e3', '#4fd1b3', '#e9f4f0'],
        disableForReducedMotion: true,
      })
    }
  }, [summary, reduce])

  const statusFor = (index: number): OptionStatus => {
    if (!answered || !q) return 'idle'
    if (index === q.answer) return 'correct'
    if (index === picked) return 'wrong'
    return 'muted'
  }

  const scopeLabel = (() => {
    if (scope === 'lesson') {
      const meta = LESSON_BY_NO.get(lessonParam)
      return meta ? `第 ${meta.lesson} 课 · ${meta.title}` : ''
    }
    if (scope === 'today') return '今日复习'
    if (scope === 'mistakes') return '错题重练'
    if (scope === 'custom') return `${lessonsParam.length} 课 · ${sectionsParam.length} 部分`
    return '全部单词'
  })()

  const header = (
    <AppBar
      title="经典模式"
      progress={total ? (idx + (answered ? 1 : 0)) / total : 0}
      onBack={() => navigate('/')}
      actions={
        <>
          <button
            type="button"
            className="iconbtn"
            onClick={() => updateSettings({ autoSpeak: !state.settings.autoSpeak })}
            aria-label={state.settings.autoSpeak ? '关闭自动发音' : '开启自动发音'}
            title={state.settings.autoSpeak ? '自动发音：开' : '自动发音：关'}
          >
            {state.settings.autoSpeak ? <IconVolume size={20} /> : <IconVolumeOff size={20} />}
          </button>
          <button
            type="button"
            className="iconbtn"
            onClick={() => setMenuOpen(true)}
            aria-label="更多"
          >
            <IconMore size={20} />
          </button>
        </>
      }
    />
  )

  if (summary) {
    const ratio = summary.total ? summary.correct / summary.total : 0
    return (
      <div className="screen screen--flush screen--app">
        <AppBar title="经典模式" onBack={() => navigate('/')} />
        <div className="summary">
          <div className="summary__badge">
            <IconCheckCircle size={40} />
          </div>
          <h2 className="summary__title">{ratio >= 0.8 ? '记得很稳。' : '再巩固一下。'}</h2>
          <p className="summary__meta">
            {summary.total} 题 · {formatPercent(ratio)} 正确 · {formatDuration(summary.ms)}
          </p>
          <div className="summary__actions">
            <button type="button" className="primary" onClick={() => navigate(replayHref)}>
              再来一轮
              <IconRefresh size={18} />
            </button>
            <button type="button" className="ghostbtn" onClick={() => navigate('/')}>
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!total || !q) {
    const copy: Record<string, { title: string; body: string }> = {
      'no-due': { title: '今天的复习已完成', body: '没有到期的单词，去学几个新的吧。' },
      'no-mistakes': { title: '还没有错题', body: '答错的词会出现在这里，先把新词过一遍。' },
      finished: { title: '这一范围都学过了', body: '想再巩固一遍，可以重新过一轮。' },
      empty: { title: '还没有选择范围', body: '选几课和几个词表部分，就可以开始。' },
    }
    const text = copy[session.reason] ?? copy.finished
    return (
      <div className="screen screen--flush screen--app">
        {header}
        <div className="empty">
          <div className="empty__icon">
            <IconSparkles size={26} />
          </div>
          <h2>{text.title}</h2>
          <p>{text.body}</p>
          <div className="empty__actions">
            {session.reason === 'empty' ? (
              <button type="button" className="primary" onClick={() => navigate('/select')}>
                去选范围 <IconSliders size={18} />
              </button>
            ) : session.reason === 'finished' ? (
              <button
                type="button"
                className="primary"
                onClick={() => navigate(`${replayHref}&force=1`)}
              >
                重新过一轮 <IconRefresh size={18} />
              </button>
            ) : session.reason === 'no-mistakes' ? (
              <button type="button" className="primary" onClick={() => navigate('/select')}>
                自选范围 <IconSliders size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                onClick={() => navigate(`/study?lesson=${state.settings.lastLesson}`)}
              >
                学习新课 <IconArrowRight size={18} />
              </button>
            )}
            <button type="button" className="ghostbtn" onClick={() => navigate('/')}>
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  const kanaOnly = q.word.kana === q.word.surface
  const reading = kanaOnly ? romajiOf(q.word) : q.word.kana
  const note = (() => {
    switch (q.direction) {
      case 'w2m':
        return { label: kanaOnly ? '罗马音' : '读音', value: reading, jp: !kanaOnly }
      case 'w2k':
        return { label: '释义', value: q.word.meaning, jp: false }
      default:
        return { label: '表记', value: q.word.surface, jp: true }
    }
  })()
  const ok = picked === q.answer
  const cueValue =
    q.cue === 'meaning' ? q.word.meaning : q.cue === 'kana' ? q.word.kana : q.word.surface
  const cueLong = q.cue === 'meaning' ? cueValue.length > 16 : cueValue.length >= 8

  const spring = reduce ? { duration: 0 } : { duration: 0.34, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <div className="screen screen--flush screen--app">
      {header}
      <main className="study">
        <div className="study__meta">
          <span className="study__counter">
            第 {idx + 1} / {total} 题
          </span>
          <span className="study__scope">{scopeLabel}</span>
        </div>

        {/* Keyed by question: the entrance is the authored moment, and the
            next question never waits on an exit animation. */}
        <motion.div
          key={q.key}
          className="study__block"
          initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(7px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={spring}
        >
            <div className="prompt">
              {q.cue === 'word' ? (
                <p className={`prompt__word jp${cueLong ? ' is-long' : ''}`}>
                  {cueValue}
                  <span className="caret" aria-hidden="true" />
                </p>
              ) : q.cue === 'kana' ? (
                <p className={`prompt__kana jp${cueLong ? ' is-long' : ''}`}>{cueValue}</p>
              ) : (
                <p className={`prompt__meaning${cueLong ? ' is-long' : ''}`}>{cueValue}</p>
              )}
              <p className="prompt__ask">
                请选择正确的<em>{q.answerKind === 'kana' ? '假名' : '中文词义'}</em>
              </p>
            </div>

            <div className="study__options">
              {q.options.map((option, index) => (
                <OptionCard
                  key={option.wordId}
                  index={index}
                  option={option}
                  status={statusFor(index)}
                  answered={answered}
                  japanese={q.answerKind === 'kana'}
                  onPick={() => pick(index)}
                  onDetail={(wordId) => setDetailWord(WORDS_BY_ID.get(wordId) ?? null)}
                />
              ))}
            </div>

            {answered ? (
              <div
                className={`answer-note${ok ? ' is-ok' : ' is-bad'}`}
                role="status"
                aria-live="polite"
              >
                <span className="answer-note__label">{note.label}</span>
                <span className={`answer-note__value${note.jp ? ' jp' : ''}`}>{note.value}</span>
                <button
                  type="button"
                  className={`answer-note__speak${speech.ready ? '' : ' is-muted'}`}
                  onClick={() => speakOrExplain(q.word.kana)}
                  aria-label={speech.ready ? '朗读单词' : '当前设备没有日语语音'}
                  title={
                    speech.ready
                      ? '朗读'
                      : '当前设备没有日语语音，点一下看怎么安装'
                  }
                >
                  <IconVolume size={17} />
                </button>
                <span className="answer-note__verdict">{ok ? '回答正确' : '再记一次'}</span>
              </div>
            ) : (
              <p className="study__tip">
                <IconCheck size={14} /> 提示：可直接按 1–4 选择，Enter 继续
              </p>
            )}
        </motion.div>

        <div className="study__spacer" aria-hidden="true" />
      </main>

      <footer className="actionbar">
        <button type="button" className="pill" onClick={answered ? advance : reveal}>
          {answered ? (idx + 1 >= total ? '查看结果' : '继续') : '看答案'}
          {answered ? <IconArrowRight size={18} /> : <IconCheck size={18} />}
        </button>
      </footer>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="本轮选项">
        <div className="menu">
          <button
            type="button"
            className="menu__item"
            onClick={() => {
              setMenuOpen(false)
              navigate('/stats')
            }}
          >
            <IconChart size={18} /> 学习统计
          </button>
          <button
            type="button"
            className="menu__item"
            onClick={() => {
              setMenuOpen(false)
              navigate('/select')
            }}
          >
            <IconSliders size={18} /> 换一个范围
          </button>
          <button
            type="button"
            className="menu__item"
            onClick={() => {
              setMenuOpen(false)
              navigate('/list')
            }}
          >
            <IconList size={18} /> 词表
          </button>
          {scope === 'lesson' ? (
            <button
              type="button"
              className="menu__item"
              onClick={() => {
                setMenuOpen(false)
                navigate(`/match?lesson=${lessonParam}`)
              }}
            >
              <IconGrid size={18} /> 本课配对复习
            </button>
          ) : null}
          <button
            type="button"
            className="menu__item"
            onClick={() => {
              setMenuOpen(false)
              navigate(replayHref)
            }}
          >
            <IconRefresh size={18} /> 重新开始本轮
          </button>
          <button
            type="button"
            className="menu__item menu__item--danger"
            onClick={() => {
              setMenuOpen(false)
              navigate('/')
            }}
          >
            结束并返回首页
          </button>
        </div>
      </Sheet>

      <WordDetailSheet word={detailWord} onClose={() => setDetailWord(null)} />
    </div>
  )
}
