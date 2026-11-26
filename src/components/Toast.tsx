import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { IconCheck } from './Icons'

interface ToastItem {
  id: number
  text: string
}

const ToastContext = createContext<(text: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const reduce = useReducedMotion()

  const push = useCallback((text: string) => {
    const id = nextId.current++
    setItems((current) => [...current.slice(-1), { id, text }])
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id))
    }, 2400)
  }, [])

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="toast"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <IconCheck size={15} />
              <span>{item.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
