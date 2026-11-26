import { useId } from 'react'
import { motion, useReducedMotion } from 'motion/react'

export interface SegmentOption {
  value: string | number
  label: string
}

interface SegmentedProps {
  value: string | number
  options: SegmentOption[]
  onChange: (value: string | number) => void
  ariaLabel: string
  className?: string
}

/**
 * Sliding indicator segmented control (Aceternity "Tabs" / Uiverse toggles)
 * built on a shared layout animation.
 */
export function Segmented({ value, options, onChange, ariaLabel, className }: SegmentedProps) {
  const id = useId()
  const reduce = useReducedMotion()

  return (
    <div className={`seg${className ? ` ${className}` : ''}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            type="button"
            key={option.value}
            className={`seg__item${active ? ' is-on' : ''}`}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            {active ? (
              <motion.span
                layoutId={`seg-${id}`}
                className="seg__pill"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 480, damping: 40 }}
              />
            ) : null}
            <span className="seg__label">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
