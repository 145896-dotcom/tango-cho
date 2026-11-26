import { useLayoutEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'motion/react'

/** Count-up from the previous value, ease-out expo (React Bits "Count Up"). */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef(0)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const from = previous.current
    previous.current = value
    if (reduce || from === value) {
      node.textContent = String(value)
      return
    }
    const controls = animate(from, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = String(Math.round(latest))
      },
    })
    return () => controls.stop()
  }, [value, reduce])

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  )
}
