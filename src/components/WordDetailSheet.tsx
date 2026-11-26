import { useEffect, useState } from 'react'
import { LESSON_BY_NO, SECTION_LABELS, romajiOf } from '../data/catalog'
import { formatDue } from '../lib/format'
import { masteryOf } from '../lib/srs'
import { speak, speechReady } from '../lib/tts'
import type { Word } from '../types'
import { useStore } from '../store'
import { Sheet } from './Sheet'
import { IconVolume } from './Icons'

const MASTERY_LABEL = ['未学习', '学习中', '复习中', '已熟练']

export function WordDetailSheet({
  word,
  onClose,
}: {
  word: Word | null
  onClose: () => void
}) {
  const { cardOf } = useStore()
  const [canSpeak, setCanSpeak] = useState(false)

  useEffect(() => {
    setCanSpeak(speechReady())
    const timer = window.setTimeout(() => setCanSpeak(speechReady()), 600)
    return () => window.clearTimeout(timer)
  }, [word])

  if (!word) {
    return <Sheet open={false} onClose={onClose}>{null}</Sheet>
  }

  const card = cardOf(word.id)
  const level = masteryOf(card)
  const lesson = LESSON_BY_NO.get(word.lesson)
  const reading = word.kana !== word.surface ? word.kana : ''

  return (
    <Sheet open={!!word} onClose={onClose} title="单词详情">
      <div className="detail">
        <div className="detail__hero">
          <div className="detail__words">
            <p className="detail__word jp">{word.surface}</p>
            {reading ? <p className="detail__kana jp">{reading}</p> : null}
            <p className="detail__romaji">{romajiOf(word)}</p>
          </div>
          <button
            type="button"
            className="speakbtn"
            onClick={() => speak(reading || word.surface)}
            disabled={!canSpeak}
            title={canSpeak ? '朗读' : '当前设备没有日语发音'}
            aria-label="朗读"
          >
            <IconVolume size={20} />
          </button>
        </div>

        <div className="detail__pos">{word.posZh}</div>
        <p className="detail__meaning">{word.meaning}</p>

        <dl className="detail__meta">
          <div>
            <dt>出处</dt>
            <dd>
              第 {word.lesson} 课 {lesson?.title ?? ''} · {SECTION_LABELS[word.section] ?? ''}
            </dd>
          </div>
          <div>
            <dt>掌握度</dt>
            <dd>{MASTERY_LABEL[level]}</dd>
          </div>
          <div>
            <dt>复习</dt>
            <dd>
              {card ? `已复习 ${card.reps} 次 · 下次 ${formatDue(card.due)}` : '尚未开始'}
            </dd>
          </div>
          <div>
            <dt>词性</dt>
            <dd>{word.pos}</dd>
          </div>
        </dl>
      </div>
    </Sheet>
  )
}
