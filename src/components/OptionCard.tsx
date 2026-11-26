import { motion, useReducedMotion } from 'motion/react'
import type { OptionItem } from '../types'
import { useSpotlight } from './useSpotlight'
import { IconCheck } from './Icons'

export type OptionStatus = 'idle' | 'correct' | 'wrong' | 'muted'

interface OptionCardProps {
  index: number
  option: OptionItem
  status: OptionStatus
  answered: boolean
  japanese: boolean
  onPick: () => void
  onDetail: (wordId: string) => void
}

export function OptionCard({
  index,
  option,
  status,
  answered,
  japanese,
  onPick,
  onDetail,
}: OptionCardProps) {
  const { ref, onPointerMove } = useSpotlight<HTMLDivElement>()
  const reduce = useReducedMotion()

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={`option option--${status}${answered ? ' option--answered' : ''}`}
    >
      <button
        type="button"
        className="option__main"
        onClick={onPick}
        disabled={answered}
        aria-label={`选项 ${index + 1}：${option.pos}，${option.text}`}
      >
        <span className="option__pos">
          {option.pos}
          {status === 'correct' ? (
            <motion.span
              className="option__mark"
              aria-hidden="true"
              initial={reduce ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 26 }}
            >
              <IconCheck size={11} />
            </motion.span>
          ) : null}
        </span>
        <span className={`option__text${japanese ? ' jp' : ''}`}>{option.text}</span>
      </button>
      {answered ? (
        <button
          type="button"
          className="option__detail"
          onClick={() => onDetail(option.wordId)}
          aria-label={`查看 ${option.text} 的详细释义`}
        >
          详细
        </button>
      ) : null}
    </div>
  )
}
