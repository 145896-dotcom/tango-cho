import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from './Icons'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function Sheet({ open, onClose, title, description, children, footer }: SheetProps) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (open) {
      setMounted(true)
      // The class flip has to land one frame after mount so the transform has
      // a starting point; a timeout covers environments where rAF is throttled.
      const frame = requestAnimationFrame(() => setVisible(true))
      const fallback = window.setTimeout(() => setVisible(true), 60)
      return () => {
        cancelAnimationFrame(frame)
        window.clearTimeout(fallback)
      }
    }
    setVisible(false)
    const timer = window.setTimeout(() => setMounted(false), 260)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mounted])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open && panelRef.current) {
      const focusable = panelRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus({ preventScroll: true })
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <div className={`sheet${visible ? ' is-visible' : ''}`}>
      <div className="sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        ref={panelRef}
      >
        <div className="sheet__grip" aria-hidden="true" />
        {title ? (
          <div className="sheet__head">
            <div>
              <h2 id={titleId} className="sheet__title">
                {title}
              </h2>
              {description ? <p className="sheet__desc">{description}</p> : null}
            </div>
            <button type="button" className="iconbtn" onClick={onClose} aria-label="关闭">
              <IconClose size={20} />
            </button>
          </div>
        ) : null}
        <div className="sheet__body">{children}</div>
        {footer ? <div className="sheet__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
