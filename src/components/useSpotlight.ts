import { useCallback, useRef, type PointerEvent } from 'react'

/**
 * Tracks the pointer inside an element and exposes it as --spot-x / --spot-y,
 * so a radial highlight can follow the cursor (React Bits "Spotlight Card").
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)

  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    node.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
    node.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
  }, [])

  return { ref, onPointerMove }
}
