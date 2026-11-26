import { useEffect, useState } from 'react'
import { LESSON_BY_NO, SECTION_LABELS, romajiOf } from '../data/catalog'
import { audioReady, clipAvailable, playClip, probeAudio } from '../lib/audio'
import { formatDue } from '../lib/format'
import { masteryOf } from '../lib/srs'
import {
  initSpeech,
  speak,
  speechHint,
  speechState,
  subscribeSpeech,
  type SpeechState,
} from '../lib/tts'
import type { Word } from '../types'
import { useStore } from '../store'
import { useToast } from './Toast'
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
  const toast = useToast()
  const [speech, setSpeech] = useState<SpeechState>(() => speechState())
  const [audio, setAudio] = useState(() => audioReady())

  useEffect(() => {
    initSpeech()
    setSpeech(speechState())
    void probeAudio().then(setAudio)
    return subscribeSpeech(() => setSpeech(speechState()))
  }, [])

  if (!word) {
    return <Sheet open={false} onClose={onClose}>{null}</Sheet>
  }

  const card = cardOf(word.id)
  const level = masteryOf(card)
  const lesson = LESSON_BY_NO.get(word.lesson)
  const reading = word.kana !== word.surface ? word.kana : ''

  const play = () => {
    if (clipAvailable(word.id) && playClip(word.id)) return
    const current = speechState()
    if (!current.ready) {
      toast(speechHint(current))
      return
    }
    speak(reading || word.surface)
  }
  const canHear = audio || speech.ready

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
            className={`speakbtn${canHear ? '' : ' is-muted'}`}
            onClick={play}
            title={canHear ? '朗读' : speechHint(speech)}
            aria-label={canHear ? '朗读' : '这台设备暂时没有日语发音'}
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
