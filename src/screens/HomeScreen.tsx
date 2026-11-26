import { useState } from 'react'
import { LESSONS, LESSON_BY_NO, TOTAL, UNITS, lessonWordCount } from '../data/catalog'
import { pad2 } from '../lib/format'
import { navigate } from '../lib/router'
import { useStore } from '../store'
import { CountUp } from '../components/CountUp'
import { Sheet } from '../components/Sheet'
import { useToast } from '../components/Toast'
import {
  IconArrowRight,
  IconChart,
  IconGrid,
  IconList,
  IconRotate,
  IconSliders,
} from '../components/Icons'

interface ResetTarget {
  title: string
  lessons: number[]
  studied: number
}

export function HomeScreen() {
  const { derived, state, resetRange } = useStore()
  const toast = useToast()
  const [reset, setReset] = useState<ResetTarget | null>(null)

  const lastLesson = LESSON_BY_NO.get(state.settings.lastLesson) ?? LESSONS[0]
  const studiedRatio = TOTAL ? derived.studied / TOTAL : 0

  const startStudy = () => {
    if (derived.due > 0) navigate('/study?scope=today')
    else navigate(`/study?lesson=${lastLesson.lesson}`)
  }

  const askReset = (title: string, lessons: number[]) => {
    const studied = lessons.reduce(
      (sum, lesson) => sum + (derived.byLesson.get(lesson)?.studied ?? 0),
      0,
    )
    setReset({ title, lessons, studied })
  }

  const confirmReset = () => {
    if (!reset) return
    resetRange({ lessons: reset.lessons })
    toast(`已重置「${reset.title}」的学习进度`)
    setReset(null)
  }

  return (
    <div className="screen home">
      <header className="home__head">
        <div className="brand">
          <span className="brand__word jp">単語帖</span>
          <span className="brand__meta">新经典日本语 · 第二册</span>
        </div>
        <div className="home__tools">
          <button
            type="button"
            className="iconbtn"
            onClick={() => navigate('/select')}
            aria-label="自选学习范围"
            title="自选范围"
          >
            <IconSliders size={20} />
          </button>
          <button
            type="button"
            className="iconbtn"
            onClick={() => navigate('/stats')}
            aria-label="学习统计"
            title="学习统计"
          >
            <IconChart size={20} />
          </button>
        </div>
      </header>

      <section className="hero">
        <h1 className="hero__title">今天也记几个词。</h1>
        <p className="hero__meta">
          <span>
            <CountUp value={derived.studied} /> / {TOTAL} 已学
          </span>
          <span className="hero__meta-sep" aria-hidden="true" />
          <span className={derived.due > 0 ? 'is-hot' : undefined}>
            <CountUp value={derived.due} /> 待复习
          </span>
          <span className="hero__meta-sep" aria-hidden="true" />
          <span>连续 {derived.streak} 天</span>
        </p>
        <div
          className="meter"
          role="progressbar"
          aria-label="总体学习进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(studiedRatio * 100)}
        >
          <i style={{ width: `${studiedRatio * 100}%` }} />
        </div>

        <button type="button" className="primary" onClick={startStudy}>
          <span className="primary__label">
            {derived.due > 0 ? '开始今日复习' : `继续第 ${lastLesson.lesson} 课`}
          </span>
          <span className="primary__meta">
            {derived.due > 0
              ? `${derived.due} 个到期`
              : `${lessonWordCount(lastLesson.lesson)} 词`}
          </span>
          <IconArrowRight size={19} />
        </button>
      </section>

      <nav className="home__nav" aria-label="更多学习方式">
        <button type="button" onClick={() => navigate('/select')}>
          <IconSliders size={17} />
          <span>自选范围</span>
        </button>
        <button type="button" onClick={() => navigate('/match')}>
          <IconGrid size={17} />
          <span>配对复习</span>
        </button>
        <button type="button" onClick={() => navigate('/list')}>
          <IconList size={17} />
          <span>词表</span>
        </button>
      </nav>

      <section className="lessons">
        <div className="sec-head">
          <h2>按课学习</h2>
          <span className="sec-head__meta">
            {derived.studied} / {TOTAL}
          </span>
        </div>

        {UNITS.map((unit) => (
          <section className="unit" key={unit.unit}>
            <header className="unit__head">
              <h3>
                {unit.label}
                <em>{unit.range}</em>
              </h3>
              <button
                type="button"
                className="mini"
                onClick={() => askReset(unit.label, unit.lessons)}
                aria-label={`重置${unit.label}的进度`}
                title="重置本单元进度"
              >
                <IconRotate size={13} />
                重置
              </button>
            </header>

            <ul className="lesson-list">
              {unit.lessons.map((no) => {
                const meta = LESSON_BY_NO.get(no)
                const progress = derived.byLesson.get(no)
                if (!meta || !progress) return null
                const ratio = progress.total ? progress.studied / progress.total : 0
                return (
                  <li
                    className={`lesson${no === lastLesson.lesson ? ' is-current' : ''}`}
                    key={no}
                  >
                    <button
                      type="button"
                      className="lesson__main"
                      onClick={() => navigate(`/study?lesson=${no}`)}
                    >
                      <span className="lesson__no">{pad2(no)}</span>
                      <span className="lesson__body">
                        <span className="lesson__title jp">{meta.title}</span>
                        <span className="lesson__sub">
                          {meta.topic} · {progress.total} 词
                        </span>
                      </span>
                      <span className="lesson__right">
                        {progress.due > 0 ? (
                          <span className="badge" title={`${progress.due} 个待复习`}>
                            {progress.due}
                          </span>
                        ) : null}
                        <span className="lesson__count">
                          {progress.studied}/{progress.total}
                        </span>
                      </span>
                      <span className="lesson__meter" aria-hidden="true">
                        <i style={{ width: `${ratio * 100}%` }} />
                      </span>
                    </button>
                    <button
                      type="button"
                      className="lesson__reset"
                      onClick={() => askReset(`第 ${no} 课`, [no])}
                      aria-label={`重置第 ${no} 课的进度`}
                      title="重置本课"
                    >
                      <IconRotate size={15} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </section>

      <footer className="home__foot">
        <p>词库来自《新经典日本语 基础教程 第二册》第 1〜8 课</p>
        <p>
          {TOTAL} 张词卡 · 数据保存在本机 ·{' '}
          <button type="button" className="linkbtn" onClick={() => navigate('/stats')}>
            设置与统计
          </button>
        </p>
      </footer>

      <Sheet
        open={!!reset}
        onClose={() => setReset(null)}
        title="重置学习进度？"
        description={`将清除「${reset?.title ?? ''}」的复习记录，单词本身和总的正确率不受影响。`}
        footer={
          <div className="sheet__actions">
            <button type="button" className="ghostbtn" onClick={() => setReset(null)}>
              取消
            </button>
            <button type="button" className="pill pill--danger" onClick={confirmReset}>
              <IconRotate size={17} />
              确认重置
            </button>
          </div>
        }
      >
        <p className="sheet__note">
          这一范围里学过 <b>{reset?.studied ?? 0}</b> 个词，重置后它们会重新回到待学状态。
        </p>
      </Sheet>
    </div>
  )
}
